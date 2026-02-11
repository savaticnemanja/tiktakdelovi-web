import {
  flowButton,
  textParam,
  trackSent,
  requireFields,
  sanitizeFields,
  validateInput,
} from "./_helpers.js";

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
    validateInput(
      "sendInquiryToMechanic",
      { to, bidId, bidMessage },
      {
        to: { required: true, types: ["string", "number"] },
        bidId: { required: true, types: ["string", "number"] },
        bidMessage: { required: true, types: ["string"] },
      },
    );
    const sanitized = sanitizeFields(
      { bidId, bidMessage, make, model, year, fuelType, chassis },
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
    requireFields("sendInquiryToMechanic", {
      bidId: sanitized.bidId,
      bidMessage: sanitized.bidMessage,
    });
    const metaResp = await sendTemplate({
      to,
      template: templateMechanicInquiry,
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
        flowButton(templateMechanicInquiryFlowTitle),
      ],
    });

    trackSent(messageToBid, metaResp, sanitized.bidId, "mechanic_inquiry");

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
    validateInput(
      "sendMechanicNotification",
      { bidId, buyerContact },
      {
        bidId: { required: true, types: ["string", "number"] },
        buyerContact: { required: true, types: ["string", "number"] },
      },
    );
    const sanitized = sanitizeFields(
      { bidId, buyerName, buyerContact, bidDetails },
      {
        bidId: sanitize,
        buyerName: sanitizeOrDash,
        buyerContact: sanitizeOrDash,
        bidDetails: sanitizeOrDash,
      },
    );
    requireFields("sendMechanicNotification", {
      bidId: sanitized.bidId,
      buyerContact: sanitized.buyerContact,
    });
    return sendTemplate({
      to,
      template: templateMechanicNotification,
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
            textParam("bid_details", sanitized.bidDetails),
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
