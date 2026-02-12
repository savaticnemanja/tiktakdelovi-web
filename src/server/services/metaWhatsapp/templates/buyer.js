export const createBuyerTemplates = ({
  sendTemplate,
  sanitize,
  sanitizeMasked,
  sanitizeMaskedOrDash,
  sanitizeOrDash,
  templateBuyerReview,
  templateBuyerReviewFlowTitle,
  templateBuyerOffer,
  templateBuyerOfferFlowTitle,
  templateBuyerRoadsideOffer,
  templateBuyerRoadsideOfferFlowTitle,
  templateBuyerMechanicOffer,
  templateBuyerMechanicOfferFlowTitle,
  templateBuyerRoadsideNotification,
  templateBuyerMechanicNotification,
  messageToBid,
}) => {
  const sendBuyerReview = async ({
    to,
    bidId,
    bidDetails,
    bidNote,
  }) => {
    const sanitizedBidId = sanitize(bidId);
    const sanitizedBidDetails = sanitizeMasked(bidDetails);
    const sanitizedBidNote = sanitizeMaskedOrDash(bidNote);
    if (!sanitizedBidId || !sanitizedBidDetails) {
      throw new Error("bidId and bidDetails are required.");
    }
    const metaResp = await sendTemplate({
      to,
      template: templateBuyerReview,
      keepPlus: true,
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "text",
              parameter_name: "bid_id",
              text: sanitizedBidId,
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "bid_details",
              text: sanitizedBidDetails,
            },
            {
              type: "text",
              parameter_name: "bid_note",
              text: sanitizedBidNote || "-",
            },
          ],
        },
        {
          type: "button",
          sub_type: "flow",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: JSON.stringify({ screen: templateBuyerReviewFlowTitle }),
            },
          ],
        },
      ],
    });
    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "parts_customer_review" });
    }
    return metaResp;
  };

  const sendOfferToBuyer = async ({
    to,
    bidId,
    bidDetails,
    bidOffer,
    bidNote,
  }) => {
    const sanitizedBidId = sanitize(bidId);
    const sanitizedBidDetails = sanitizeMasked(bidDetails);
    const sanitizedBidOffer = sanitize(bidOffer);
    const sanitizedBidNote = sanitizeMaskedOrDash(bidNote);
    if (!sanitizedBidId || !sanitizedBidDetails || !sanitizedBidOffer) {
      throw new Error("bidId, bidDetails and bidOffer are required.");
    }
    const metaResp = await sendTemplate({
      to,
      template: templateBuyerOffer,
      keepPlus: true,
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "text",
              parameter_name: "bid_id",
              text: sanitizedBidId,
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "bid_details",
              text: sanitizedBidDetails,
            },
            {
              type: "text",
              parameter_name: "bid_offer",
              text: sanitizedBidOffer,
            },
            {
              type: "text",
              parameter_name: "bid_note",
              text: sanitizedBidNote || "-",
            },
          ],
        },
        {
          type: "button",
          sub_type: "flow",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: JSON.stringify({
                screen: templateBuyerMechanicOfferFlowTitle || templateBuyerOfferFlowTitle,
              }),
            },
          ],
        },
      ],
    });
    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "parts_customer_offer" });
    }
    return metaResp;
  };

  const sendRoadsideOfferToBuyer = async ({
    to,
    bidId,
    bidDetails,
    bidOffer,
    location,
  }) => {
    const sanitizedBidId = sanitize(bidId);
    const sanitizedBidDetails = sanitizeMasked(bidDetails);
    const sanitizedBidOffer = sanitize(bidOffer);
    const sanitizedLocation = sanitizeMasked(location);
    if (!sanitizedBidId || !sanitizedBidDetails || !sanitizedBidOffer || !sanitizedLocation) {
      throw new Error("bidId, bidDetails, bidOffer and location are required.");
    }
    const baseComponents = [
      {
        type: "header",
        parameters: [
          {
            type: "text",
            parameter_name: "bid_id",
            text: sanitizedBidId,
          },
        ],
      },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "bid_id",
              text: sanitizedBidId,
            },
            {
              type: "text",
              parameter_name: "location",
              text: sanitizedLocation,
            },
            {
              type: "text",
              parameter_name: "bid_details",
              text: sanitizedBidDetails,
            },
          {
            type: "text",
            parameter_name: "bid_offer",
            text: sanitizedBidOffer,
          },
        ],
      },
    ];

    const metaResp = await sendTemplate({
      to,
      template: templateBuyerRoadsideOffer,
      keepPlus: true,
      components: baseComponents,
    });

    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "towing_customer_offer" });
    }
    return metaResp;
  };

  const sendOfferToBuyerMechanic = async ({
    to,
    bidId,
    bidDetails,
    bidOffer,
    bidDate,
    bidNote,
  }) => {
    const sanitizedBidId = sanitize(bidId);
    const sanitizedBidDetails = sanitizeMasked(bidDetails);
    const sanitizedBidOffer = sanitize(bidOffer);
    const sanitizedBidDate = sanitize(bidDate);
    const sanitizedBidNote = sanitizeMaskedOrDash(bidNote);
    if (!sanitizedBidId || !sanitizedBidDetails || !sanitizedBidOffer) {
      throw new Error("bidId, bidDetails and bidOffer are required.");
    }
    const metaResp = await sendTemplate({
      to,
      template: templateBuyerMechanicOffer,
      keepPlus: true,
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "text",
              parameter_name: "bid_id",
              text: sanitizedBidId,
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "bid_details",
              text: sanitizedBidDetails,
            },
            {
              type: "text",
              parameter_name: "bid_offer",
              text: sanitizedBidOffer,
            },
            {
              type: "text",
              parameter_name: "bid_date",
              text: sanitizedBidDate,
            },
            {
              type: "text",
              parameter_name: "bid_note",
              text: sanitizedBidNote || "-",
            },
          ],
        },
        {
          type: "button",
          sub_type: "flow",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: JSON.stringify({ screen: templateBuyerOfferFlowTitle }),
            },
          ],
        },
      ],
    });
    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "service_customer_offer" });
    }
    return metaResp;
  };

  const sendBuyerRoadsideNotification = async ({
    to,
    bidId,
    roadsideOrTowData,
    roadsideContact,
    bidOffer,
  }) => {
    if (!templateBuyerRoadsideNotification || !to) {
      return null;
    }
    const sanitizedBidId = sanitize(bidId);
    const sanitizedRoadsideOrTowData = sanitizeOrDash(roadsideOrTowData);
    const sanitizedRoadsideContact = sanitizeOrDash(roadsideContact);
    const sanitizedBidOffer = sanitizeOrDash(bidOffer);
    if (!sanitizedBidId || !sanitizedRoadsideContact) {
      throw new Error("bidId and roadsideContact are required.");
    }
    return sendTemplate({
      to,
      template: templateBuyerRoadsideNotification,
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
            {
              type: "text",
              parameter_name: "roadside_or_tow_data",
              text: sanitizedRoadsideOrTowData,
            },
            { type: "text", parameter_name: "bid_id", text: sanitizedBidId },
            {
              type: "text",
              parameter_name: "roadside_contact",
              text: sanitizedRoadsideContact,
            },
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
          ],
        },
      ],
    });
  };

  const sendBuyerMechanicNotification = async ({
    to,
    bidId,
    make,
    model,
    year,
    fuelType,
    mechanicContact,
    bidOffer,
    bidDate,
    bidTime,
    bidNote,
  }) => {
    if (!templateBuyerMechanicNotification || !to) {
      return null;
    }
    const sanitizedBidId = sanitize(bidId);
    const sanitizedMake = sanitizeOrDash(make);
    const sanitizedModel = sanitizeOrDash(model);
    const sanitizedYear = sanitizeOrDash(year);
    const sanitizedFuel = sanitizeOrDash(fuelType);
    const sanitizedMechanicContact = sanitizeOrDash(mechanicContact);
    const sanitizedBidOffer = sanitizeOrDash(bidOffer);
    const sanitizedBidDate = sanitizeOrDash(bidDate);
    const sanitizedBidTime = sanitizeOrDash(bidTime);
    const sanitizedBidNote = sanitizeOrDash(bidNote);
    if (!sanitizedBidId || !sanitizedBidOffer || !sanitizedMechanicContact) {
      throw new Error("bidId, bidOffer and mechanicContact are required.");
    }
    return sendTemplate({
      to,
      template: templateBuyerMechanicNotification,
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
            {
              type: "text",
              parameter_name: "mechanic_contact",
              text: sanitizedMechanicContact,
            },
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
            { type: "text", parameter_name: "bid_date", text: sanitizedBidDate },
            { type: "text", parameter_name: "bid_note", text: sanitizedBidNote },
          ],
        },
      ],
    });
  };

  return {
    sendBuyerReview,
    sendOfferToBuyer,
    sendRoadsideOfferToBuyer,
    sendOfferToBuyerMechanic,
    sendBuyerRoadsideNotification,
    sendBuyerMechanicNotification,
  };
};
