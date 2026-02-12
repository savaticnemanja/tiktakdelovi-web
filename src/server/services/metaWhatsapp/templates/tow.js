import {
  flowButton,
  textParam,
  trackSent,
  requireFields,
  sanitizeFields,
  validateInput,
} from "./_helpers.js";

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
    validateInput(
      "sendTowInquiry",
      { bidId, locationFrom, details },
      {
        bidId: { required: true, types: ["string", "number"] },
        locationFrom: { required: true, types: ["string"] },
        details: { required: true, types: ["string"] },
      },
    );
    const sanitized = sanitizeFields(
      { bidId, locationFrom, locationTo, details },
      {
        bidId: sanitize,
        locationFrom: sanitizeMasked,
        locationTo: sanitizeMasked,
        details: sanitizeMasked,
      },
    );
    const sanitizedLocationTo = sanitized.locationTo || "";
    const sanitizedLocation = sanitizedLocationTo
      ? `${sanitized.locationFrom} - ${sanitizedLocationTo}`
      : sanitized.locationFrom;
    requireFields("sendTowInquiry", {
      bidId: sanitized.bidId,
      locationFrom: sanitized.locationFrom,
      details: sanitized.details,
    });
    const metaResp = await sendTemplate({
      to,
      template: templateName,
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
            textParam("location", sanitizedLocation),
            textParam("details", sanitized.details),
          ],
        },
        ...(flowTitle
          ? [
              flowButton(flowTitle),
            ]
          : []),
      ],
    });

    trackSent(messageToBid, metaResp, sanitized.bidId, "towing_operator_inquiry");
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
    validateInput(
      "sendRoadsideNotification",
      { bidId, buyerContact },
      {
        bidId: { required: true, types: ["string", "number"] },
        buyerContact: { required: true, types: ["string", "number"] },
      },
    );
    const sanitized = sanitizeFields(
      { bidId, buyerName, buyerContact, location },
      {
        bidId: sanitize,
        buyerName: sanitizeOrDash,
        buyerContact: sanitizeOrDash,
        location: sanitizeOrDash,
      },
    );
    requireFields("sendRoadsideNotification", {
      bidId: sanitized.bidId,
      buyerContact: sanitized.buyerContact,
    });
    return sendTemplate({
      to,
      template: templateRoadsideNotification,
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
            textParam("bid_id", sanitized.bidId),
            textParam("buyer_name", sanitized.buyerName),
            textParam("buyer_contact", sanitized.buyerContact),
            textParam("location", sanitized.location),
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
