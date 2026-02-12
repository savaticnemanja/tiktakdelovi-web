import { buildLocation, getRoadsideLabels } from "./utils.js";
import { getBuyerContact, getBuyerName } from "./helpers/bid.js";

export const createWebhookResponders = ({ metaClient, ownerNumber }) => {
  const notifyRoadsideAcceptance = async (bid) => {
    if (!bid?.sellerContact || !bid?.bidOffer) {
      return;
    }
    const labels = getRoadsideLabels(bid.serviceType);
    const location = buildLocation(bid);
    await metaClient.sendOwnerRoadsideNotification({
      to: ownerNumber,
      bidId: bid.bidId,
      roadsideOrTow: labels.roadsideOrTow,
      location,
      buyerName: getBuyerName(bid),
      buyerContact: getBuyerContact(bid),
      details: bid.bidMessage || "-",
      roadsideContact: bid.sellerContact,
      bidOffer: bid.bidOffer,
    });
    await metaClient.sendRoadsideNotification({
      to: bid.sellerContact,
      bidId: bid.bidId,
      buyerName: getBuyerName(bid),
      buyerContact: getBuyerContact(bid),
      location,
      details: bid.bidMessage || "-",
    });
    await metaClient.sendBuyerRoadsideNotification({
      to: bid.customerNumber,
      bidId: bid.bidId,
      roadsideContact: bid.sellerContact,
      bidOffer: bid.bidOffer,
    });
  };

  return {
    notifyRoadsideAcceptance,
  };
};
