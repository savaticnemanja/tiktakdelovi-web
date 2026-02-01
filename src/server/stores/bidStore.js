import { normalizePhone } from "../utils/phone.js";
import { sanitizeTemplateText } from "../utils/sanitize.js";

export const createBidStore = ({ ttlMs, idStart }) => {
  const store = new Map();
  let nextBidId = Number.isFinite(idStart) ? idStart : 10001;

  const allocateBidId = () => String(nextBidId++);

  const saveBidRequest = ({
    bidId,
    bidMessage,
    customerNumber,
    name,
    notificationPreference,
    make,
    model,
    year,
    fuelType,
    chassis,
  }) => {
    const cleanedBidId = sanitizeTemplateText(bidId || allocateBidId());
    const cleanedBidMessage = sanitizeTemplateText(bidMessage);
    const cleanedCustomerNumber = normalizePhone(customerNumber);
    const cleanedName = sanitizeTemplateText(name);
    const cleanedMake = sanitizeTemplateText(make);
    const cleanedModel = sanitizeTemplateText(model);
    const cleanedYear = sanitizeTemplateText(year);
    const cleanedFuelType = sanitizeTemplateText(fuelType);
    const cleanedChassis = sanitizeTemplateText(chassis);
    if (!cleanedBidId || !cleanedBidMessage || !cleanedCustomerNumber) {
      throw new Error("bidId, bidMessage and customerNumber are required.");
    }
    store.set(cleanedBidId, {
      bidId: cleanedBidId,
      bidMessage: cleanedBidMessage,
      customerNumber: cleanedCustomerNumber,
      name: cleanedName,
      make: cleanedMake,
      model: cleanedModel,
      year: cleanedYear,
      fuelType: cleanedFuelType,
      chassis: cleanedChassis,
      sellerContact: "",
      bidOffer: "",
      bidNote: "",
      needsMoreInfo: "",
      buyerAdditionalInfo: "",
      notificationPreference: notificationPreference || "whatsapp",
      telegramChatId: "",
      buyerName: "",
      buyerAddress: "",
      buyerCity: "",
      buyerPostalCode: "",
      buyerContact: "",
      createdAt: Date.now(),
    });
    return store.get(cleanedBidId);
  };

  const getBidRequest = (bidId) => {
    const cleanedBidId = sanitizeTemplateText(bidId);
    const bid = store.get(cleanedBidId);
    if (!bid) {
      return null;
    }
    if (Date.now() - bid.createdAt > ttlMs) {
      store.delete(cleanedBidId);
      return null;
    }
    return bid;
  };

  return {
    saveBidRequest,
    getBidRequest,
    findLatestByTelegramChatId: (chatId) => {
      let latest = null;
      for (const bid of store.values()) {
        if (!bid?.telegramChatId) continue;
        if (String(bid.telegramChatId) !== String(chatId)) continue;
        if (!latest || bid.createdAt > latest.createdAt) {
          latest = bid;
        }
      }
      return latest;
    },
    findLatestBySellerContact: (sellerContact) => {
      const normalized = normalizePhone(sellerContact);
      let latest = null;
      for (const bid of store.values()) {
        if (!bid?.sellerContact) continue;
        if (normalizePhone(bid.sellerContact) !== normalized) continue;
        if (!latest || bid.createdAt > latest.createdAt) {
          latest = bid;
        }
      }
      return latest;
    },
    updateBid: (bidId, updates) => {
      const bid = getBidRequest(bidId);
      if (!bid) {
        return null;
      }
      const next = { ...bid, ...updates };
      store.set(next.bidId, next);
      return next;
    },
  };
};
