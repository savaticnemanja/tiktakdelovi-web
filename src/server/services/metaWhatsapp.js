import axios from "axios";
import { normalizePhone, withPlus } from "../utils/phone.js";
import { sanitizeTemplateText, maskPhoneNumbers } from "../utils/sanitize.js";

export const createMetaClient = ({
  token,
  phoneNumberId,
  templateSellerInquiry,
  templateSellerNotification,
  templateSellerInquiryFlowTitle,
  templateMechanicInquiry,
  templateMechanicInquiryFlowTitle,
  templateBuyerReview,
  templateBuyerReviewFlowTitle,
  templateBuyerOffer,
  templateBuyerRoadsideOffer,
  templateBuyerMechanicOffer,
  templateBuyerOfferFlowTitle,
  templateBuyerRoadsideOfferFlowTitle,
  templateOwnerNotification,
  templateOwnerRoadsideNotification,
  templateCourierNotification,
  templateOwnerNotificationMechanic,
  templateMechanicNotification,
  templateRoadsideNotification,
  templateBuyerRoadsideNotification,
  templateBuyerMechanicNotification,
  templateTowInquiry,
  templateRoadsideInquiry,
  templateTowInquiryFlowTitle,
  templateRoadsideInquiryFlowTitle,
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
              payload: JSON.stringify({
                screen: templateMechanicInquiryFlowTitle,
              }),
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
              payload: JSON.stringify({ screen: templateBuyerRoadsideOfferFlowTitle }),
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

  const sendRoadsideOfferToBuyer = async ({
    to,
    bidId,
    bidDetails,
    bidOffer,
  }) => {
    const sanitizedBidId = sanitize(bidId);
    const sanitizedBidDetails = sanitizeMasked(bidDetails);
    const sanitizedBidOffer = sanitize(bidOffer);
    if (!sanitizedBidId || !sanitizedBidDetails || !sanitizedBidOffer) {
      throw new Error("bidId, bidDetails and bidOffer are required.");
    }
    const metaResp = await sendTemplate({
      to,
      template: templateBuyerRoadsideOffer,
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
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "buyer_roadside_offer" });
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
              parameter_name: "bid_date",
              text: sanitizedBidDate || "-",
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
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "buyer_mechanic_offer" });
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
            { type: "text", parameter_name: "bid_id", text: sanitizedBidId },
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
            { type: "text", parameter_name: "seller_contact", text: sanitizedSellerNumber },
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
          ],
        },
      ],
    });
  };

  const sendOfferToOwnerMechanic = async ({
    to,
    bidId,
    make,
    model,
    year,
    fuelType,
    chassis,
    buyerName,
    buyerContact,
    bidDetails,
    mechanicContact,
    bidOffer,
    bidDate,
    bidTime,
    bidNote,
  }) => {
    if (!templateOwnerNotificationMechanic || !to) {
      return null;
    }
    const sanitizedBidId = sanitize(bidId);
    const sanitizedMake = sanitizeOrDash(make);
    const sanitizedModel = sanitizeOrDash(model);
    const sanitizedYear = sanitizeOrDash(year);
    const sanitizedFuel = sanitizeOrDash(fuelType);
    const sanitizedChassis = sanitizeOrDash(chassis);
    const sanitizedBuyerName = sanitizeOrDash(buyerName);
    const sanitizedBuyerContact = sanitizeOrDash(buyerContact);
    const sanitizedBidDetails = sanitizeOrDash(bidDetails);
    const sanitizedMechanicContact = sanitizeOrDash(mechanicContact);
    const sanitizedBidOffer = sanitize(bidOffer);
    const sanitizedBidDate = sanitizeOrDash(bidDate);
    const sanitizedBidTime = sanitizeOrDash(bidTime);
    const sanitizedBidNote = sanitizeOrDash(bidNote);
    if (!sanitizedBidId || !sanitizedBidOffer || !sanitizedMechanicContact) {
      throw new Error("bidId, bidOffer and mechanicContact are required.");
    }
    const metaResp = await sendTemplate({
      to,
      template: templateOwnerNotificationMechanic,
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
            { type: "text", parameter_name: "buyer_contact", text: sanitizedBuyerContact },
            { type: "text", parameter_name: "bid_details", text: sanitizedBidDetails },
            {
              type: "text",
              parameter_name: "mechanic_contact",
              text: sanitizedMechanicContact,
            },
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
            { type: "text", parameter_name: "bid_date", text: sanitizedBidDate },
            { type: "text", parameter_name: "bid_time", text: sanitizedBidTime },
            { type: "text", parameter_name: "bid_note", text: sanitizedBidNote },
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
                action: "notify_buyer",
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
                action: "notify_mechanic",
                bid_id: sanitizedBidId,
              }),
            },
          ],
        },
      ],
    });
    const sentId = metaResp?.data?.messages?.[0]?.id;
    if (sentId && messageToBid) {
      messageToBid.set(sentId, { bidId: sanitizedBidId, kind: "owner_notification_mechanic" });
    }
    return metaResp;
  };

  const sendOwnerRoadsideNotification = async ({
    to,
    roadsideOrTow,
    location,
    issueDescription,
    buyerName,
    buyerContact,
    buyerNote,
    roadsideContact,
    bidOffer,
  }) => {
    if (!templateOwnerRoadsideNotification || !to) {
      return null;
    }
    const sanitizedRoadsideOrTow = sanitizeOrDash(roadsideOrTow);
    const sanitizedLocation = sanitizeOrDash(location);
    const sanitizedIssueDescription = sanitizeOrDash(issueDescription);
    const sanitizedBuyerName = sanitizeOrDash(buyerName);
    const sanitizedBuyerContact = sanitizeOrDash(buyerContact);
    const sanitizedBuyerNote = sanitizeOrDash(buyerNote);
    const sanitizedRoadsideContact = sanitizeOrDash(roadsideContact);
    const sanitizedBidOffer = sanitizeOrDash(bidOffer);
    if (!sanitizedRoadsideOrTow || !sanitizedBuyerContact || !sanitizedRoadsideContact) {
      throw new Error("roadsideOrTow, buyerContact and roadsideContact are required.");
    }
    return sendTemplate({
      to,
      template: templateOwnerRoadsideNotification,
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "text",
              parameter_name: "roadsideOrTow",
              text: sanitizedRoadsideOrTow,
            },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "location", text: sanitizedLocation },
            {
              type: "text",
              parameter_name: "issue_description",
              text: sanitizedIssueDescription,
            },
            { type: "text", parameter_name: "buyer_name", text: sanitizedBuyerName },
            { type: "text", parameter_name: "buyer_contact", text: sanitizedBuyerContact },
            { type: "text", parameter_name: "buyer_note", text: sanitizedBuyerNote },
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

  const sendRoadsideNotification = async ({
    to,
    bidId,
    roadsideOrTow,
    buyerName,
    buyerContact,
    location,
  }) => {
    if (!templateRoadsideNotification || !to) {
      return null;
    }
    const sanitizedBidId = sanitize(bidId);
    const sanitizedRoadsideOrTow = sanitizeOrDash(roadsideOrTow);
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
          type: "body",
          parameters: [
            { type: "text", parameter_name: "roadsideOrTow", text: sanitizedRoadsideOrTow },
            { type: "text", parameter_name: "bid_id", text: sanitizedBidId },
            { type: "text", parameter_name: "buyer_name", text: sanitizedBuyerName },
            { type: "text", parameter_name: "buyer_contact", text: sanitizedBuyerContact },
            { type: "text", parameter_name: "location", text: sanitizedLocation },
          ],
        },
      ],
    });
  };

  const sendBuyerRoadsideNotification = async ({
    to,
    bidId,
    roadsideOrTow,
    roadsideOrTowData,
    roadsideContact,
    bidOffer,
    bidNote,
  }) => {
    if (!templateBuyerRoadsideNotification || !to) {
      return null;
    }
    const sanitizedBidId = sanitize(bidId);
    const sanitizedRoadsideOrTow = sanitizeOrDash(roadsideOrTow);
    const sanitizedRoadsideOrTowData = sanitizeOrDash(roadsideOrTowData);
    const sanitizedRoadsideContact = sanitizeOrDash(roadsideContact);
    const sanitizedBidOffer = sanitizeOrDash(bidOffer);
    const sanitizedBidNote = sanitizeOrDash(bidNote);
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
            { type: "text", parameter_name: "roadside_or_tow", text: sanitizedRoadsideOrTow },
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
            { type: "text", parameter_name: "bid_note", text: sanitizedBidNote },
          ],
        },
      ],
    });
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
    const sanitizedBidOffer = sanitize(bidOffer);
    const sanitizedBidDate = sanitizeOrDash(bidDate);
    const sanitizedBidTime = sanitizeOrDash(bidTime);
    const sanitizedBidNote = sanitizeOrDash(bidNote);
    if (!sanitizedBidId || !sanitizedBidOffer || !sanitizedMechanicContact) {
      throw new Error("bidId, bidOffer and mechanicContact are required.");
    }
    return sendTemplate({
      to,
      template: templateBuyerMechanicNotification,
      keepPlus: true,
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
            {
              type: "text",
              parameter_name: "mechanic_contact",
              text: sanitizedMechanicContact,
            },
            { type: "text", parameter_name: "bid_offer", text: sanitizedBidOffer },
            { type: "text", parameter_name: "bid_date", text: sanitizedBidDate },
            { type: "text", parameter_name: "bid_time", text: sanitizedBidTime },
            { type: "text", parameter_name: "bid_note", text: sanitizedBidNote },
          ],
        },
      ],
    });
  };

  return {
    sendInquiryToSeller,
    sendInquiryToMechanic,
    sendNotifySeller,
    sendBuyerReview,
    sendOfferToBuyer,
    sendRoadsideOfferToBuyer,
    sendOfferToBuyerMechanic,
    sendOfferToOwner,
    sendOfferToOwnerMechanic,
    sendOwnerRoadsideNotification,
    sendMechanicNotification,
    sendBuyerMechanicNotification,
    sendOfferToCourier,
    sendRoadsideNotification,
    sendBuyerRoadsideNotification,
    sendTowInquiry,
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
