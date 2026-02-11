
export const createTelegramController = ({
  bidStore,
  telegramClient,
  metaClient,
}) => {
  const verifySecret = (req, res, next) => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret) return next();
    const header = req.headers["x-telegram-bot-api-secret-token"];
    if (header !== secret) {
      return res.sendStatus(403);
    }
    return next();
  };

  const handleWebhook = async (req, res) => {
    try {
      const message = req.body?.message;
      const text = message?.text || "";
      const chatId = message?.chat?.id;
      if (!telegramClient || !chatId) {
        return res.sendStatus(200);
      }

      if (text.startsWith("/start")) {
        const bidIdMatch = text.match(/#?(\d+)/);
        const bidId = bidIdMatch ? bidIdMatch[1] : null;
        if (!bidId) {
          await telegramClient.sendMessage({
            chatId,
            text: "Pošaljite: /start #<broj zahteva> da povežete razgovor.",
          });
          return res.sendStatus(200);
        }
        const bid = bidStore.getBidRequest(bidId);
        if (!bid) {
          await telegramClient.sendMessage({
            chatId,
            text: `Zahtev #${bidId} nije pronađen.`,
          });
          return res.sendStatus(200);
        }
        bidStore.updateBid(bidId, {
          telegramChatId: String(chatId),
          notificationPreference: "telegram",
        });
        await telegramClient.sendMessage({
          chatId,
          text: `Telegram je povezan za zahtev #${bidId}.`,
        });
        return res.sendStatus(200);
      }

      if (!text.trim()) {
        return res.sendStatus(200);
      }

      const bid =
        bidStore.findLatestByTelegramChatId(chatId) ||
        null;
      if (!bid) {
        return res.sendStatus(200);
      }

      const appendedMessage = [bid.bidMessage, text.trim()]
        .filter(Boolean)
        .join(" / ");
      const updatedBid = bidStore.updateBid(bid.bidId, {
        bidMessage: appendedMessage,
        buyerAdditionalInfo: text.trim(),
      });

      if (updatedBid?.sellerContact) {
        try {
          await metaClient.sendInquiryToSeller({
            to: updatedBid.sellerContact,
            bidId: updatedBid.bidId,
            bidMessage: updatedBid.bidMessage,
            make: updatedBid.make,
            model: updatedBid.model,
            year: updatedBid.year,
            fuelType: updatedBid.fuelType,
            chassis: updatedBid.chassis,
          });
        } catch (err) {
          console.error(
            "Seller follow-up inquiry failed (telegram):",
            err?.response?.data || err.message || String(err),
          );
        }
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error(
        "Telegram webhook error:",
        err?.response?.data || err.message || err,
      );
      return res.sendStatus(200);
    }
  };

  return {
    verifySecret,
    handleWebhook,
  };
};
