import { normalizePhone } from "../../../utils/phone.js";
import { formatBuyerImageCaption } from "../../telegram/telegramMessages.js";

export const createImageHandler = ({
  bidStore,
  metaClient,
  telegramClient,
  sellerNumbers,
}) => {
  return async (message) => {
    const from = message?.from;
    if (message?.type !== "image" || !message?.image?.id || !from) {
      return false;
    }
    const normalizedSender = normalizePhone(from);
    const allowedSellers = Array.isArray(sellerNumbers)
      ? sellerNumbers.map((number) => normalizePhone(number))
      : [];
    if (!allowedSellers.includes(normalizedSender)) {
      return true;
    }
    const caption = message?.image?.caption || "";
    const bidIdMatch = caption.match(/(\d+)/);
    const bidId = bidIdMatch ? bidIdMatch[1] : null;
    if (!bidId) {
      return true;
    }
    const bid = bidStore.getBidRequest(bidId);
    if (!bid) {
      return true;
    }
    const buyerCaption = formatBuyerImageCaption({
      bidId,
      bidOffer: bid.bidOffer,
    });
    try {
      if (
        bid.notificationPreference === "telegram" &&
        telegramClient &&
        bid.telegramChatId
      ) {
        const media = await metaClient.downloadMedia(message.image.id);
        await telegramClient.sendPhoto({
          chatId: bid.telegramChatId,
          buffer: media.buffer,
          mimeType: media.mimeType,
          caption: buyerCaption,
          mask: true,
        });
      } else {
        await metaClient.sendImageMessage({
          to: bid.customerNumber,
          mediaId: message.image.id,
          caption: buyerCaption,
          mask: true,
        });
      }
    } catch (err) {
      console.error(
        "Buyer image forward failed:",
        err?.response?.data || err.message || String(err),
      );
    }
    return true;
  };
};
