export const createTowTemplates = ({
  sendTemplate,
  sanitize,
  sanitizeMasked,
  sanitizeOrDash,
  templateRoadsideNotification,
  messageToBid,
}) => {
  const sendTowInquiry = async ({
    to,
    bidId,
    locationFrom,
    locationTo,
    details,
    templateName,
    flowTitle,
  }) => {
    if (!templateName || !to) {
      return null;
    }
    const sanitizedBidId = sanitize(bidId);
    const sanitizedLocationFrom = sanitizeMasked(locationFrom);
    const sanitizedLocationTo = sanitizeMasked(locationTo) || "";
    const sanitizedLocation = sanitizedLocationTo
      ? `${sanitizedLocationFrom} - ${sanitizedLocationTo}`
      : sanitizedLocationFrom;
    const sanitizedDetails = sanitizeMasked(details);
    if (!sanitizedBidId || !sanitizedLocationFrom || !sanitizedDetails) {
      throw new Error("bidId, locationFrom and details are required.");
    }
    const metaResp = await sendTemplate({
      to,
      template: templateName,
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
              parameter_name: "location",
              text: sanitizedLocation,
            },
            {
              type: "text",
              parameter_name: "details",
              text: sanitizedDetails,
            },
          ],
        },
        ...(flowTitle
          ? [
              {
                type: "button",
                sub_type: "flow",
                index: "0",
                parameters: [
                  {
                    type: "payload",
                    payload: JSON.stringify({ screen: flowTitle }),
                  },
                ],
              },
            ]
          : []),
      ],
    });

    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "tow_inquiry" });
    }
    return metaResp;
  };

  const sendRoadsideNotification = async ({
    to,
    bidId,
    buyerName,
    buyerContact,
    location,
  }) => {
    if (!templateRoadsideNotification || !to) {
      return null;
    }
    const sanitizedBidId = sanitize(bidId);
    const sanitizedBuyerName = sanitizeOrDash(buyerName);
    const sanitizedBuyerContact = sanitizeOrDash(buyerContact);
    const sanitizedLocation = sanitizeOrDash(location);
    if (!sanitizedBidId || !sanitizedBuyerContact) {
      throw new Error("bidId and buyerContact are required.");
    }
    return sendTemplate({
      to,
      template: templateRoadsideNotification,
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
            { type: "text", parameter_name: "location", text: sanitizedLocation },
          ],
        },
      ],
    });
  };

  return {
    sendTowInquiry,
    sendRoadsideNotification,
  };
};
