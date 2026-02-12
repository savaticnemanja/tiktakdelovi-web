export const getBuyerContact = (bid) => bid?.buyerContact || bid?.customerNumber || "";

export const getBuyerName = (bid) => bid?.buyerName || bid?.name || "-";
