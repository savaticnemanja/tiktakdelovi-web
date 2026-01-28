import { parseOfferMessage } from "../utils/parseOffer.js";

export const createWebhookController = ({
  bidStore,
  messageToBid,
  metaClient,
  ownerNumber,
  verifyToken,
}) => {
  const verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token && token === verifyToken) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  };

  const handleWebhook = async (req, res) => {
    try {
      const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
          const messages = Array.isArray(change?.value?.messages)
            ? change.value.messages
            : [];
          for (const message of messages) {
            const textBody = message?.text?.body;
            const from = message?.from;
            const interactiveType = message?.interactive?.type;

            if (interactiveType === "nfm_reply") {
              const nfm = message.interactive?.nfm_reply || {};
              const responseJsonRaw = nfm.response_json;
              let responseData = null;
              try {
                responseData = responseJsonRaw ? JSON.parse(responseJsonRaw) : null;
              } catch (err) {
                // keep raw string if JSON.parse fails
              }
              const repliedToId = message?.context?.id;
              const bidIdFromMap = repliedToId
                ? messageToBid.get(repliedToId)
                : null;
              const bid = bidIdFromMap ? bidStore.getBidRequest(bidIdFromMap) : null;

              const price =
                responseData?.screen_0_Cena_0 || responseData?.price || null;
              const note =
                responseData?.screen_0_Napomena_1 || responseData?.note || "";
              const needsMoreInfoRaw =
                responseData?.screen_0_Potrebne_dodatne_informacije_2 || "";
              const needsMoreInfo =
                String(needsMoreInfoRaw || "").toLowerCase().includes("da") ||
                needsMoreInfoRaw === "1" ||
                needsMoreInfoRaw === "yes";

              if (bid && bid.customerNumber && price) {
                const offerText = needsMoreInfo
                  ? `${price} (seller requests more info)`
                  : price;
                try {
                  await metaClient.sendOfferToBuyer({
                    to: bid.customerNumber,
                    bidId: bid.bidId,
                    bidDetails: note || bid.bidMessage,
                    bidOffer: offerText,
                  });
                } catch (err) {
                  console.error(
                    "Flow response forward failed:",
                    err?.response?.data || err.message || String(err),
                  );
                }
              }
              continue;
            }

            if (!textBody || !from) {
              continue;
            }

            const parsed = parseOfferMessage(textBody);
            if (!parsed) {
              continue;
            }

            const bid = bidStore.getBidRequest(parsed.bidId);
            if (!bid) {
              console.warn("Webhook offer ignored; bid not found:", parsed.bidId);
              continue;
            }

            try {
              await metaClient.sendOfferToBuyer({
                to: bid.customerNumber,
                bidId: bid.bidId,
                bidDetails: bid.bidMessage,
                bidOffer: parsed.bidOffer,
              });
            } catch (err) {
              console.error(
                "Buyer offer failed:",
                err?.response?.data || err.message || String(err),
              );
            }

            try {
              await metaClient.sendOfferToOwner({
                to: ownerNumber,
                bidId: bid.bidId,
                bidDetails: bid.bidMessage,
                bidOffer: parsed.bidOffer,
                sellerNumber: from,
              });
            } catch (err) {
              console.error(
                "Owner offer failed:",
                err?.response?.data || err.message || String(err),
              );
            }
          }
        }
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error(
        "Webhook processing error:",
        err?.response?.data || err.message || err,
      );
      return res.sendStatus(200);
    }
  };

  return {
    verifyWebhook,
    handleWebhook,
  };
};
