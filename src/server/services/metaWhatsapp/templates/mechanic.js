export const createMechanicTemplates = ({
  sendTemplate,
  sanitize,
  sanitizeMasked,
  sanitizeOrDash,
  templateMechanicInquiry,
  templateMechanicInquiryFlowTitle,
  templateMechanicNotification,
  messageToBid,
}) => {
  const sendInquiryToMechanic = async ({
    to,
    bidId,
    bidMessage,
    make,
    model,
    year,
    fuelType,
    chassis,
  }) => {
    const sanitizedBidId = sanitize(bidId);
    const sanitizedBidMessage = sanitizeMasked(bidMessage);
    const sanitizedMake = sanitizeOrDash(make);
    const sanitizedModel = sanitizeOrDash(model);
    const sanitizedYear = sanitizeOrDash(year);
    const sanitizedFuel = sanitizeOrDash(fuelType);
    const sanitizedChassis = sanitizeOrDash(chassis);
    if (!sanitizedBidId || !sanitizedBidMessage) {
      throw new Error("bidId and bidMessage are required.");
    }
    const metaResp = await sendTemplate({
      to,
      template: templateMechanicInquiry,
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
              parameter_name: "make",
              text: sanitizedMake,
            },
            {
              type: "text",
              parameter_name: "model",
              text: sanitizedModel,
            },
            {
              type: "text",
              parameter_name: "year",
              text: sanitizedYear,
            },
            {
              type: "text",
              parameter_name: "fuel_type",
              text: sanitizedFuel,
            },
            {
              type: "text",
              parameter_name: "chassis",
              text: sanitizedChassis,
            },
            {
              type: "text",
              parameter_name: "bid_message",
              text: sanitizedBidMessage,
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
              payload: JSON.stringify({ screen: templateMechanicInquiryFlowTitle }),
            },
          ],
        },
      ],
    });

    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "mechanic_inquiry" });
    }

    return metaResp;
  };

  const sendMechanicNotification = async ({
    to,
    bidId,
    buyerName,
    buyerContact,
    bidDetails,
  }) => {
    if (!templateMechanicNotification || !to) {
      return null;
    }
    const sanitizedBidId = sanitize(bidId);
    const sanitizedBuyerName = sanitizeOrDash(buyerName);
    const sanitizedBuyerContact = sanitizeOrDash(buyerContact);
    const sanitizedBidDetails = sanitizeOrDash(bidDetails);
    if (!sanitizedBidId || !sanitizedBuyerContact) {
      throw new Error("bidId and buyerContact are required.");
    }
    return sendTemplate({
      to,
      template: templateMechanicNotification,
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
            { type: "text", parameter_name: "bid_id", text: sanitizedBidId },
            { type: "text", parameter_name: "buyer_name", text: sanitizedBuyerName },
            { type: "text", parameter_name: "buyer_contact", text: sanitizedBuyerContact },
            { type: "text", parameter_name: "bid_details", text: sanitizedBidDetails },
          ],
        },
      ],
    });
  };

  return {
    sendInquiryToMechanic,
    sendMechanicNotification,
  };
};
