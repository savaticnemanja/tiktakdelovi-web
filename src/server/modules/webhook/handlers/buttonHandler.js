import { normalizePhone } from "../../../utils/phone.js";
import { normalizeButtonPayload, getMapEntry } from "../utils.js";
import { applyDecision } from "../helpers/decision.js";
import { getBuyerContact, getBuyerName } from "../helpers/bid.js";
import { formatBuyerMechanicNotificationMessage } from "../../telegram/telegramMessages.js";

export const createButtonHandler = ({
  bidStore,
  messageToBid,
  metaClient,
  telegramClient,
  ownerNumber,
  courierNumber,
  notifyRoadsideAcceptance,
}) => {
  return async (message) => {
    const from = message?.from;
    if (message?.type !== "button" || !message?.button || !from) {
      return false;
    }
    const sender = normalizePhone(from);
    const repliedToId = message?.context?.id;
    const mapEntry = getMapEntry(messageToBid, repliedToId);
    const buttonPayload = message.button.payload || message.button.text || "";
    let actionFromPayload = "";
    let bidIdFromPayload = "";
    try {
      const parsedPayload = JSON.parse(buttonPayload);
      actionFromPayload = String(parsedPayload?.action || "");
      bidIdFromPayload = String(parsedPayload?.bid_id || parsedPayload?.bidId || "");
    } catch (err) {
      actionFromPayload = "";
      bidIdFromPayload = "";
    }
    const normalizedPayload = normalizeButtonPayload(buttonPayload);
    const normalizedText = normalizeButtonPayload(message?.button?.text || "");

    if (mapEntry?.kind === "towing_customer_offer" && mapEntry?.bidId) {
      const bid = bidStore.getBidRequest(mapEntry.bidId);
      if (!bid) {
        return true;
      }
      const expectedBuyer = normalizePhone(bid.customerNumber);
      if (!expectedBuyer || sender !== expectedBuyer) {
        return true;
      }
      const declinesRoadside =
        actionFromPayload === "decline_roadside_offer" ||
        actionFromPayload === "decline_offer" ||
        normalizedPayload.includes("odbij") ||
        normalizedText.includes("odbij") ||
        normalizedPayload.includes("ne prihvat") ||
        normalizedText.includes("ne prihvat") ||
        normalizedPayload.includes("neprihvat") ||
        normalizedText.includes("neprihvat");
      const acceptsRoadside =
        !declinesRoadside &&
        (
          actionFromPayload === "accept_roadside_offer" ||
          actionFromPayload === "accept_offer" ||
          normalizedPayload.includes("prihvat") ||
          normalizedText.includes("prihvat") ||
          normalizedPayload.includes("accept") ||
          normalizedText.includes("accept")
        );
      if (!acceptsRoadside) {
        return true;
      }

      const decision = applyDecision(
        bidStore,
        bid.bidId,
        "accepted",
        "whatsapp_buyer_roadside_quick_reply",
      );
      if (!decision?.applied) {
        return true;
      }
      const updated = bidStore.updateBid(bid.bidId, {
        buyerContact: getBuyerContact(bid),
      });
      try {
        await notifyRoadsideAcceptance(updated || bid);
      } catch (err) {
        console.error(
          "Roadside acceptance notifications failed:",
          err?.response?.data || err.message || String(err),
        );
      }
      return true;
    }

    const ownerSender = normalizePhone(ownerNumber);
    if (!ownerSender || sender !== ownerSender) {
      return true;
    }

    const inferredKind =
      actionFromPayload === "notify_buyer" ||
      actionFromPayload === "notify_mechanic" ||
      normalizedPayload.includes("kupca") ||
      normalizedPayload.includes("mehanicar")
        ? "service_owner_notification"
        : "parts_owner_notification";
    const mapEntryWithFallback =
      mapEntry || (bidIdFromPayload ? { bidId: bidIdFromPayload, kind: inferredKind } : null);
    if (!mapEntryWithFallback) {
      return true;
    }
    const bid = mapEntryWithFallback?.bidId
      ? bidStore.getBidRequest(mapEntryWithFallback.bidId)
      : null;
    if (!bid) {
      return true;
    }

    const wantsCourier =
      actionFromPayload === "notify_courier" || normalizedPayload.includes("dostavlja");
    const wantsSeller =
      actionFromPayload === "notify_seller" || normalizedPayload.includes("prodav");
    const wantsBuyer =
      actionFromPayload === "notify_buyer" || normalizedPayload.includes("kupca");
    const wantsMechanic =
      actionFromPayload === "notify_mechanic" || normalizedPayload.includes("mehanicar");

    if (wantsCourier && mapEntryWithFallback.kind === "parts_owner_notification") {
      if (courierNumber && bid.sellerContact && bid.bidOffer) {
        try {
          await metaClient.sendOfferToCourier({
            to: courierNumber,
            bidId: bid.bidId,
            make: bid.make,
            model: bid.model,
            year: bid.year,
            fuelType: bid.fuelType,
            chassis: bid.chassis,
            buyerName: bid.buyerName,
            buyerAddress: bid.buyerAddress,
            buyerCity: bid.buyerCity,
            buyerPostalCode: bid.buyerPostalCode,
            buyerContact: bid.buyerContact,
            bidMessage: bid.bidMessage,
            sellerNumber: bid.sellerContact,
            bidOffer: bid.bidOffer,
          });
        } catch (err) {
          console.error(
            "Courier notification failed:",
            err?.response?.data || err.message || String(err),
          );
        }
      }
      return true;
    }

    if (wantsSeller && mapEntryWithFallback.kind === "parts_owner_notification") {
      if (bid.sellerContact) {
        try {
          await metaClient.sendNotifySeller({
            to: bid.sellerContact,
            bidId: bid.bidId,
          });
        } catch (err) {
          console.error(
            "Seller notify failed:",
            err?.response?.data || err.message || String(err),
          );
        }
      }
      return true;
    }

    if (wantsBuyer && mapEntryWithFallback.kind === "service_owner_notification") {
      if (bid.customerNumber && bid.sellerContact && bid.bidOffer) {
        try {
          if (
            bid.notificationPreference === "telegram" &&
            telegramClient &&
            bid.telegramChatId
          ) {
            await telegramClient.sendMessage({
              chatId: bid.telegramChatId,
              text: formatBuyerMechanicNotificationMessage({
                bidId: bid.bidId,
                make: bid.make || "-",
                model: bid.model || "-",
                year: bid.year || "-",
                fuelType: bid.fuelType || "-",
                mechanicContact: bid.sellerContact || "-",
                bidOffer: bid.bidOffer || "-",
                bidDate: bid.bidDate || "-",
                bidTime: bid.bidTime || "-",
                bidNote: bid.bidNote || "-",
              }),
            });
          } else {
            await metaClient.sendBuyerMechanicNotification({
              to: bid.customerNumber,
              bidId: bid.bidId,
              make: bid.make,
              model: bid.model,
              year: bid.year,
              fuelType: bid.fuelType,
              mechanicContact: bid.sellerContact,
              bidOffer: bid.bidOffer,
              bidDate: bid.bidDate || "-",
              bidTime: bid.bidTime || "-",
              bidNote: bid.bidNote || "-",
            });
          }
        } catch (err) {
          console.error(
            "Buyer mechanic notification failed:",
            err?.response?.data || err.message || String(err),
          );
        }
      }
      return true;
    }

    if (wantsMechanic && mapEntryWithFallback.kind === "service_owner_notification") {
      if (bid.sellerContact && bid.buyerContact) {
        try {
          await metaClient.sendMechanicNotification({
            to: bid.sellerContact,
            bidId: bid.bidId,
            buyerName: getBuyerName(bid),
            buyerContact: getBuyerContact(bid),
            bidDetails: bid.bidMessage || "-",
          });
        } catch (err) {
          console.error(
            "Mechanic notification failed:",
            err?.response?.data || err.message || String(err),
          );
        }
      }
    }
    return true;
  };
};
