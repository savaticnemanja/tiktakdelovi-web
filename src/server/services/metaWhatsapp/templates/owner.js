import {
  quickReplyButton,
  textParam,
  trackSent,
  requireFields,
  sanitizeFields,
  validateInput,
} from "./_helpers.js";

export const createOwnerTemplates = ({
  sendTemplate,
  sanitize,
  sanitizeOrDash,
  templateOwnerNotification,
  templateCourierNotification,
  templateOwnerNotificationMechanic,
  templateOwnerRoadsideNotification,
  messageToBid,
}) => {
  const sendOfferToOwner = async ({
    to,
    bidId,
    make,
    model,
    year,
    fuelType,
    chassis,
    buyerName,
    buyerAddress,
    buyerCity,
    buyerPostalCode,
    buyerContact,
    bidMessage,
    sellerNumber,
    bidOffer,
  }) => {
    if (!templateOwnerNotification || !to) {
      return null;
    }
    validateInput(
      "sendOfferToOwner",
      { bidId, bidOffer, sellerNumber },
      {
        bidId: { required: true, types: ["string", "number"] },
        bidOffer: { required: true, types: ["string", "number"] },
        sellerNumber: { required: true, types: ["string", "number"] },
      },
    );
    const sanitized = sanitizeFields(
      {
        bidId,
        make,
        model,
        year,
        fuelType,
        chassis,
        buyerName,
        buyerAddress,
        buyerCity,
        buyerPostalCode,
        buyerContact,
        bidMessage,
        sellerNumber,
        bidOffer,
      },
      {
        bidId: sanitize,
        make: sanitizeOrDash,
        model: sanitizeOrDash,
        year: sanitizeOrDash,
        fuelType: sanitizeOrDash,
        chassis: sanitizeOrDash,
        buyerName: sanitizeOrDash,
        buyerAddress: sanitizeOrDash,
        buyerCity: sanitizeOrDash,
        buyerPostalCode: sanitizeOrDash,
        buyerContact: sanitizeOrDash,
        bidMessage: sanitizeOrDash,
        sellerNumber: sanitize,
        bidOffer: sanitize,
      },
    );
    requireFields("sendOfferToOwner", {
      bidId: sanitized.bidId,
      bidOffer: sanitized.bidOffer,
      sellerNumber: sanitized.sellerNumber,
    });
    const metaResp = await sendTemplate({
      to,
      template: templateOwnerNotification,
      components: [
        {
          type: "header",
          parameters: [
            textParam("bid_id", sanitized.bidId),
          ],
        },
        {
          type: "body",
          parameters: [
            textParam("make", sanitized.make),
            textParam("model", sanitized.model),
            textParam("year", sanitized.year),
            textParam("fuel_type", sanitized.fuelType),
            textParam("chassis", sanitized.chassis),
            textParam("buyer_name", sanitized.buyerName),
            textParam("buyer_address", sanitized.buyerAddress),
            textParam("buyer_city", sanitized.buyerCity),
            textParam("buyer_postal_code", sanitized.buyerPostalCode),
            textParam("buyer_contact", sanitized.buyerContact),
            textParam("bid_message", sanitized.bidMessage),
            textParam("seller_contact", sanitized.sellerNumber),
            textParam("bid_offer", sanitized.bidOffer),
          ],
        },
        quickReplyButton(0, { action: "notify_courier", bid_id: sanitized.bidId }),
        quickReplyButton(1, { action: "notify_seller", bid_id: sanitized.bidId }),
      ],
    });
    trackSent(messageToBid, metaResp, sanitized.bidId, "parts_owner_notification");
    return metaResp;
  };

  const sendOfferToCourier = async ({
    to,
    bidId,
    make,
    model,
    year,
    fuelType,
    chassis,
    buyerName,
    buyerAddress,
    buyerCity,
    buyerPostalCode,
    buyerContact,
    bidMessage,
    bidOffer,
    sellerNumber,
  }) => {
    if (!templateCourierNotification || !to) {
      return null;
    }
    validateInput(
      "sendOfferToCourier",
      { bidId, bidOffer, sellerNumber },
      {
        bidId: { required: true, types: ["string", "number"] },
        bidOffer: { required: true, types: ["string", "number"] },
        sellerNumber: { required: true, types: ["string", "number"] },
      },
    );
    const sanitized = sanitizeFields(
      {
        bidId,
        make,
        model,
        year,
        fuelType,
        chassis,
        buyerName,
        buyerAddress,
        buyerCity,
        buyerPostalCode,
        buyerContact,
        bidMessage,
        bidOffer,
        sellerNumber,
      },
      {
        bidId: sanitize,
        make: sanitizeOrDash,
        model: sanitizeOrDash,
        year: sanitizeOrDash,
        fuelType: sanitizeOrDash,
        chassis: sanitizeOrDash,
        buyerName: sanitizeOrDash,
        buyerAddress: sanitizeOrDash,
        buyerCity: sanitizeOrDash,
        buyerPostalCode: sanitizeOrDash,
        buyerContact: sanitizeOrDash,
        bidMessage: sanitizeOrDash,
        bidOffer: sanitize,
        sellerNumber: sanitize,
      },
    );
    requireFields("sendOfferToCourier", {
      bidId: sanitized.bidId,
      bidOffer: sanitized.bidOffer,
      sellerNumber: sanitized.sellerNumber,
    });
    return sendTemplate({
      to,
      template: templateCourierNotification,
      components: [
        {
          type: "header",
          parameters: [
            textParam("bid_id", sanitized.bidId),
          ],
        },
        {
          type: "body",
          parameters: [
            textParam("make", sanitized.make),
            textParam("model", sanitized.model),
            textParam("year", sanitized.year),
            textParam("fuel_type", sanitized.fuelType),
            textParam("chassis", sanitized.chassis),
            textParam("buyer_name", sanitized.buyerName),
            textParam("buyer_address", sanitized.buyerAddress),
            textParam("buyer_city", sanitized.buyerCity),
            textParam("buyer_postal_code", sanitized.buyerPostalCode),
            textParam("buyer_contact", sanitized.buyerContact),
            textParam("bid_message", sanitized.bidMessage),
            textParam("seller_contact", sanitized.sellerNumber),
            textParam("bid_offer", sanitized.bidOffer),
          ],
        },
      ],
    });
  };

  const sendOfferToOwnerMechanic = async ({
    to,
    bidId,
    make,
    model,
    year,
    fuelType,
    chassis,
    buyerName,
    buyerContact,
    bidDetails,
    mechanicContact,
    bidOffer,
    bidDate,
    bidTime,
    bidNote,
  }) => {
    if (!templateOwnerNotificationMechanic || !to) {
      return null;
    }
    validateInput(
      "sendOfferToOwnerMechanic",
      { bidId, bidOffer, mechanicContact },
      {
        bidId: { required: true, types: ["string", "number"] },
        bidOffer: { required: true, types: ["string", "number"] },
        mechanicContact: { required: true, types: ["string", "number"] },
      },
    );
    const sanitized = sanitizeFields(
      {
        bidId,
        make,
        model,
        year,
        fuelType,
        chassis,
        buyerName,
        buyerContact,
        bidDetails,
        mechanicContact,
        bidOffer,
        bidDate,
        bidTime,
        bidNote,
      },
      {
        bidId: sanitize,
        make: sanitizeOrDash,
        model: sanitizeOrDash,
        year: sanitizeOrDash,
        fuelType: sanitizeOrDash,
        chassis: sanitizeOrDash,
        buyerName: sanitizeOrDash,
        buyerContact: sanitizeOrDash,
        bidDetails: sanitizeOrDash,
        mechanicContact: sanitizeOrDash,
        bidOffer: sanitize,
        bidDate: sanitizeOrDash,
        bidTime: sanitizeOrDash,
        bidNote: sanitizeOrDash,
      },
    );
    requireFields("sendOfferToOwnerMechanic", {
      bidId: sanitized.bidId,
      bidOffer: sanitized.bidOffer,
      mechanicContact: sanitized.mechanicContact,
    });
    const metaResp = await sendTemplate({
      to,
      template: templateOwnerNotificationMechanic,
      components: [
        {
          type: "header",
          parameters: [
            textParam("bid_id", sanitized.bidId),
          ],
        },
        {
          type: "body",
          parameters: [
            textParam("make", sanitized.make),
            textParam("model", sanitized.model),
            textParam("year", sanitized.year),
            textParam("fuel_type", sanitized.fuelType),
            textParam("chassis", sanitized.chassis),
            textParam("buyer_name", sanitized.buyerName),
            textParam("buyer_contact", sanitized.buyerContact),
            textParam("bid_details", sanitized.bidDetails),
            textParam("mechanic_contact", sanitized.mechanicContact),
            textParam("bid_offer", sanitized.bidOffer),
            textParam("bid_date", sanitized.bidDate),
            textParam("bid_time", sanitized.bidTime),
            textParam("bid_note", sanitized.bidNote),
          ],
        },
        quickReplyButton(0, { action: "notify_buyer", bid_id: sanitized.bidId }),
        quickReplyButton(1, { action: "notify_mechanic", bid_id: sanitized.bidId }),
      ],
    });
    trackSent(messageToBid, metaResp, sanitized.bidId, "service_owner_notification");
    return metaResp;
  };

  const sendOwnerRoadsideNotification = async ({
    to,
    bidId,
    roadsideOrTow,
    location,
    buyerName,
    buyerContact,
    details,
    roadsideContact,
    bidOffer,
  }) => {
    if (!templateOwnerRoadsideNotification || !to) {
      return null;
    }
    validateInput(
      "sendOwnerRoadsideNotification",
      { bidId, roadsideOrTow, buyerContact, roadsideContact },
      {
        bidId: { required: true, types: ["string", "number"] },
        roadsideOrTow: { required: true, types: ["string"] },
        buyerContact: { required: true, types: ["string", "number"] },
        roadsideContact: { required: true, types: ["string", "number"] },
      },
    );
    const sanitized = sanitizeFields(
      {
        bidId,
        roadsideOrTow,
        location,
        buyerName,
        buyerContact,
        details,
        roadsideContact,
        bidOffer,
      },
      {
        bidId: sanitize,
        roadsideOrTow: sanitizeOrDash,
        location: sanitizeOrDash,
        buyerName: sanitizeOrDash,
        buyerContact: sanitizeOrDash,
        details: sanitizeOrDash,
        roadsideContact: sanitizeOrDash,
        bidOffer: sanitizeOrDash,
      },
    );
    requireFields("sendOwnerRoadsideNotification", {
      bidId: sanitized.bidId,
      roadsideOrTow: sanitized.roadsideOrTow,
      buyerContact: sanitized.buyerContact,
      roadsideContact: sanitized.roadsideContact,
    });
    return sendTemplate({
      to,
      template: templateOwnerRoadsideNotification,
      components: [
        {
          type: "header",
          parameters: [
            textParam("bid_id", sanitized.bidId),
          ],
        },
        {
          type: "body",
          parameters: [
            textParam("location", sanitized.location),
            textParam("details", sanitized.details),
            textParam("buyer_name", sanitized.buyerName),
            textParam("buyer_contact", sanitized.buyerContact),
            textParam("roadside_or_tow", sanitized.roadsideOrTow),
            textParam("roadside_contact", sanitized.roadsideContact),
            textParam("bid_offer", sanitized.bidOffer),
          ],
        },
      ],
    });
  };

  return {
    sendOfferToOwner,
    sendOfferToCourier,
    sendOfferToOwnerMechanic,
    sendOwnerRoadsideNotification,
  };
};
