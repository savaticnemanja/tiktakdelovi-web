export const normalizePhone = (value) => String(value || "").replace(/^\+/, "").trim();

export const withPlus = (value) => {
  const cleaned = normalizePhone(value);
  return cleaned ? `+${cleaned}` : "";
};
