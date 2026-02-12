export const pickValue = (data, keys) =>
  keys
    .map((key) => data?.[key])
    .find((value) => value !== undefined && value !== null && String(value).trim() !== "");

export const formatBidDate = (dateISO) => {
  const cleanedDate = String(dateISO || "").trim();
  const match = cleanedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}.` : cleanedDate;
};

export const normalizeButtonPayload = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const getRoadsideLabels = (serviceType) => {
  if (serviceType === "slep_sluzba") {
    return {
      roadsideOrTow: "ZA ŠLEP SLUŽBU",
      roadsideOrTowData: "ŠLEP SLUŽBI",
    };
  }
  return {
    roadsideOrTow: "ZA POMOĆ NA PUTU",
    roadsideOrTowData: "POMOĆI NA PUTU",
  };
};

export const buildLocation = (bid) => {
  const from = String(bid?.locationFrom || "").trim();
  const to = String(bid?.locationTo || "").trim();
  if (from && to) {
    return `${from} - ${to}`;
  }
  return from || "-";
};

export const getMapEntry = (messageToBid, messageId) => {
  const entry = messageId ? messageToBid.get(messageId) : null;
  if (!entry) {
    return null;
  }
  if (typeof entry === "string") {
    return { bidId: entry, kind: "parts_provider_inquiry" };
  }
  return entry;
};

export const parseYesNoFlag = (raw) => {
  const normalized = String(raw || "").toLowerCase();
  if (
    normalized.startsWith("0_") ||
    normalized.endsWith("_da") ||
    normalized.includes("da") ||
    normalized === "yes"
  ) {
    return true;
  }
  if (
    normalized.startsWith("1_") ||
    normalized.endsWith("_ne") ||
    normalized.includes("ne") ||
    normalized === "no"
  ) {
    return false;
  }
  return null;
};

export const parseYesNoString = (raw) => {
  const parsed = parseYesNoFlag(raw);
  if (parsed === true) return "yes";
  if (parsed === false) return "no";
  return "";
};
