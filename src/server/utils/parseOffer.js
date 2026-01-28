import { sanitizeTemplateText } from "./sanitize.js";

export const parseOfferMessage = (text) => {
  const cleaned = sanitizeTemplateText(text);
  const match = cleaned.match(/^(\S+)\s+(.+)$/);
  if (!match) {
    return null;
  }
  return { bidId: match[1], bidOffer: match[2] };
};
