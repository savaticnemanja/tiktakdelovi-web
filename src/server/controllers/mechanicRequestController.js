export const createMechanicRequestController = ({
  mechanicNumbers,
  bidStore,
  metaClient,
  templateName,
}) => {
  return async (req, res) => {
    try {
      const {
        name,
        customerNumber,
        bidMessage,
        notificationPreference,
        make,
        model,
        year,
        fuelType,
        chassis,
      } = req.body || {};

      if (!customerNumber || !bidMessage) {
        return res.status(400).json({
          error: "customerNumber and bidMessage are required",
        });
      }

      if (!mechanicNumbers.length) {
        return res
          .status(500)
          .json({ error: "No mechanics configured (set MECHANIC_NUMBERS)." });
      }

      if (!templateName) {
        return res.status(500).json({
          error: "Mechanic inquiry template not configured.",
        });
      }

      const savedBid = bidStore.saveBidRequest({
        bidMessage,
        customerNumber,
        name,
        notificationPreference,
        make,
        model,
        year,
        fuelType,
        chassis,
      });

      const results = [];
      for (const mechanic of mechanicNumbers) {
        try {
          const result = await metaClient.sendInquiryToMechanic({
            to: mechanic,
            bidId: savedBid.bidId,
            bidMessage: savedBid.bidMessage,
            make: savedBid.make,
            model: savedBid.model,
            year: savedBid.year,
            fuelType: savedBid.fuelType,
            chassis: savedBid.chassis,
          });
          results.push({ mechanic, ok: true, result });
        } catch (err) {
          const metaMessage = err?.response?.data?.error?.message || err.message;
          const metaDetails = err?.response?.data?.error?.error_data?.details;
          const metaType = err?.response?.data?.error?.type;
          console.error(`Send to mechanic ${mechanic} failed:`, {
            message: metaMessage,
            type: metaType,
            details: metaDetails,
          });
          results.push({
            mechanic,
            ok: false,
            error: metaMessage,
            type: metaType,
            details: metaDetails,
          });
        }
      }

      return res.json({
        ok: true,
        sent: results,
        template: templateName,
        bidId: savedBid.bidId,
      });
    } catch (err) {
      console.error(
        "Mechanic request broadcast error:",
        err?.response?.data || err.message || err,
      );
      const messageErr =
        err?.response?.data?.error?.message || err.message || "Unknown error";
      return res.status(500).json({ error: messageErr });
    }
  };
};

