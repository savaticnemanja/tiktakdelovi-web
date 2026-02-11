import { normalizePhone } from "../utils/phone.js";
import { sanitizeTemplateText } from "../utils/sanitize.js";

export const createBidStore = ({ ttlMs, idStart }) => {
  const store = new Map();
  const customerToTelegramChat = new Map();
  let nextBidId = Number.isFinite(idStart) ? idStart : 10001;
  const finalDecisionStatuses = new Set(["accepted", "declined"]);

  const allocateBidId = () => String(nextBidId++);
  const now = () => Date.now();
  const isExpired = (bid) => now() - bid.createdAt > ttlMs;

  const getAllActiveBids = () => {
    const active = [];
    for (const [id, bid] of store.entries()) {
      if (!bid) continue;
      if (isExpired(bid)) {
        store.delete(id);
        continue;
      }
      active.push(bid);
    }
    return active;
  };

  const saveBidRequest = ({
    bidId,
    bidMessage,
    customerNumber,
    name,
    notificationPreference,
    requestType,
    make,
    model,
    year,
    fuelType,
    chassis,
    locationFrom,
    locationTo,
    serviceType,
  }) => {
    const cleanedBidId = sanitizeTemplateText(bidId || allocateBidId());
    const cleanedBidMessage = sanitizeTemplateText(bidMessage);
    const cleanedCustomerNumber = normalizePhone(customerNumber);
    const cleanedName = sanitizeTemplateText(name);
    const cleanedRequestType = sanitizeTemplateText(requestType);
    const cleanedMake = sanitizeTemplateText(make);
    const cleanedModel = sanitizeTemplateText(model);
    const cleanedYear = sanitizeTemplateText(year);
    const cleanedFuelType = sanitizeTemplateText(fuelType);
    const cleanedChassis = sanitizeTemplateText(chassis);
    const cleanedLocationFrom = sanitizeTemplateText(locationFrom);
    const cleanedLocationTo = sanitizeTemplateText(locationTo);
    const cleanedServiceType = sanitizeTemplateText(serviceType);
    if (!cleanedBidId || !cleanedBidMessage || !cleanedCustomerNumber) {
      throw new Error("bidId, bidMessage and customerNumber are required.");
    }
    const cleanedNotificationPreference = notificationPreference || "whatsapp";
    const subscribedChatId = String(
      customerToTelegramChat.get(cleanedCustomerNumber) || "",
    );
    let inheritedTelegramChatId = "";
    if (subscribedChatId) {
      inheritedTelegramChatId = subscribedChatId;
    } else if (cleanedNotificationPreference === "telegram") {
      const latestForCustomer = getAllActiveBids()
        .filter(
          (bid) =>
            normalizePhone(bid.customerNumber) === cleanedCustomerNumber &&
            String(bid.telegramChatId || "").trim() !== "",
        )
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      inheritedTelegramChatId = String(latestForCustomer?.telegramChatId || "");
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
      locationFrom: cleanedLocationFrom,
      locationTo: cleanedLocationTo,
      serviceType: cleanedServiceType,
      sellerContact: "",
      bidOffer: "",
      bidOfferRaw: "",
      bidNote: "",
      bidDate: "",
      bidTime: "",
      needsMoreInfo: "",
      buyerAdditionalInfo: "",
      buyerNote: "",
      notificationPreference: cleanedNotificationPreference,
      requestType: cleanedRequestType || "",
      telegramChatId: inheritedTelegramChatId,
      telegramFlow: null,
      buyerName: "",
      buyerAddress: "",
      buyerCity: "",
      buyerPostalCode: "",
      buyerContact: "",
      buyerDecisionStatus: "pending",
      buyerDecisionAt: "",
      buyerDecisionSource: "",
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
    findByTelegramChatId: (chatId) =>
      getAllActiveBids()
        .filter((bid) => String(bid.telegramChatId || "") === String(chatId))
        .sort((a, b) => b.createdAt - a.createdAt),
    subscribeTelegramChatByCustomer: (chatId, customerNumber) => {
      const normalizedCustomer = normalizePhone(customerNumber);
      if (!normalizedCustomer || !chatId) {
        return { customerNumber: normalizedCustomer, linked: [] };
      }

      customerToTelegramChat.set(normalizedCustomer, String(chatId));
      const linked = [];
      for (const activeBid of getAllActiveBids()) {
        if (normalizePhone(activeBid.customerNumber) !== normalizedCustomer) continue;
        const next = {
          ...activeBid,
          telegramChatId: String(chatId),
        };
        store.set(next.bidId, next);
        linked.push(next);
      }
      linked.sort((a, b) => b.createdAt - a.createdAt);
      return { customerNumber: normalizedCustomer, linked };
    },
    getSubscribedCustomerByChat: (chatId) => {
      const targetChat = String(chatId || "");
      for (const [customerNumber, subscribedChatId] of customerToTelegramChat.entries()) {
        if (String(subscribedChatId) === targetChat) {
          return customerNumber;
        }
      }
      return "";
    },
    unsubscribeTelegramChat: (chatId) => {
      const targetChat = String(chatId || "");
      for (const [customerNumber, subscribedChatId] of customerToTelegramChat.entries()) {
        if (String(subscribedChatId) === targetChat) {
          customerToTelegramChat.delete(customerNumber);
        }
      }
      for (const activeBid of getAllActiveBids()) {
        if (String(activeBid.telegramChatId || "") !== targetChat) continue;
        const next = {
          ...activeBid,
          telegramChatId: "",
          telegramFlow: null,
        };
        store.set(next.bidId, next);
      }
    },
    linkTelegramChatToBid: (bidId, chatId) => {
      const bid = getBidRequest(bidId);
      if (!bid) return null;
      const customer = normalizePhone(bid.customerNumber);
      customerToTelegramChat.set(customer, String(chatId));
      let linked = null;
      for (const activeBid of getAllActiveBids()) {
        if (normalizePhone(activeBid.customerNumber) !== customer) continue;
        const next = {
          ...activeBid,
          telegramChatId: String(chatId),
        };
        store.set(next.bidId, next);
        if (next.bidId === bid.bidId) linked = next;
      }
      return linked || getBidRequest(bidId);
    },
    clearTelegramFlowsForChat: (chatId, exceptBidId = "") => {
      for (const activeBid of getAllActiveBids()) {
        if (String(activeBid.telegramChatId || "") !== String(chatId)) continue;
        if (exceptBidId && String(activeBid.bidId) === String(exceptBidId)) continue;
        if (!activeBid.telegramFlow) continue;
        store.set(activeBid.bidId, { ...activeBid, telegramFlow: null });
      }
    },
    findLatestByTelegramChatId: (chatId) => {
      let latest = null;
      for (const bid of getAllActiveBids()) {
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
      for (const bid of getAllActiveBids()) {
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
    setBuyerDecision: (bidId, { status, source }) => {
      const bid = getBidRequest(bidId);
      if (!bid) {
        return { applied: false, reason: "bid_not_found", bid: null };
      }

      const currentStatus = String(bid.buyerDecisionStatus || "pending");
      if (!["accepted", "declined"].includes(status)) {
        return { applied: false, reason: "invalid_status", bid };
      }
      if (finalDecisionStatuses.has(currentStatus)) {
        return { applied: false, reason: "already_final", bid };
      }

      const next = {
        ...bid,
        buyerDecisionStatus: status,
        buyerDecisionAt: new Date().toISOString(),
        buyerDecisionSource: sanitizeTemplateText(source || ""),
      };
      store.set(next.bidId, next);
      return { applied: true, reason: "ok", bid: next };
    },
  };
};
