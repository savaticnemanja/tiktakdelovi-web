import { parseOfferMessage } from "../../../utils/parseOffer.js";
import { normalizePhone } from "../../../utils/phone.js";
import { applyMarkup } from "../../../utils/price.js";

export const createTextHandler = ({
  bidStore,
  metaClient,
  sellerMarkupPercent,
}) => {
  return async (message) => {
    const textBody = message?.text?.body;
    const from = message?.from;
    if (!textBody || !from) {
      return false;
    }
    const parsed = parseOfferMessage(textBody);
    if (!parsed) {
      return true;
    }

    const bid = bidStore.getBidRequest(parsed.bidId);
    if (!bid) {
      return true;
    }

    const markedOffer = applyMarkup(parsed.bidOffer, sellerMarkupPercent);
    const offerForBuyer = markedOffer || parsed.bidOffer;
    const updatedBid = bidStore.updateBid(parsed.bidId, {
      sellerContact: normalizePhone(from),
      bidOffer: offerForBuyer,
      bidOfferRaw: parsed.bidOffer,
    });

    try {
      await metaClient.sendOfferToBuyer({
        to: updatedBid?.customerNumber || bid.customerNumber,
        bidId: updatedBid?.bidId || bid.bidId,
        bidDetails: updatedBid?.bidMessage || bid.bidMessage,
        bidOffer: offerForBuyer,
      });
    } catch (err) {
      console.error(
        "Buyer offer failed:",
        err?.response?.data || err.message || String(err),
      );
    }
    return true;
  };
};
