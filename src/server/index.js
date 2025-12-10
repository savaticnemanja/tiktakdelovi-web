import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import axios from "axios";
import Twilio from "twilio";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for Twilio form webhooks

// Configuration via .env
const PROVIDER = (process.env.PROVIDER || "meta").toLowerCase();

// Twilio vars (if using Twilio)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || ""; // e.g. "whatsapp:+1415xxxxxxx"
const TWILIO_ORDER_TEMPLATE_SID =
  process.env.TWILIO_ORDER_TEMPLATE_SID || "HXc2504355df553798e7df16c0d6b999eb";
const TWILIO_SELLER_TEMPLATE_SID = process.env.TWILIO_SELLER_TEMPLATE_SID || "";
const TWILIO_BUYER_TEMPLATE_SID =
  process.env.TWILIO_BUYER_TEMPLATE_SID || "HX8d6d1f3aef7c389578e36f7a25d45ad1";
const TWILIO_CONTENT_LANGUAGE = process.env.TWILIO_CONTENT_LANGUAGE || "";
const TWILIO_BUYER_TEMPLATE_NUMERIC_VARS =
  (process.env.TWILIO_BUYER_TEMPLATE_NUMERIC_VARS || "").toLowerCase() === "true";
const OWNER_NUMBER = process.env.OWNER_NUMBER || ""; // who receives confirmed orders

// Meta (WhatsApp Cloud API) vars (if using Meta)
const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || ""; // numeric id for your phone number in the Meta Cloud API

// Sellers to broadcast to
const SELLER_NUMBERS = (process.env.SELLER_NUMBERS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const normalizeNumber = (value = "") =>
  String(value)
    .trim()
    .replace(/^whatsapp:/i, "")
    .replace(/[^\d+]/g, "");
const SELLER_SET = new Set(SELLER_NUMBERS.map((s) => normalizeNumber(s)));
let nextRequestId = 1001;

let twilioClient = null;
if (
  PROVIDER === "twilio" &&
  TWILIO_ACCOUNT_SID &&
  TWILIO_AUTH_TOKEN &&
  TWILIO_ACCOUNT_SID.startsWith("AC")
) {
  twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} else if (PROVIDER === "twilio") {
  console.warn("Twilio not initialized: missing or invalid ACCOUNT_SID/AUTH_TOKEN.");
}

const sendMessage = async ({ to, body, template }) => {
  if (PROVIDER === "twilio") {
    if (!twilioClient || !TWILIO_WHATSAPP_FROM) {
      throw new Error("Twilio not configured.");
    }
    const basePayload = {
      from: TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`
    };

    // Prefer Content Template (Quick Reply) when provided
    if (template?.contentSid) {
      const twResponse = await twilioClient.messages.create({
        ...basePayload,
        contentSid: template.contentSid,
        contentLanguage: template.contentLanguage || TWILIO_CONTENT_LANGUAGE || undefined,
        contentVariables: template.variables
          ? JSON.stringify(template.variables)
          : undefined
      });
      return { sid: twResponse.sid, contentSid: template.contentSid };
    }

    const twResponse = await twilioClient.messages.create({
      ...basePayload,
      body
    });
    return { sid: twResponse.sid };
  }
  if (PROVIDER === "meta") {
    if (!META_WHATSAPP_TOKEN || !META_PHONE_NUMBER_ID) {
      throw new Error("Meta Cloud API not configured.");
    }
    const url = `https://graph.facebook.com/v17.0/${META_PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "text",
      text: { body }
    };
    const metaResp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    });
    return { data: metaResp.data };
  }
  throw new Error("Unsupported provider configured.");
};

const extractRequestId = (text = "") => {
  const match = String(text).match(/\bID[:\s]*([0-9]+)/i);
  if (match) return match[1];
  const directNumber = String(text).match(/\b(\d{3,})\b/); // prefer multi-digit ids
  return directNumber ? directNumber[1] : null;
};

const parseSellerBid = (text = "") => {
  const match = String(text).match(/\/ponuda\s+(\d+)\s+(.+)/i);
  if (!match) return null;
  return { requestId: match[1], offerText: match[2].trim() };
};

const formatBidTemplate = (req) => {
  if (!req?.bids?.length) {
    return `Pregled ponuda za zahtev ID:${req.id}\nJoš nema pristiglih ponuda.`;
  }

  const lines = req.bids.map((bid, idx) => {
    const statusLabel =
      bid.state === "confirmed"
        ? "[POTVRĐENO] "
        : bid.state === "denied"
        ? "[ODBIJENO] "
        : "";
    const offerLabel = bid.offerId ? ` (Ponuda ID: ${bid.offerId})` : "";
    return `${idx + 1}) ${statusLabel}Prodavac ${bid.seller}${offerLabel}\n${bid.text}`;
  });

  const instructions = [
    `Odgovori:`,
    `POTVRDI <broj ponude> za ID:${req.id} da prihvatiš`,
    `ODBIJ <broj ponude> za ID:${req.id} da odbiješ`
  ].join("\n");

  return [`Pregled ponuda za zahtev ID:${req.id}`, ...lines, instructions].join("\n");
};

const sendBuyerOfferTemplate = async ({ request, bid, bidIndex }) => {
  if (
    PROVIDER !== "twilio" ||
    !twilioClient ||
    !TWILIO_BUYER_TEMPLATE_SID ||
    !request?.customerNumber ||
    !bid
  ) {
    return null;
  }

  const offerIdValue = bid.offerId || `${request.id}-${(bidIndex ?? 0) + 1}`;
  const offerPriceValue = `${bid.text} (prodavac: ${bid.seller})`;

  // Some Twilio Content Templates expect numeric placeholders ({{1}}, {{2}})
  const variables = TWILIO_BUYER_TEMPLATE_NUMERIC_VARS
    ? { 1: offerIdValue, 2: offerPriceValue }
    : { offer_id: offerIdValue, offer_price: offerPriceValue };

  try {
    return await sendMessage({
      to: request.customerNumber,
      template: { contentSid: TWILIO_BUYER_TEMPLATE_SID, variables }
    });
  } catch (err) {
    const code = err?.code || err?.status || err?.statusCode;
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error?.message ||
      err?.message ||
      "Unknown Twilio error";
    console.error("Failed to send buyer template; falling back to text:", code, msg);

    const fallback = [
      "Nova ponuda (fallback bez template-a)",
      `Ponuda ID: ${variables.offer_id}`,
      `Cena/detalji: ${variables.offer_price}`
    ].join("\n");

    // Fallback to plain text so the buyer still gets the data
    return sendMessage({
      to: request.customerNumber,
      body: fallback
    });
  }
};

const sendBidTemplateToBuyer = async (req, { latestBid, latestBidIndex } = {}) => {
  if (!req?.customerNumber) return;

  if (latestBid) {
    try {
      await sendBuyerOfferTemplate({
        request: req,
        bid: latestBid,
        bidIndex: latestBidIndex
      });
    } catch (err) {
      console.error("Failed to send buyer template:", err.message);
    }
  }

  const template = formatBidTemplate(req);
  try {
    await sendMessage({ to: req.customerNumber, body: template });
  } catch (err) {
    console.error("Failed to send bid template to buyer:", err.message);
  }
};

const parseBidCommand = (text = "") => {
  const trimmed = String(text).trim();
  const confirmMatch = trimmed.match(/\b(potvrdi|confirm|accept)\s+(\d+)/i);
  const denyMatch = trimmed.match(/\b(odbij|deny|reject|decline)\s+(\d+)/i);
  if (confirmMatch) {
    return { action: "confirm", bidIndex: Number(confirmMatch[2]) - 1 };
  }
  if (denyMatch) {
    return { action: "deny", bidIndex: Number(denyMatch[2]) - 1 };
  }
  return null;
};

const forwardSelectionToOwner = async ({ request, bid }) => {
  if (!OWNER_NUMBER) {
    throw new Error("Owner number not configured (set OWNER_NUMBER).");
  }

  const ownerMessage = [
    "POTVRĐENA PONUDA",
    `ID zahteva: ${request.id}`,
    `Prodavac: ${bid.seller}`,
    `Ponuda: ${bid.text}`,
    `Kupac: ${request.customerName} (${request.customerNumber})`,
    "Poruka kupca:",
    request.message
  ].join("\n");

  await sendMessage({ to: OWNER_NUMBER, body: ownerMessage });
};

// compatibility single-recipient send
app.post("/api/notify", async (req, res) => {
  try {
    const { name, recipient, message, date, time } = req.body || {};
    const hasTemplateData = PROVIDER === "twilio" && TWILIO_ORDER_TEMPLATE_SID && date && time;
    if (!recipient) {
      return res.status(400).json({ error: "recipient is required" });
    }
    if (!hasTemplateData && (!name || !message)) {
      return res
        .status(400)
        .json({ error: "name, recipient and message are required (or date/time for template)" });
    }

    // Use Twilio Content Template (Quick Reply) when available + data supplied
    if (hasTemplateData) {
      const result = await sendMessage({
        to: recipient,
        template: {
          contentSid: TWILIO_ORDER_TEMPLATE_SID,
          variables: { date, time }
        }
      });
      return res.json({
        message: "Sent via Twilio template",
        provider: PROVIDER,
        templateSid: TWILIO_ORDER_TEMPLATE_SID,
        result
      });
    }

    const fullMessage = `From: ${name}\n\n${message}`;
    const result = await sendMessage({ to: recipient, body: fullMessage });
    return res.json({ message: "Sent", provider: PROVIDER, result });
  } catch (err) {
    console.error("Notify error:", err?.response?.data || err.message || err);
    const messageErr = err?.response?.data?.error?.message || err.message || "Unknown error";
    res.status(500).json({ error: messageErr });
  }
});

// In-memory store of requests/bids (replace with DB for production)
const requests = new Map();
const findRequestsForBuyer = (normalizedNumber) =>
  Array.from(requests.values()).filter(
    (req) => req.customerNumberNormalized === normalizedNumber
  );
const generateRequestId = () => String(nextRequestId++);

app.post("/api/request", async (req, res) => {
  try {
    const { name, customerNumber, message } = req.body || {};
    if (!name || !customerNumber || !message) {
      return res.status(400).json({ error: "name, customerNumber and message are required" });
    }
    if (!SELLER_NUMBERS.length) {
      return res.status(500).json({ error: "No sellers configured (set SELLER_NUMBERS)." });
    }

    const requestId = generateRequestId();
    const createdAt = new Date().toISOString();
    const sellerBody = [
      `Novi zahtev od ${name} (${customerNumber})`,
      `ID:${requestId}`,
      message,
      `Odgovori sa: /ponuda ${requestId} <cena u EUR i detalji>`
    ].join("\n");
    const sellerTemplate =
      PROVIDER === "twilio" && TWILIO_SELLER_TEMPLATE_SID
        ? {
            contentSid: TWILIO_SELLER_TEMPLATE_SID,
            // Template should have two placeholders: {{1}} and {{2}}
            variables: {
              1: `Novi zahtev od ${name} (${customerNumber}), ID:${requestId}`,
              2: `Odgovori sa: /ponuda ${requestId} <cena u EUR i detalji>`
            }
          }
        : null;

    const customerNumberNormalized = normalizeNumber(customerNumber);

    requests.set(requestId, {
      id: requestId,
      customerName: name,
      customerNumber,
      customerNumberNormalized,
      message,
      createdAt,
      bids: [],
      selection: null
    });

    const results = [];
    for (const seller of SELLER_NUMBERS) {
      try {
        const result = await sendMessage({
          to: seller,
          body: sellerBody,
          template: sellerTemplate
        });
        results.push({ seller, ok: true, result });
      } catch (err) {
        console.error(`Send to seller ${seller} failed:`, err.message);
        results.push({ seller, ok: false, error: err.message });
      }
    }

    res.json({ requestId, sent: results });
  } catch (err) {
    console.error("Request broadcast error:", err?.response?.data || err.message || err);
    const messageErr = err?.response?.data?.error?.message || err.message || "Unknown error";
    res.status(500).json({ error: messageErr });
  }
});

app.get("/api/offers/:id", (req, res) => {
  const { id } = req.params;
  if (!requests.has(id)) return res.status(404).json({ error: "Request not found" });
  return res.json(requests.get(id));
});

app.post("/api/confirm", async (req, res) => {
  try {
    const { requestId, seller, offerText } = req.body || {};
    if (!requestId || !seller || !offerText) {
      return res.status(400).json({ error: "requestId, seller and offerText are required" });
    }
    if (!OWNER_NUMBER) {
      return res.status(500).json({ error: "Owner number not configured (set OWNER_NUMBER)." });
    }
    const stored = requests.get(requestId);
    if (!stored) {
      return res.status(404).json({ error: "Request not found" });
    }

    const normalizedSeller = normalizeNumber(seller);
    let selectedBid = null;
    const updatedBids = stored.bids.map((bid) => {
      const sameSeller = normalizeNumber(bid.seller) === normalizedSeller && bid.text === offerText;
      if (sameSeller) {
        selectedBid = { ...bid, state: "confirmed" };
        return selectedBid;
      }
      return bid;
    });

    if (!selectedBid) {
      selectedBid = { seller, text: offerText, createdAt: new Date().toISOString(), state: "confirmed" };
      updatedBids.push(selectedBid);
    }

    stored.bids = updatedBids;
    stored.selection = {
      seller: selectedBid.seller,
      offerText: selectedBid.text,
      confirmedAt: new Date().toISOString()
    };

    await forwardSelectionToOwner({ request: { ...stored, id: requestId }, bid: selectedBid });
    requests.set(requestId, stored);

    return res.json({ ok: true, forwardedTo: OWNER_NUMBER });
  } catch (err) {
    console.error("Confirm error:", err?.response?.data || err.message || err);
    const messageErr = err?.response?.data?.error?.message || err.message || "Unknown error";
    return res.status(500).json({ error: messageErr });
  }
});

app.post("/api/webhook/whatsapp", async (req, res) => {
  try {
    let text = null;
    let from = null;

    const respondOk = () => {
      if (PROVIDER === "twilio") {
        return res.status(200).type("text/xml").send("<Response></Response>");
      }
      return res.status(200).json({ ok: true });
    };

    // Twilio webhook (urlencoded)
    if (req.body?.Body && req.body?.From) {
      text = req.body.Body;
      from = String(req.body.From).replace(/^whatsapp:/, "");
    }

    // Meta webhook (json)
    if (!text && Array.isArray(req.body?.entry)) {
      const change = req.body.entry?.[0]?.changes?.[0];
      const message = change?.value?.messages?.[0];
      if (message?.type === "text") {
        text = message.text.body;
        from = message.from;
      }
    }

    if (!text || !from) {
      return respondOk();
    }

    const fromNormalized = normalizeNumber(from);
    const command = parseBidCommand(text);
    const sellerBid = parseSellerBid(text);
    let reqId = sellerBid?.requestId || extractRequestId(text);

    const buyerMatches = findRequestsForBuyer(fromNormalized);
    if (!reqId && command && buyerMatches.length === 1) {
      reqId = buyerMatches[0].id; // allow buyer to skip ID if they have a single open request
    }

    if (command && !reqId && buyerMatches.length) {
      try {
        await sendMessage({
          to: buyerMatches[0].customerNumber,
          body: `Dodaj ID zahteva. Primer: ${command.action.toUpperCase()} 1 za ID:${buyerMatches[0].id}`
        });
      } catch (err) {
        console.error("Failed to nudge buyer for ID:", err.message);
      }
      return respondOk();
    }

    const stored = reqId ? requests.get(reqId) : null;

    const isBuyer = stored?.customerNumberNormalized === fromNormalized;
    const isSeller = SELLER_SET.has(fromNormalized);

    if (isBuyer && command) {
      const targetBid = stored.bids[command.bidIndex];
      if (!targetBid) {
        await sendMessage({
          to: stored.customerNumber,
          body: `Ne mogu da nađem ponudu #${command.bidIndex + 1} za ID:${reqId}. Odgovori POTVRDI <broj> ili ODBIJ <broj>.`
        });
        return respondOk();
      }

      const updatedBid = {
        ...targetBid,
        state: command.action === "confirm" ? "confirmed" : "denied"
      };

      stored.bids[command.bidIndex] = updatedBid;
      requests.set(reqId, stored);

      if (command.action === "confirm") {
        stored.selection = {
          seller: updatedBid.seller,
          offerText: updatedBid.text,
          confirmedAt: new Date().toISOString()
        };
        try {
          await forwardSelectionToOwner({ request: stored, bid: updatedBid });
        } catch (err) {
          console.error("Failed to forward selection to owner:", err.message);
          await sendMessage({
            to: stored.customerNumber,
            body: `Zabeležili smo potvrdu za ID:${reqId}, ali nismo mogli da obavestimo vlasnika: ${err.message}`
          });
        }
        await sendMessage({
          to: stored.customerNumber,
          body: `Potvrdili ste ponudu #${command.bidIndex + 1} za ID:${reqId}.`
        });
      } else {
        await sendMessage({
          to: stored.customerNumber,
          body: `Ponuda #${command.bidIndex + 1} je označena kao odbijena za ID:${reqId}.`
        });
      }

      await sendBidTemplateToBuyer(stored);
      return respondOk();
    }

    if (!isSeller || !sellerBid || !reqId || !stored) {
      if (isSeller) {
        const hints = [];
        if (!sellerBid) {
          hints.push("Format za ponudu: /ponuda <ID> <cena i detalji>");
        }
        if (!reqId) {
          hints.push("Dodaj ID zahteva posle /ponuda.");
        } else if (!stored) {
          hints.push(`Ne mogu da pronađem zahtev ID:${reqId}.`);
        }
        const helper = hints.join(" ");
        if (helper) {
          try {
            await sendMessage({
              to: from,
              body: `${helper} Primer: /ponuda ${reqId || "<id>"} 50e deo + ugradnja`
            });
          } catch (err) {
            console.error("Failed to guide seller on malformed bid:", err.message);
          }
        }
      }
      return respondOk();
    }

    const bidIndex = stored.bids.length;
    const bid = {
      offerId: `${reqId}-${bidIndex + 1}`,
      seller: from,
      text: sellerBid.offerText,
      createdAt: new Date().toISOString(),
      state: "pending"
    };
    stored.bids.push(bid);
    requests.set(reqId, stored);

    await sendBidTemplateToBuyer(stored, { latestBid: bid, latestBidIndex: bidIndex });

    if (PROVIDER === "twilio") {
      const ack = `<Response><Message>Hvala! Ponuda zabeležena za ID:${reqId}</Message></Response>`;
      return res.type("text/xml").send(ack);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err?.response?.data || err.message || err);
    return res.status(500).json({ error: err.message || "Webhook error" });
  }
});

// Demo endpoint to send buyer template directly with custom data
app.post("/api/demo/buyer-offer", async (req, res) => {
  try {
    const { to, offerId, offerPrice } = req.body || {};
    if (PROVIDER !== "twilio") {
      return res.status(400).json({ error: "Twilio provider required for this demo." });
    }
    if (!twilioClient || !TWILIO_WHATSAPP_FROM || !TWILIO_BUYER_TEMPLATE_SID) {
      return res
        .status(500)
        .json({ error: "Twilio buyer template not configured (check SID, from, credentials)." });
    }
    if (!to || !offerId || !offerPrice) {
      return res.status(400).json({ error: "to, offerId and offerPrice are required" });
    }

    const result = await sendMessage({
      to,
      template: {
        contentSid: TWILIO_BUYER_TEMPLATE_SID,
        variables: {
          offer_id: offerId,
          offer_price: offerPrice
        }
      }
    });

    return res.json({
      ok: true,
      provider: PROVIDER,
      templateSid: TWILIO_BUYER_TEMPLATE_SID,
      result
    });
  } catch (err) {
    const twilioStatus = err?.status || err?.statusCode;
    const twilioMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error?.message ||
      err?.message ||
      "Unknown error";
    console.error("Demo buyer-offer error:", err?.response?.data || err.message || err);
    return res.status(twilioStatus || 500).json({
      error: twilioMessage,
      details: err?.response?.data || undefined,
      status: twilioStatus || 500
    });
  }
});

// Simple health
app.get("/api/health", (req, res) => res.json({ ok: true, provider: PROVIDER }));

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
  console.warn("dist/ not found; frontend assets will not be served (expected in production).");
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}, provider=${PROVIDER}`));
