const parseCurrency = (raw) => {
  const lower = String(raw ?? "").toLowerCase();
  if (/rsd|dinara|din\b/.test(lower)) return "RSD";
  if (lower.includes("€") || /eur/.test(lower) || /e\s*$/.test(lower)) return "EUR";
  return null;
};

const parseNumber = (raw) => {
  const normalized = String(raw ?? "")
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

export const applyMarkup = (rawPrice, percent) => {
  const numeric = parseNumber(rawPrice);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  const currency = parseCurrency(rawPrice);
  const pct = Number.isFinite(Number(percent)) ? Number(percent) : 0;
  const withMarkup = numeric * (1 + pct / 100);
  const rounded =
    currency === "RSD"
      ? Math.ceil(withMarkup / 1000) * 1000
      : Math.ceil(withMarkup / 10) * 10;

  if (currency === "RSD") return `${rounded} RSD`;
  if (currency === "EUR") return `${rounded} EUR`;
  return String(rounded);
};
