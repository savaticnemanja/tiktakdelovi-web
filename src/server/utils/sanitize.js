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

const isDateLike = (value) => {
  const text = String(value || "").trim();
  return (
    /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\.?$/.test(text) ||
    /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\.?\s+\d{1,2}:\d{2}$/.test(text)
  );
};

const isLikelyPhone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (isDateLike(raw)) return false;

  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return false;

  return raw.startsWith("+") || raw.startsWith("0") || raw.startsWith("381");
};

export const maskPhoneNumbers = (value, replacement = "[UKLONJEN BROJ]") =>
  String(value ?? "").replace(/(\+?\d[\d\s().-]{5,}\d)/g, (match) =>
    isLikelyPhone(match) ? replacement : match
  );
