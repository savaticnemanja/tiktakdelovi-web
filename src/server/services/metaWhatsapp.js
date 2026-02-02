import axios from "axios";
import { normalizePhone, withPlus } from "../utils/phone.js";
import { sanitizeTemplateText, maskPhoneNumbers } from "../utils/sanitize.js";

export const createMetaClient = ({
  token,
  phoneNumberId,
  templateSellerInquiry,
  templateSellerNotification,
  templateSellerInquiryFlowTitle,
  templateBuyerReview,
  templateBuyerReviewFlowTitle,
  templateBuyerOffer,
  templateBuyerOfferFlowTitle,
  templateOwnerNotification,
  templateCourierNotification,
  templateLanguage,
  messageToBid,
  metaLogger,
}) => {
  const sanitize = (value) => sanitizeTemplateText(value);
  const sanitizeMasked = (value) => sanitize(maskPhoneNumbers(value));
  const sanitizeMaskedOrDash = (value) => sanitizeMasked(value) || "-";
  const sanitizeOrDash = (value) => sanitize(value) || "-";

  const sendTemplate = async ({
    to,
    template,
    components,
    keepPlus = false,
    languageOverride,
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
          code: languageOverride || templateLanguage,
        },
        components,
      },
    };
    try {
      const metaResp = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return { data: metaResp.data };
    } catch (err) {
      await metaLogger?.logError?.({
        at: new Date().toISOString(),
        url,
        template,
        to,
        payload,
        error: err?.response?.data || err.message || String(err),
      });
      throw err;
    }
  };

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

  const sendImageMessage = async ({ to, mediaId, caption, mask = false }) => {
    if (!token || !phoneNumberId) {
      throw new Error("Meta Cloud API not configured.");
    }
    if (!to || !mediaId) {
      throw new Error("to and mediaId are required.");
    }
    const url = `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`;
    const safeCaption = mask ? sanitizeMasked(caption) : sanitize(caption);
    const payload = {
      messaging_product: "whatsapp",
      to: withPlus(to),
      type: "image",
      image: {
        id: mediaId,
        caption: safeCaption || undefined,
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
              parameter_name: "bid_id",
              text: sanitizedBidId,
            },
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
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "buyer_review" });
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
              parameter_name: "bid_id",
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
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "buyer_offer" });
    }
    return metaResp;
  };

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
    bidOffer,
    sellerNumber,
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
            {
              type: "text",
              parameter_name: "buyer_address",
              text: sanitizedBuyerAddress,
            },
            { type: "text", parameter_name: "buyer_city", text: sanitizedBuyerCity },
            {
              type: "text",
              parameter_name: "buyer_postal_code",
              text: sanitizedBuyerPostalCode,
            },
            {
              type: "text",
              parameter_name: "buyer_contact",
              text: sanitizedBuyerContact,
            },
            { type: "text", parameter_name: "bid_message", text: sanitizedBidMessage },
            {
              type: "text",
              parameter_name: "seller_contact",
              text: sanitizedSellerNumber,
            },
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
      languageOverride: "en",
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
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
            { type: "text", parameter_name: "seller_number", text: sanitizedSellerNumber },
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
  };

  return {
    sendInquiryToSeller,
    sendNotifySeller,
    sendBuyerReview,
    sendOfferToBuyer,
    sendOfferToOwner,
    sendOfferToCourier,
    sendImageMessage,
    getMediaUrl: async (mediaId) => {
      if (!token || !mediaId) {
        throw new Error("Meta Cloud API not configured or mediaId missing.");
      }
      const url = `https://graph.facebook.com/v24.0/${mediaId}`;
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return resp.data;
    },
    downloadMedia: async (mediaId) => {
      if (!token || !mediaId) {
        throw new Error("Meta Cloud API not configured or mediaId missing.");
      }
      const mediaInfo = await axios.get(
        `https://graph.facebook.com/v24.0/${mediaId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const mediaUrl = mediaInfo?.data?.url;
      const mimeType = mediaInfo?.data?.mime_type || "image/jpeg";
      if (!mediaUrl) {
        throw new Error("Media URL not found.");
      }
      const mediaResp = await axios.get(mediaUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "arraybuffer",
      });
      return { buffer: Buffer.from(mediaResp.data), mimeType };
    },
  };
};
