import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
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
const OWNER_NUMBER = process.env.OWNER_NUMBER || ""; // who receives confirmed orders

// Meta (WhatsApp Cloud API) vars (if using Meta)
const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || ""; // numeric id for your phone number in the Meta Cloud API

// Sellers to broadcast to
const SELLER_NUMBERS = (process.env.SELLER_NUMBERS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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

const sendMessage = async ({ to, body }) => {
  if (PROVIDER === "twilio") {
    if (!twilioClient || !TWILIO_WHATSAPP_FROM) {
      throw new Error("Twilio not configured.");
    }
    const twResponse = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
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

// compatibility single-recipient send
app.post("/api/notify", async (req, res) => {
  try {
    const { name, recipient, message } = req.body || {};
    if (!name || !recipient || !message) {
      return res.status(400).json({ error: "name, recipient and message are required" });
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

app.post("/api/request", async (req, res) => {
  try {
    const { name, customerNumber, message } = req.body || {};
    if (!name || !customerNumber || !message) {
      return res.status(400).json({ error: "name, customerNumber and message are required" });
    }
    if (!SELLER_NUMBERS.length) {
      return res.status(500).json({ error: "No sellers configured (set SELLER_NUMBERS)." });
    }

    const requestId = randomUUID();
    const createdAt = new Date().toISOString();
    const sellerBody = `New request from ${name} (${customerNumber})\nREQ:${requestId}\n${message}\nReply with: REQ:${requestId} your offer`;

    requests.set(requestId, {
      id: requestId,
      customerName: name,
      customerNumber,
      message,
      createdAt,
      bids: [],
      selection: null
    });

    const results = [];
    for (const seller of SELLER_NUMBERS) {
      try {
        const result = await sendMessage({ to: seller, body: sellerBody });
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

    const ownerMessage = [
      "CONFIRMED ORDER",
      `REQ:${requestId}`,
      `Seller: ${seller}`,
      `Offer: ${offerText}`,
      `Customer: ${stored.customerName} (${stored.customerNumber})`,
      "Original request:",
      stored.message
    ].join("\n");

    await sendMessage({ to: OWNER_NUMBER, body: ownerMessage });
    stored.selection = {
      seller,
      offerText,
      confirmedAt: new Date().toISOString()
    };
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
      if (PROVIDER === "twilio") {
        return res.status(200).type("text/xml").send("<Response></Response>");
      }
      return res.status(200).json({ ignored: true });
    }

    const match = String(text).match(/REQ:([a-zA-Z0-9\-]+)/i);
    if (!match) {
      if (PROVIDER === "twilio") {
        return res.status(200).type("text/xml").send("<Response></Response>");
      }
      return res.status(200).json({ ignored: true, reason: "no request id" });
    }

    const reqId = match[1];
    const stored = requests.get(reqId);
    if (!stored) {
      if (PROVIDER === "twilio") {
        return res.status(200).type("text/xml").send("<Response></Response>");
      }
      return res.status(200).json({ ignored: true, reason: "unknown request" });
    }

    const bid = { seller: from, text, createdAt: new Date().toISOString() };
    stored.bids.push(bid);
    requests.set(reqId, stored);

    // forward to customer
    try {
      const notifyText = `Seller ${from} replied to REQ:${reqId}\n${text}`;
      await sendMessage({ to: stored.customerNumber, body: notifyText });
    } catch (err) {
      console.error("Failed to notify customer:", err.message);
    }

    if (PROVIDER === "twilio") {
      const ack = `<Response><Message>Thanks! Bid recorded for REQ:${reqId}</Message></Response>`;
      return res.type("text/xml").send(ack);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err?.response?.data || err.message || err);
    return res.status(500).json({ error: err.message || "Webhook error" });
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
