import {
  flowButton,
  textParam,
  trackSent,
  requireFields,
  sanitizeFields,
  validateInput,
} from "./_helpers.js";

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
    validateInput(
      "sendInquiryToSeller",
      { to, bidId, bidMessage },
      {
        to: { required: true, types: ["string", "number"] },
        bidId: { required: true, types: ["string", "number"] },
        bidMessage: { required: true, types: ["string"] },
      },
    );
    const sanitized = sanitizeFields(
      {
        bidId,
        bidMessage,
        make,
        model,
        year,
        fuelType,
        chassis,
      },
      {
        bidId: sanitize,
        bidMessage: sanitizeMasked,
        make: sanitizeOrDash,
        model: sanitizeOrDash,
        year: sanitizeOrDash,
        fuelType: sanitizeOrDash,
        chassis: sanitizeOrDash,
      },
    );
    requireFields("sendInquiryToSeller", {
      bidId: sanitized.bidId,
      bidMessage: sanitized.bidMessage,
    });
    const metaResp = await sendTemplate({
      to,
      template: templateSellerInquiry,
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
            textParam("bid_message", sanitized.bidMessage),
          ],
        },
        flowButton(templateSellerInquiryFlowTitle),
      ],
    });

    trackSent(messageToBid, metaResp, sanitized.bidId, "seller_inquiry");

    return metaResp;
  };

  const sendNotifySeller = async ({ to, bidId }) => {
    if (!templateSellerNotification || !to) {
      return null;
    }
    validateInput(
      "sendNotifySeller",
      { bidId },
      { bidId: { required: true, types: ["string", "number"] } },
    );
    const sanitized = sanitizeFields({ bidId }, { bidId: sanitize });
    requireFields("sendNotifySeller", { bidId: sanitized.bidId });
    return sendTemplate({
      to,
      template: templateSellerNotification,
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
