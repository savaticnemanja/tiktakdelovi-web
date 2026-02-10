import axios from "axios";
import { normalizePhone, withPlus } from "../../utils/phone.js";
import { sanitizeTemplateText, maskPhoneNumbers } from "../../utils/sanitize.js";
import { createBuyerTemplates } from "./templates/buyer.js";
import { createMechanicTemplates } from "./templates/mechanic.js";
import { createOwnerTemplates } from "./templates/owner.js";
import { createSellerTemplates } from "./templates/seller.js";
import { createTowTemplates } from "./templates/tow.js";
import { createMediaHandlers } from "./templates/media.js";

export const createMetaClient = (config) => {
  const {
    token,
    phoneNumberId,
    templateLanguage,
    metaLogger,
  } = config;

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

  const shared = {
    sendTemplate,
    sanitize,
    sanitizeMasked,
    sanitizeMaskedOrDash,
    sanitizeOrDash,
  };

  const sellerTemplates = createSellerTemplates({
    ...shared,
    templateSellerInquiry: config.templateSellerInquiry,
    templateSellerInquiryFlowTitle: config.templateSellerInquiryFlowTitle,
    templateSellerNotification: config.templateSellerNotification,
    messageToBid: config.messageToBid,
  });

  const mechanicTemplates = createMechanicTemplates({
    ...shared,
    templateMechanicInquiry: config.templateMechanicInquiry,
    templateMechanicInquiryFlowTitle: config.templateMechanicInquiryFlowTitle,
    templateMechanicNotification: config.templateMechanicNotification,
    messageToBid: config.messageToBid,
  });

  const buyerTemplates = createBuyerTemplates({
    ...shared,
    templateBuyerReview: config.templateBuyerReview,
    templateBuyerReviewFlowTitle: config.templateBuyerReviewFlowTitle,
    templateBuyerOffer: config.templateBuyerOffer,
    templateBuyerOfferFlowTitle: config.templateBuyerOfferFlowTitle,
    templateBuyerRoadsideOffer: config.templateBuyerRoadsideOffer,
    templateBuyerRoadsideOfferFlowTitle: config.templateBuyerRoadsideOfferFlowTitle,
    templateBuyerMechanicOffer: config.templateBuyerMechanicOffer,
    templateBuyerRoadsideNotification: config.templateBuyerRoadsideNotification,
    templateBuyerMechanicNotification: config.templateBuyerMechanicNotification,
    messageToBid: config.messageToBid,
  });

  const ownerTemplates = createOwnerTemplates({
    ...shared,
    templateOwnerNotification: config.templateOwnerNotification,
    templateCourierNotification: config.templateCourierNotification,
    templateOwnerNotificationMechanic: config.templateOwnerNotificationMechanic,
    templateOwnerRoadsideNotification: config.templateOwnerRoadsideNotification,
    messageToBid: config.messageToBid,
  });

  const towTemplates = createTowTemplates({
    ...shared,
    templateRoadsideNotification: config.templateRoadsideNotification,
    messageToBid: config.messageToBid,
  });

  const mediaHandlers = createMediaHandlers({
    token,
    phoneNumberId,
    sanitize,
    sanitizeMasked,
    withPlus,
  });

  return {
    ...sellerTemplates,
    ...mechanicTemplates,
    ...buyerTemplates,
    ...ownerTemplates,
    ...towTemplates,
    ...mediaHandlers,
  };
};
