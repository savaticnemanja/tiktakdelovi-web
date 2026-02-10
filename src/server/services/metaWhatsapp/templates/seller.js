export const createSellerTemplates = ({
  sendTemplate,
  sanitize,
  sanitizeMasked,
  sanitizeOrDash,
  templateSellerInquiry,
  templateSellerInquiryFlowTitle,
  templateSellerNotification,
  messageToBid,
}) => {
  const sendInquiryToSeller = async ({
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
      template: templateSellerInquiry,
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
              payload: JSON.stringify({ screen: templateSellerInquiryFlowTitle }),
            },
          ],
        },
      ],
    });

    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "seller_inquiry" });
    }

    return metaResp;
  };

  const sendNotifySeller = async ({ to, bidId }) => {
    if (!templateSellerNotification || !to) {
      return null;
    }
    const sanitizedBidId = sanitize(bidId);
    if (!sanitizedBidId) {
      throw new Error("bidId is required.");
    }
    return sendTemplate({
      to,
      template: templateSellerNotification,
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
              parameter_name: "bid_id",
              text: sanitizedBidId,
            },
          ],
        },
      ],
    });
  };

  return {
    sendInquiryToSeller,
    sendNotifySeller,
  };
};
