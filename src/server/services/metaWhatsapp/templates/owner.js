export const createOwnerTemplates = ({
  sendTemplate,
  sanitize,
  sanitizeMasked,
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
    const sanitizedBidId = sanitize(bidId);
    const sanitizedMake = sanitizeOrDash(make);
    const sanitizedModel = sanitizeOrDash(model);
    const sanitizedYear = sanitizeOrDash(year);
    const sanitizedFuel = sanitizeOrDash(fuelType);
    const sanitizedChassis = sanitizeOrDash(chassis);
    const sanitizedBuyerName = sanitizeOrDash(buyerName);
    const sanitizedBuyerAddress = sanitizeOrDash(buyerAddress);
    const sanitizedBuyerCity = sanitizeOrDash(buyerCity);
    const sanitizedBuyerPostalCode = sanitizeOrDash(buyerPostalCode);
    const sanitizedBuyerContact = sanitizeOrDash(buyerContact);
    const sanitizedBidMessage = sanitizeOrDash(bidMessage);
    const sanitizedBidOffer = sanitize(bidOffer);
    const sanitizedSellerNumber = sanitize(sellerNumber);
    if (
      !sanitizedBidId ||
      !sanitizedBidOffer ||
      !sanitizedSellerNumber
    ) {
      throw new Error(
        "bidId, bidOffer and sellerNumber are required.",
      );
    }
    const metaResp = await sendTemplate({
      to,
      template: templateOwnerNotification,
      components: [
        {
          type: "header",
          parameters: [
            { type: "text", parameter_name: "bid_id", text: sanitizedBidId },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "make", text: sanitizedMake },
            { type: "text", parameter_name: "model", text: sanitizedModel },
            { type: "text", parameter_name: "year", text: sanitizedYear },
            { type: "text", parameter_name: "fuel_type", text: sanitizedFuel },
            { type: "text", parameter_name: "chassis", text: sanitizedChassis },
            { type: "text", parameter_name: "buyer_name", text: sanitizedBuyerName },
            { type: "text", parameter_name: "buyer_address", text: sanitizedBuyerAddress },
            { type: "text", parameter_name: "buyer_city", text: sanitizedBuyerCity },
            { type: "text", parameter_name: "buyer_postal_code", text: sanitizedBuyerPostalCode },
            { type: "text", parameter_name: "buyer_contact", text: sanitizedBuyerContact },
            { type: "text", parameter_name: "bid_message", text: sanitizedBidMessage },
            { type: "text", parameter_name: "seller_contact", text: sanitizedSellerNumber },
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: JSON.stringify({
                action: "notify_courier",
                bid_id: sanitizedBidId,
              }),
            },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "1",
          parameters: [
            {
              type: "payload",
              payload: JSON.stringify({
                action: "notify_seller",
                bid_id: sanitizedBidId,
              }),
            },
          ],
        },
      ],
    });
    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "owner_notification" });
    }
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
    const sanitizedBidId = sanitize(bidId);
    const sanitizedMake = sanitizeOrDash(make);
    const sanitizedModel = sanitizeOrDash(model);
    const sanitizedYear = sanitizeOrDash(year);
    const sanitizedFuel = sanitizeOrDash(fuelType);
    const sanitizedChassis = sanitizeOrDash(chassis);
    const sanitizedBuyerName = sanitizeOrDash(buyerName);
    const sanitizedBuyerAddress = sanitizeOrDash(buyerAddress);
    const sanitizedBuyerCity = sanitizeOrDash(buyerCity);
    const sanitizedBuyerPostalCode = sanitizeOrDash(buyerPostalCode);
    const sanitizedBuyerContact = sanitizeOrDash(buyerContact);
    const sanitizedBidMessage = sanitizeOrDash(bidMessage);
    const sanitizedBidOffer = sanitize(bidOffer);
    const sanitizedSellerNumber = sanitize(sellerNumber);
    if (
      !sanitizedBidId ||
      !sanitizedBidOffer ||
      !sanitizedSellerNumber
    ) {
      throw new Error(
        "bidId, bidOffer and sellerNumber are required.",
      );
    }
    return sendTemplate({
      to,
      template: templateCourierNotification,
      components: [
        {
          type: "header",
          parameters: [
            { type: "text", parameter_name: "bid_id", text: sanitizedBidId },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "make", text: sanitizedMake },
            { type: "text", parameter_name: "model", text: sanitizedModel },
            { type: "text", parameter_name: "year", text: sanitizedYear },
            { type: "text", parameter_name: "fuel_type", text: sanitizedFuel },
            { type: "text", parameter_name: "chassis", text: sanitizedChassis },
            { type: "text", parameter_name: "buyer_name", text: sanitizedBuyerName },
            { type: "text", parameter_name: "buyer_address", text: sanitizedBuyerAddress },
            { type: "text", parameter_name: "buyer_city", text: sanitizedBuyerCity },
            { type: "text", parameter_name: "buyer_postal_code", text: sanitizedBuyerPostalCode },
            { type: "text", parameter_name: "buyer_contact", text: sanitizedBuyerContact },
            { type: "text", parameter_name: "bid_message", text: sanitizedBidMessage },
            { type: "text", parameter_name: "seller_contact", text: sanitizedSellerNumber },
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
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
    const sanitizedBidId = sanitize(bidId);
    const sanitizedMake = sanitizeOrDash(make);
    const sanitizedModel = sanitizeOrDash(model);
    const sanitizedYear = sanitizeOrDash(year);
    const sanitizedFuel = sanitizeOrDash(fuelType);
    const sanitizedChassis = sanitizeOrDash(chassis);
    const sanitizedBuyerName = sanitizeOrDash(buyerName);
    const sanitizedBuyerContact = sanitizeOrDash(buyerContact);
    const sanitizedBidDetails = sanitizeOrDash(bidDetails);
    const sanitizedMechanicContact = sanitizeOrDash(mechanicContact);
    const sanitizedBidOffer = sanitize(bidOffer);
    const sanitizedBidDate = sanitizeOrDash(bidDate);
    const sanitizedBidTime = sanitizeOrDash(bidTime);
    const sanitizedBidNote = sanitizeOrDash(bidNote);
    if (!sanitizedBidId || !sanitizedBidOffer || !sanitizedMechanicContact) {
      throw new Error("bidId, bidOffer and mechanicContact are required.");
    }
    const metaResp = await sendTemplate({
      to,
      template: templateOwnerNotificationMechanic,
      components: [
        {
          type: "header",
          parameters: [
            { type: "text", parameter_name: "bid_id", text: sanitizedBidId },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "make", text: sanitizedMake },
            { type: "text", parameter_name: "model", text: sanitizedModel },
            { type: "text", parameter_name: "year", text: sanitizedYear },
            { type: "text", parameter_name: "fuel_type", text: sanitizedFuel },
            { type: "text", parameter_name: "chassis", text: sanitizedChassis },
            { type: "text", parameter_name: "buyer_name", text: sanitizedBuyerName },
            { type: "text", parameter_name: "buyer_contact", text: sanitizedBuyerContact },
            { type: "text", parameter_name: "bid_details", text: sanitizedBidDetails },
            {
              type: "text",
              parameter_name: "mechanic_contact",
              text: sanitizedMechanicContact,
            },
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
            { type: "text", parameter_name: "bid_date", text: sanitizedBidDate },
            { type: "text", parameter_name: "bid_time", text: sanitizedBidTime },
            { type: "text", parameter_name: "bid_note", text: sanitizedBidNote },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: JSON.stringify({
                action: "notify_buyer",
                bid_id: sanitizedBidId,
              }),
            },
          ],
        },
        {
          type: "button",
          sub_type: "quick_reply",
          index: "1",
          parameters: [
            {
              type: "payload",
              payload: JSON.stringify({
                action: "notify_mechanic",
                bid_id: sanitizedBidId,
              }),
            },
          ],
        },
      ],
    });
    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "owner_notification_mechanic" });
    }
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
    const sanitizedBidId = sanitize(bidId);
    const sanitizedRoadsideOrTow = sanitizeOrDash(roadsideOrTow);
    const sanitizedLocation = sanitizeOrDash(location);
    const sanitizedBuyerName = sanitizeOrDash(buyerName);
    const sanitizedBuyerContact = sanitizeOrDash(buyerContact);
    const sanitizedDetails = sanitizeOrDash(details);
    const sanitizedRoadsideContact = sanitizeOrDash(roadsideContact);
    const sanitizedBidOffer = sanitizeOrDash(bidOffer);
    if (!sanitizedBidId || !sanitizedRoadsideOrTow || !sanitizedBuyerContact || !sanitizedRoadsideContact) {
      throw new Error("bidId, roadsideOrTow, buyerContact and roadsideContact are required.");
    }
    return sendTemplate({
      to,
      template: templateOwnerRoadsideNotification,
      components: [
        {
          type: "header",
          parameters: [
            { type: "text", parameter_name: "bid_id", text: sanitizedBidId },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "location", text: sanitizedLocation },
            { type: "text", parameter_name: "details", text: sanitizedDetails },
            { type: "text", parameter_name: "buyer_name", text: sanitizedBuyerName },
            { type: "text", parameter_name: "buyer_contact", text: sanitizedBuyerContact },
            {
              type: "text",
              parameter_name: "roadside_or_tow",
              text: sanitizedRoadsideOrTow,
            },
            { type: "text", parameter_name: "roadside_contact", text: sanitizedRoadsideContact },
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
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
