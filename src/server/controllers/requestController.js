export const createRequestController = ({
  sellerNumbers,
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

      if (!sellerNumbers.length) {
        return res
          .status(500)
          .json({ error: "No sellers configured (set SELLER_NUMBERS)." });
      }

      const savedBid = bidStore.saveBidRequest({
        bidMessage,
        customerNumber,
        name,
        make,
        model,
        year,
        fuelType,
        chassis,
      });

      const results = [];
      for (const seller of sellerNumbers) {
        try {
          const result = await metaClient.sendInquiryToSeller({
            to: seller,
            bidId: savedBid.bidId,
            bidMessage: savedBid.bidMessage,
            make: savedBid.make,
            model: savedBid.model,
            year: savedBid.year,
            fuelType: savedBid.fuelType,
            chassis: savedBid.chassis,
          });
          results.push({ seller, ok: true, result });
        } catch (err) {
          const metaMessage = err?.response?.data?.error?.message || err.message;
          const metaDetails = err?.response?.data?.error?.error_data?.details;
          const metaType = err?.response?.data?.error?.type;
          console.error(`Send to seller ${seller} failed:`, {
            message: metaMessage,
            type: metaType,
            details: metaDetails,
          });
          results.push({
            seller,
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
        "Request broadcast error:",
        err?.response?.data || err.message || err,
      );
      const messageErr =
        err?.response?.data?.error?.message || err.message || "Unknown error";
      return res.status(500).json({ error: messageErr });
    }
  };
};
