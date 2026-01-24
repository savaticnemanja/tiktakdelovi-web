import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Configuration via .env
const PROVIDER = "meta";

// Meta (WhatsApp Cloud API) vars (if using Meta)
const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || ""; // numeric id for your phone number in the Meta Cloud API
const META_TEMPLATE_NAME =
  process.env.META_TEMPLATE_NAME || "bid_request_to_seller";
const META_TEMPLATE_LANGUAGE = process.env.META_TEMPLATE_LANGUAGE || "en_US";
const META_TEMPLATE_OFFER_NAME =
  process.env.META_TEMPLATE_OFFER_NAME || "bid_offer_to_buyer";
const META_TEMPLATE_OWNER_NAME =
  process.env.META_TEMPLATE_OWNER_NAME || "bid_offer_to_owner";
const META_WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "";
const OWNER_NUMBER = process.env.OWNER_NUMBER || "";
const BID_STORE_TTL_HOURS = Number(process.env.BID_STORE_TTL_HOURS || "72");

// Sellers to broadcast to
const SELLER_NUMBERS = (process.env.SELLER_NUMBERS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const bidStore = new Map();
const bidStoreTtlMs = Number.isFinite(BID_STORE_TTL_HOURS)
  ? BID_STORE_TTL_HOURS * 60 * 60 * 1000
  : 72 * 60 * 60 * 1000;

const normalizePhone = (value) => String(value || "").replace(/^\+/, "").trim();

const sanitizeTemplateText = (value) =>
  String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();


const saveBidRequest = ({ bidId, bidMessage, customerNumber, name }) => {
  const cleanedBidId = sanitizeTemplateText(bidId);
  const cleanedBidMessage = sanitizeTemplateText(bidMessage);
  const cleanedCustomerNumber = normalizePhone(customerNumber);
  const cleanedName = sanitizeTemplateText(name);
  if (!cleanedBidId || !cleanedBidMessage || !cleanedCustomerNumber) {
    throw new Error("bidId, bidMessage and customerNumber are required.");
  }
  bidStore.set(cleanedBidId, {
    bidId: cleanedBidId,
    bidMessage: cleanedBidMessage,
    customerNumber: cleanedCustomerNumber,
    name: cleanedName,
    createdAt: Date.now(),
  });
  return bidStore.get(cleanedBidId);
};

const getBidRequest = (bidId) => {
  const cleanedBidId = sanitizeTemplateText(bidId);
  const bid = bidStore.get(cleanedBidId);
  if (!bid) {
    return null;
  }
  if (Date.now() - bid.createdAt > bidStoreTtlMs) {
    bidStore.delete(cleanedBidId);
    return null;
  }
  return bid;
};

const sendTemplateMessage = async ({ to, templateName, language, components }) => {
  if (!META_WHATSAPP_TOKEN || !META_PHONE_NUMBER_ID) {
    throw new Error("Meta Cloud API not configured.");
  }
  if (!templateName) {
    throw new Error("Meta template name missing.");
  }
  const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: normalizePhone(to),
    type: "template",
    template: {
      name: templateName,
      language: {
        code: language,
      },
      components,
    },
  };
  const metaResp = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  return { data: metaResp.data };
};

const sendBidRequestToSeller = async ({ to, bidId, bidMessage }) => {
  const sanitizedBidId = sanitizeTemplateText(bidId);
  const sanitizedBidMessage = sanitizeTemplateText(bidMessage);
  if (!sanitizedBidId || !sanitizedBidMessage) {
    throw new Error("bidId and bidMessage are required.");
  }
  return sendTemplateMessage({
    to,
    templateName: META_TEMPLATE_NAME,
    language: META_TEMPLATE_LANGUAGE,
    components: [
      {
        type: "header",
        parameters: [{ type: "text", parameter_name: "bid_id", text: sanitizedBidId }],
      },
      {
        type: "body",
        parameters: [{ type: "text", parameter_name: "bid_message", text: sanitizedBidMessage }],
      },
    ],
  });
};

const sendOfferToBuyer = async ({ to, bidId, bidDetails, bidOffer }) => {
  const sanitizedBidId = sanitizeTemplateText(bidId);
  const sanitizedBidDetails = sanitizeTemplateText(bidDetails);
  const sanitizedBidOffer = sanitizeTemplateText(bidOffer);
  if (!sanitizedBidId || !sanitizedBidDetails || !sanitizedBidOffer) {
    throw new Error("bidId, bidDetails and bidOffer are required.");
  }
  return sendTemplateMessage({
    to,
    templateName: META_TEMPLATE_OFFER_NAME,
    language: META_TEMPLATE_LANGUAGE,
    components: [
      {
        type: "header",
        parameters: [{ type: "text", text: sanitizedBidId }],
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: sanitizedBidId },
          { type: "text", text: sanitizedBidDetails },
          { type: "text", text: sanitizedBidOffer },
        ],
      },
    ],
  });
};

const sendOfferToOwner = async ({
  to,
  bidId,
  bidDetails,
  bidOffer,
  sellerNumber,
}) => {
  if (!META_TEMPLATE_OWNER_NAME || !to) {
    return null;
  }
  const sanitizedBidId = sanitizeTemplateText(bidId);
  const sanitizedBidDetails = sanitizeTemplateText(bidDetails);
  const sanitizedBidOffer = sanitizeTemplateText(bidOffer);
  const sanitizedSellerNumber = sanitizeTemplateText(sellerNumber);
  if (
    !sanitizedBidId ||
    !sanitizedBidDetails ||
    !sanitizedBidOffer ||
    !sanitizedSellerNumber
  ) {
    throw new Error(
      "bidId, bidDetails, bidOffer and sellerNumber are required.",
    );
  }
  return sendTemplateMessage({
    to,
    templateName: META_TEMPLATE_OWNER_NAME,
    language: META_TEMPLATE_LANGUAGE,
    components: [
      {
        type: "header",
        parameters: [{ type: "text", text: sanitizedBidId }],
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: sanitizedBidId },
          { type: "text", text: sanitizedBidDetails },
          { type: "text", text: sanitizedBidOffer },
          { type: "text", text: sanitizedSellerNumber },
        ],
      },
    ],
  });
};

const parseOfferMessage = (text) => {
  const cleaned = sanitizeTemplateText(text);
  const match = cleaned.match(/^(\S+)\s+(.+)$/);
  if (!match) {
    return null;
  }
  return { bidId: match[1], bidOffer: match[2] };
};

app.post("/api/request", async (req, res) => {
  try {
    const { name, customerNumber, bidId, bidMessage } = req.body || {};
    if (!name || !customerNumber || !bidId || !bidMessage) {
      return res.status(400).json({
        error: "name, customerNumber, bidId and bidMessage are required",
      });
    }
    if (!SELLER_NUMBERS.length) {
      return res
        .status(500)
        .json({ error: "No sellers configured (set SELLER_NUMBERS)." });
    }

    const savedBid = saveBidRequest({
      bidId,
      bidMessage,
      customerNumber,
      name,
    });

    const results = [];
    for (const seller of SELLER_NUMBERS) {
      try {
        const result = await sendBidRequestToSeller({
          to: seller,
          bidId: savedBid.bidId,
          bidMessage: savedBid.bidMessage,
        });
        results.push({ seller, ok: true, result });
      } catch (err) {
        const metaMessage = err?.response?.data?.error?.message || err.message;
        const metaDetails = err?.response?.data?.error?.error_data?.details;
        const metaType = err?.response?.data?.error?.type;
        console.error(`Send to seller ${seller} failed:`, {
          message: metaMessage,
          type: metaType,
          details: metaDetails,
        });
        results.push({
          seller,
          ok: false,
          error: metaMessage,
          type: metaType,
          details: metaDetails,
        });
      }
    }

    res.json({
      ok: true,
      sent: results,
      template: META_TEMPLATE_NAME,
      bidId: savedBid.bidId,
    });
  } catch (err) {
    console.error(
      "Request broadcast error:",
      err?.response?.data || err.message || err,
    );
    const messageErr =
      err?.response?.data?.error?.message || err.message || "Unknown error";
    res.status(500).json({ error: messageErr });
  }
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token && token === META_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const messages = Array.isArray(change?.value?.messages)
          ? change.value.messages
          : [];
        for (const message of messages) {
          const textBody = message?.text?.body;
          const from = message?.from;
          if (!textBody || !from) {
            continue;
          }
          const parsed = parseOfferMessage(textBody);
          if (!parsed) {
            continue;
          }
          const bid = getBidRequest(parsed.bidId);
          if (!bid) {
            console.warn("Webhook offer ignored; bid not found:", parsed.bidId);
            continue;
          }
          await sendOfferToBuyer({
            to: bid.customerNumber,
            bidId: bid.bidId,
            bidDetails: bid.bidMessage,
            bidOffer: parsed.bidOffer,
          });
          await sendOfferToOwner({
            to: OWNER_NUMBER,
            bidId: bid.bidId,
            bidDetails: bid.bidMessage,
            bidOffer: parsed.bidOffer,
            sellerNumber: from,
          });
        }
      }
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error(
      "Webhook processing error:",
      err?.response?.data || err.message || err,
    );
    return res.sendStatus(200);
  }
});

// Simple health
app.get("/api/health", (req, res) =>
  res.json({ ok: true, provider: PROVIDER }),
);

// Serve frontend build
const distPath = path.join(__dirname, "..", "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send("Frontend not built");
    }
    res.sendFile(indexPath);
  });
} else {
  console.warn(
    "dist/ not found; frontend assets will not be served (expected in production).",
  );
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server listening on ${PORT}, provider=${PROVIDER}`),
);
