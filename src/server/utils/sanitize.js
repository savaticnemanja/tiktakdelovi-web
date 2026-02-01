export const sanitizeTemplateText = (value) =>
  String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

export const maskPhoneNumbers = (value, replacement = "[UKLONJEN BROJ]") =>
  String(value ?? "").replace(/(\+?\d[\d\s().-]{5,}\d)/g, replacement);
