import axios from "axios";
import { normalizePhone, withPlus } from "../utils/phone.js";
import { sanitizeTemplateText } from "../utils/sanitize.js";

export const createMetaClient = ({
  token,
  phoneNumberId,
  templateSellerInquiry,
  templateSellerInquiryFlowTitle,
  templateBuyerReview,
  templateBuyerReviewFlowTitle,
  templateBuyerOffer,
  templateBuyerOfferFlowTitle,
  templateOwnerNotification,
  templateLanguage,
  messageToBid,
  metaLogger,
}) => {
  const sanitize = (value) => sanitizeTemplateText(value);
  const sanitizeOrDash = (value) => sanitize(value) || "-";

  const sendTemplate = async ({ to, template, components, keepPlus = false }) => {
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
          code: templateLanguage,
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
    const sanitizedBidMessage = sanitize(bidMessage);
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

  const sendBuyerReview = async ({
    to,
    bidId,
    bidDetails,
  }) => {
    const sanitizedBidId = sanitize(bidId);
    const sanitizedBidDetails = sanitize(bidDetails);
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
    const sanitizedBidDetails = sanitize(bidDetails);
    const sanitizedBidOffer = sanitize(bidOffer);
    const sanitizedBidNote = sanitize(bidNote);
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
    return sendTemplate({
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
      ],
    });
  };

  return {
    sendInquiryToSeller,
    sendBuyerReview,
    sendOfferToBuyer,
    sendOfferToOwner,
  };
};
