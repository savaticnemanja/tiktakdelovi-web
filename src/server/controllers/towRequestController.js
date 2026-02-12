import { resolveRecipients } from "./helpers/recipients.js";

export const createTowRequestController = ({
  towDriverNumbers,
  towDriverNumbersByCity,
  bidStore,
  metaClient,
  templateTowInquiry,
  templateRoadsideInquiry,
  templateTowInquiryFlowTitle,
  templateRoadsideInquiryFlowTitle,
}) => {
  return async (req, res) => {
    try {
      const {
        customerNumber,
        serviceType,
        locationFrom,
        locationTo,
        details,
        city,
        notificationPreference,
      } = req.body || {};

      if (!customerNumber || !locationFrom || !details) {
        return res.status(400).json({
          error: "customerNumber, locationFrom and details are required",
        });
      }

      const recipients = resolveRecipients({
        city,
        numbersByCity: towDriverNumbersByCity,
        fallbackNumbers: towDriverNumbers,
      });

      if (!recipients.length) {
        return res
          .status(500)
          .json({
            error:
              "No tow drivers configured (set CITY_TOW_DRIVER_NUMBERS like BEOGRAD_TOW_DRIVER_NUMBERS).",
          });
      }

      const savedBid = bidStore.saveBidRequest({
        bidMessage: details,
        customerNumber,
        notificationPreference,
        requestType: "roadside",
        locationFrom,
        locationTo,
        serviceType,
      });

      const templateName = templateRoadsideInquiry;
      const flowTitle = templateRoadsideInquiryFlowTitle;
      if (!templateName) {
        return res.status(500).json({
          error: "Tow inquiry template not configured.",
        });
      }

      const combinedLocation =
        locationFrom && locationTo
          ? `${locationFrom} - ${locationTo}`
          : locationFrom;

      const results = [];
      for (const driver of recipients) {
        try {
          const result = await metaClient.sendTowInquiry({
            to: driver,
            bidId: savedBid.bidId,
            locationFrom: combinedLocation,
            locationTo: "",
            details,
            templateName,
            flowTitle,
          });
          results.push({ driver, ok: true, result });
        } catch (err) {
          const metaMessage = err?.response?.data?.error?.message || err.message;
          const metaDetails = err?.response?.data?.error?.error_data?.details;
          const metaType = err?.response?.data?.error?.type;
          console.error(`Send to tow driver ${driver} failed:`, {
            message: metaMessage,
            type: metaType,
            details: metaDetails,
          });
          results.push({
            driver,
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
        "Tow request broadcast error:",
        err?.response?.data || err.message || err,
      );
      const messageErr =
        err?.response?.data?.error?.message || err.message || "Unknown error";
      return res.status(500).json({ error: messageErr });
    }
  };
};
