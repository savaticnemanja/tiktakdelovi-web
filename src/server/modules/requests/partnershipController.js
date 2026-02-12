const normalizePartnerPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("381")) return `+${digits}`;
  if (digits.startsWith("0")) return `+381${digits.slice(1)}`;
  return `+${digits}`;
};

export const createPartnershipController = ({ metaClient, ownerNumber }) => {
  return async (req, res) => {
    try {
      const {
        partnerName,
        partnerContact,
        partnerType,
        partnerCity,
      } = req.body || {};

      if (!partnerName || !partnerContact || !partnerType || !partnerCity) {
        return res.status(400).json({
          error: "partnerName, partnerContact, partnerType and partnerCity are required",
        });
      }

      await metaClient.sendPartnershipOwnerInquiry({
        to: ownerNumber,
        partnerName,
        partnerContact: normalizePartnerPhone(partnerContact),
        partnerType,
        partnerCity,
      });

      return res.json({ ok: true });
    } catch (err) {
      console.error(
        "Partnership inquiry error:",
        err?.response?.data || err.message || err,
      );
      const messageErr =
        err?.response?.data?.error?.message || err.message || "Unknown error";
      return res.status(500).json({ error: messageErr });
    }
  };
};
