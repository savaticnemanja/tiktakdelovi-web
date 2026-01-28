import axios from "axios";
import { normalizePhone, withPlus } from "../utils/phone.js";
import { sanitizeTemplateText } from "../utils/sanitize.js";

export const createMetaClient = ({
  token,
  phoneNumberId,
  templateName,
  templateLanguage,
  templateOfferName,
  templateOwnerName,
  flowScreen,
  flowButtonIndex,
  messageToBid,
}) => {
  const sendTemplateMessage = async ({
    to,
    templateName: template,
    language,
    components,
    keepPlus = false,
  }) => {
    if (!token || !phoneNumberId) {
      throw new Error("Meta Cloud API not configured.");
    }
    if (!template) {
      throw new Error("Meta template name missing.");
    }
    const url = `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: keepPlus ? withPlus(to) : normalizePhone(to),
      type: "template",
      template: {
        name: template,
        language: {
          code: language,
        },
        components,
      },
    };
    const metaResp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return { data: metaResp.data };
  };

  const sendBidRequestToSeller = async ({
    to,
    bidId,
    bidMessage,
    make,
    model,
    year,
    fuelType,
    chassis,
  }) => {
    const sanitizedBidId = sanitizeTemplateText(bidId);
    const sanitizedBidMessage = sanitizeTemplateText(bidMessage);
    const sanitizedMake = sanitizeTemplateText(make);
    const sanitizedModel = sanitizeTemplateText(model);
    const sanitizedYear = sanitizeTemplateText(year);
    const sanitizedFuel = sanitizeTemplateText(fuelType);
    const sanitizedChassis = sanitizeTemplateText(chassis);
    if (!sanitizedBidId || !sanitizedBidMessage) {
      throw new Error("bidId and bidMessage are required.");
    }
    const metaResp = await sendTemplateMessage({
      to,
      templateName,
      language: templateLanguage,
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
              text: sanitizedMake || "-",
            },
            {
              type: "text",
              parameter_name: "model",
              text: sanitizedModel || "-",
            },
            {
              type: "text",
              parameter_name: "year",
              text: sanitizedYear || "-",
            },
            {
              type: "text",
              parameter_name: "fuel_type",
              text: sanitizedFuel || "-",
            },
            {
              type: "text",
              parameter_name: "chassis",
              text: sanitizedChassis || "-",
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
          index: flowButtonIndex,
          parameters: [
            {
              type: "payload",
              payload: JSON.stringify({ screen: flowScreen }),
            },
          ],
        },
      ],
    });

    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, sanitizedBidId);
    }

    return metaResp;
  };

  const sendOfferToBuyer = async ({ to, bidId, bidDetails, bidOffer }) => {
    const sanitizedBidId = sanitizeTemplateText(bidId);
    const sanitizedBidDetails = sanitizeTemplateText(bidDetails);
    const sanitizedBidOffer = sanitizeTemplateText(bidOffer);
    if (!sanitizedBidId || !sanitizedBidDetails || !sanitizedBidOffer) {
      throw new Error("bidId, bidDetails and bidOffer are required.");
    }
    return sendTemplateMessage({
      to,
      templateName: templateOfferName,
      language: templateLanguage,
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
              parameter_name: "bid_id_body",
              text: sanitizedBidId,
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
        {
          type: "button",
          sub_type: "flow",
          index: flowButtonIndex,
          parameters: [
            {
              type: "payload",
              payload: JSON.stringify({ screen: flowScreen }),
            },
          ],
        },
      ],
    });
  };

  const sendOfferToOwner = async ({
    to,
    bidId,
    bidDetails,
    bidOffer,
    sellerNumber,
  }) => {
    if (!templateOwnerName || !to) {
      return null;
    }
    const sanitizedBidId = sanitizeTemplateText(bidId);
    const sanitizedBidDetails = sanitizeTemplateText(bidDetails);
    const sanitizedBidOffer = sanitizeTemplateText(bidOffer);
    const sanitizedSellerNumber = sanitizeTemplateText(sellerNumber);
    if (
      !sanitizedBidId ||
      !sanitizedBidDetails ||
      !sanitizedBidOffer ||
      !sanitizedSellerNumber
    ) {
      throw new Error(
        "bidId, bidDetails, bidOffer and sellerNumber are required.",
      );
    }
    return sendTemplateMessage({
      to,
      templateName: templateOwnerName,
      language: templateLanguage,
      components: [
        {
          type: "header",
          parameters: [{ type: "text", text: sanitizedBidId }],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: sanitizedBidId },
            { type: "text", text: sanitizedBidDetails },
            { type: "text", text: sanitizedBidOffer },
            { type: "text", text: sanitizedSellerNumber },
          ],
        },
      ],
    });
  };

  return {
    sendTemplateMessage,
    sendBidRequestToSeller,
    sendOfferToBuyer,
    sendOfferToOwner,
  };
};
