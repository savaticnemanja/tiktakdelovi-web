import { createWebhookHandlers } from "./webhook/handlers.js";

export const createWebhookController = ({
  bidStore,
  messageToBid,
  metaClient,
  telegramClient,
  ownerNumber,
  courierNumber,
  sellerNumbers,
  sellerMarkupPercent,
  verifyToken,
}) => {
  const verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token && token === verifyToken) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  };

  const handleWebhook = async (req, res) => {
    try {
      const handlers = createWebhookHandlers({
        bidStore,
        messageToBid,
        metaClient,
        telegramClient,
        ownerNumber,
        courierNumber,
        sellerNumbers,
        sellerMarkupPercent,
      });

      const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
          const messages = Array.isArray(change?.value?.messages)
            ? change.value.messages
            : [];
          for (const message of messages) {
            if (await handlers.handleImageMessage(message)) {
              continue;
            }
            if (await handlers.handleButtonMessage(message)) {
              continue;
            }
            if (await handlers.handleInteractiveMessage(message)) {
              continue;
            }
            if (await handlers.handleTextMessage(message)) {
              continue;
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
  };

  return {
    verifyWebhook,
    handleWebhook,
  };
};
