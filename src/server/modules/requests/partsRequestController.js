import { resolveRecipientsByMake } from "./helpers/recipients.js";

export const createPartsRequestController = ({
  sellerNumbers,
  sellerNumbersByCityByMake,
  bidStore,
  metaClient,
  templateName,
  inquiryThrottle,
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

      if (!customerNumber || !bidMessage || !make) {
        return res.status(400).json({
          error: "customerNumber, bidMessage and make are required",
        });
      }

      const throttle = inquiryThrottle?.checkAndHit?.({
        scope: "parts",
        customerNumber,
        ip: req.ip,
      });
      if (throttle?.blocked) {
        const retryAfterSeconds = throttle.retryAfterSeconds;
        res.set("Retry-After", String(retryAfterSeconds));
        return res.status(429).json({
          error: `Please wait ${retryAfterSeconds} seconds before sending another inquiry.`,
          code: "BUYER_INQUIRY_THROTTLED",
          retryAfterSeconds,
          blockedBy: throttle.blockedBy,
        });
      }

      const recipients = resolveRecipientsByMake({
        make,
        numbersByCityByMake: sellerNumbersByCityByMake,
        fallbackNumbers: sellerNumbers,
      });

      if (!recipients.length) {
        return res
          .status(500)
          .json({
            error:
              "No sellers configured (set sellers or sellersByMake in phoneNumbers.json).",
          });
      }

      const savedBid = bidStore.saveBidRequest({
        bidMessage,
        customerNumber,
        name,
        notificationPreference,
        requestType: "parts",
        make,
        model,
        year,
        fuelType,
        chassis,
      });

      const results = [];
      for (const seller of recipients) {
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
