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

// Preloaded scraped model options
let scrapedModels = {};
try {
  const modelsPath = path.join(__dirname, "..", "client", "data", "models.json");
  const raw = fs.readFileSync(modelsPath, "utf8");
  scrapedModels = JSON.parse(raw);
} catch (err) {
  console.warn("models.json not found or unreadable; will rely on live fetch.", err?.message || err);
}

const app = express();
app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf?.toString("utf8");
    },
  }),
);

app.use("/webhook", (err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    appendWebhookLog({
      receivedAt: new Date().toISOString(),
      event: "webhook_parse_error",
      method: req.method,
      headers: req.headers ?? null,
      rawBody: req.rawBody ?? null,
      error: err.message,
    }).catch((logErr) => {
      console.error("Webhook parse error log failed:", logErr?.message || logErr);
    });
    return res.sendStatus(400);
  }
  return next(err);
});

// Models API: serve from scraped cache only (no live fetch)
app.get("/api/models", async (req, res) => {
  const brand = String(req.query.brand || "").trim();
  if (!brand) {
    return res.status(400).json({ error: "brand is required" });
  }

  if (scrapedModels && scrapedModels[brand]) {
    return res.json({ ok: true, options: scrapedModels[brand] });
  }

  return res
    .status(404)
    .json({ error: "Models not found in cache for this brand", options: [] });
});

// Configuration via .env
const PROVIDER = process.env.PROVIDER || "meta";

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
const META_FLOW_SCREEN = process.env.META_FLOW_SCREEN || "Podaci za dostavu";
const META_FLOW_BUTTON_INDEX = process.env.META_FLOW_BUTTON_INDEX || "0";
const OWNER_NUMBER = process.env.OWNER_NUMBER || "";
const BID_STORE_TTL_HOURS = Number(process.env.BID_STORE_TTL_HOURS || "72");
const BID_ID_START = Number(process.env.BID_ID_START || "10001");
const LOGS_PUBLIC = process.env.LOGS_PUBLIC === "true";

// Sellers to broadcast to
const SELLER_NUMBERS = (process.env.SELLER_NUMBERS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const bidStore = new Map();
const bidStoreTtlMs = Number.isFinite(BID_STORE_TTL_HOURS)
  ? BID_STORE_TTL_HOURS * 60 * 60 * 1000
  : 72 * 60 * 60 * 1000;
let nextBidId = Number.isFinite(BID_ID_START) ? BID_ID_START : 10001;

const logsDir = path.join(__dirname, "..", "..", "logs");
const webhookLogPath = path.join(logsDir, "webhook-logs.json");
const replyLogPath = path.join(logsDir, "reply-logs.json");

const normalizePhone = (value) => String(value || "").replace(/^\+/, "").trim();
const withPlus = (value) => {
  const cleaned = normalizePhone(value);
  return cleaned ? `+${cleaned}` : "";
};

const sanitizeTemplateText = (value) =>
  String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const appendJsonLog = async (logPath, payload) => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  let entries = [];
  try {
    const raw = await fs.promises.readFile(logPath, "utf8");
    const parsed = JSON.parse(raw);
    entries = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
  entries.push(payload);
  await fs.promises.writeFile(logPath, JSON.stringify(entries, null, 2));
};

const appendWebhookLog = (payload) => appendJsonLog(webhookLogPath, payload);
const appendReplyLog = (payload) => appendJsonLog(replyLogPath, payload);


const saveBidRequest = ({
  bidId,
  bidMessage,
  customerNumber,
  name,
  make,
  model,
  year,
}) => {
  const cleanedBidId = sanitizeTemplateText(bidId);
  const cleanedBidMessage = sanitizeTemplateText(bidMessage);
  const cleanedCustomerNumber = normalizePhone(customerNumber);
  const cleanedName = sanitizeTemplateText(name);
  const cleanedMake = sanitizeTemplateText(make);
  const cleanedModel = sanitizeTemplateText(model);
  const cleanedYear = sanitizeTemplateText(year);
  if (!cleanedBidId || !cleanedBidMessage || !cleanedCustomerNumber) {
    throw new Error("bidId, bidMessage and customerNumber are required.");
  }
  bidStore.set(cleanedBidId, {
    bidId: cleanedBidId,
    bidMessage: cleanedBidMessage,
    customerNumber: cleanedCustomerNumber,
    name: cleanedName,
    make: cleanedMake,
    model: cleanedModel,
    year: cleanedYear,
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

const sendTemplateMessage = async ({
  to,
  templateName,
  language,
  components,
  keepPlus = false,
}) => {
  if (!META_WHATSAPP_TOKEN || !META_PHONE_NUMBER_ID) {
    throw new Error("Meta Cloud API not configured.");
  }
  if (!templateName) {
    throw new Error("Meta template name missing.");
  }
  const url = `https://graph.facebook.com/v24.0/${META_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: keepPlus ? withPlus(to) : normalizePhone(to),
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

const sendBidRequestToSeller = async ({
  to,
  bidId,
  bidMessage,
  make,
  model,
  year,
}) => {
  const sanitizedBidId = sanitizeTemplateText(bidId);
  const sanitizedBidMessage = sanitizeTemplateText(bidMessage);
  const sanitizedMake = sanitizeTemplateText(make);
  const sanitizedModel = sanitizeTemplateText(model);
  const sanitizedYear = sanitizeTemplateText(year);
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
        parameters: [
          { type: "text", parameter_name: "make", text: sanitizedMake || "-" },
          { type: "text", parameter_name: "model", text: sanitizedModel || "-" },
          { type: "text", parameter_name: "year", text: sanitizedYear || "-" },
          {
            type: "text",
            parameter_name: "bid_message",
            text: sanitizedBidMessage,
          },
        ],
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
    keepPlus: true,
    components: [
      {
        type: "header",
        parameters: [{ type: "text", parameter_name: "bid_id", text: sanitizedBidId }],
      },
      {
        type: "body",
        parameters: [
          { type: "text", parameter_name: "bid_id_body", text: sanitizedBidId },
          { type: "text", parameter_name: "bid_details", text: sanitizedBidDetails },
          { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
        ],
      },
      {
        type: "button",
        sub_type: "flow",
        index: META_FLOW_BUTTON_INDEX,
        parameters: [
          {
            type: "payload",
            payload: JSON.stringify({ screen: META_FLOW_SCREEN }),
          },
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
    const { name, customerNumber, bidMessage, make, model, year } = req.body || {};
    if (!name || !customerNumber || !bidMessage) {
      return res.status(400).json({
        error: "name, customerNumber and bidMessage are required",
      });
    }
    if (!SELLER_NUMBERS.length) {
      return res
        .status(500)
        .json({ error: "No sellers configured (set SELLER_NUMBERS)." });
    }

    const savedBid = saveBidRequest({
      bidId: String(nextBidId++),
      bidMessage,
      customerNumber,
      name,
      make,
      model,
      year,
    });

    const results = [];
    for (const seller of SELLER_NUMBERS) {
      try {
        const result = await sendBidRequestToSeller({
          to: seller,
          bidId: savedBid.bidId,
          bidMessage: savedBid.bidMessage,
          make: savedBid.make,
          model: savedBid.model,
          year: savedBid.year,
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
  appendWebhookLog({
    receivedAt: new Date().toISOString(),
    event: "webhook_verification",
    method: req.method,
    query: req.query ?? null,
    headers: req.headers ?? null,
  }).catch((err) => {
    console.error("Webhook verification log failed:", err?.message || err);
  });
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
    await appendWebhookLog({
      receivedAt: new Date().toISOString(),
      event: "webhook_received",
      method: req.method,
      headers: req.headers ?? null,
      body: req.body,
    });
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
            await appendWebhookLog({
              receivedAt: new Date().toISOString(),
              event: "message_skipped_missing_fields",
              messageId: message?.id ?? null,
              from: from ?? null,
              textBody: textBody ?? null,
            });
            continue;
          }
          const parsed = parseOfferMessage(textBody);
          if (!parsed) {
            await appendWebhookLog({
              receivedAt: new Date().toISOString(),
              event: "message_skipped_unmatched_format",
              messageId: message?.id ?? null,
              from,
              textBody,
            });
            continue;
          }
          const bid = getBidRequest(parsed.bidId);
          if (!bid) {
            console.warn("Webhook offer ignored; bid not found:", parsed.bidId);
            await appendWebhookLog({
              receivedAt: new Date().toISOString(),
              event: "message_skipped_bid_not_found",
              messageId: message?.id ?? null,
              from,
              textBody,
              bidId: parsed.bidId,
              bidOffer: parsed.bidOffer,
            });
            continue;
          }
          await appendWebhookLog({
            receivedAt: new Date().toISOString(),
            event: "message_processed_offer",
            messageId: message?.id ?? null,
            from,
            textBody,
            bidId: parsed.bidId,
            bidOffer: parsed.bidOffer,
          });
          await appendReplyLog({
            receivedAt: new Date().toISOString(),
            bidId: parsed.bidId,
            bidOffer: parsed.bidOffer,
            sellerNumber: from,
            customerNumber: bid.customerNumber,
            bidMessage: bid.bidMessage,
            messageId: message?.id ?? null,
            messageTimestamp: message?.timestamp ?? null,
          });
          try {
            await sendOfferToBuyer({
              to: bid.customerNumber,
              bidId: bid.bidId,
              bidDetails: bid.bidMessage,
              bidOffer: parsed.bidOffer,
            });
            await appendWebhookLog({
              receivedAt: new Date().toISOString(),
              event: "buyer_offer_sent",
              bidId: parsed.bidId,
              bidOffer: parsed.bidOffer,
              to: bid.customerNumber,
            });
          } catch (err) {
            await appendWebhookLog({
              receivedAt: new Date().toISOString(),
              event: "buyer_offer_failed",
              bidId: parsed.bidId,
              bidOffer: parsed.bidOffer,
              to: bid.customerNumber,
              error: err?.response?.data || err.message || String(err),
            });
          }
          try {
            await sendOfferToOwner({
              to: OWNER_NUMBER,
              bidId: bid.bidId,
              bidDetails: bid.bidMessage,
              bidOffer: parsed.bidOffer,
              sellerNumber: from,
            });
            await appendWebhookLog({
              receivedAt: new Date().toISOString(),
              event: "owner_offer_sent",
              bidId: parsed.bidId,
              bidOffer: parsed.bidOffer,
              to: OWNER_NUMBER,
            });
          } catch (err) {
            await appendWebhookLog({
              receivedAt: new Date().toISOString(),
              event: "owner_offer_failed",
              bidId: parsed.bidId,
              bidOffer: parsed.bidOffer,
              to: OWNER_NUMBER,
              error: err?.response?.data || err.message || String(err),
            });
          }
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

if (process.env.NODE_ENV !== "production" || LOGS_PUBLIC) {
  app.use("/logs", express.static(logsDir));
}

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
