export const sanitizeTemplateText = (value) =>
  String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

export const sanitizeTelegramText = (value) =>
  String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const maskPhoneNumbers = (value, replacement = "[UKLONJEN BROJ]") =>
  String(value ?? "").replace(/(\+?\d[\d\s().-]{5,}\d)/g, replacement);
