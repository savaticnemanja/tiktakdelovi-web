export const applyMarkup = (rawPrice, percent) => {
  const normalized = String(rawPrice ?? "")
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  const pct = Number.isFinite(Number(percent)) ? Number(percent) : 0;
  const withMarkup = numeric * (1 + pct / 100);
  const rounded = Math.ceil(withMarkup / 10) * 10;
  return String(rounded);
};
