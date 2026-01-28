import { parseOfferMessage } from "../utils/parseOffer.js";
import { normalizePhone } from "../utils/phone.js";

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
      const pickValue = (data, keys) =>
        keys
          .map((key) => data?.[key])
          .find((value) => value !== undefined && value !== null && String(value).trim() !== "");

      const getMapEntry = (messageId) => {
        const entry = messageId ? messageToBid.get(messageId) : null;
        if (!entry) {
          return null;
        }
        if (typeof entry === "string") {
          return { bidId: entry, kind: "seller_inquiry" };
        }
        return entry;
      };

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
              const repliedToId = message?.context?.id;
              const mapEntry = getMapEntry(repliedToId);
              const bid = mapEntry?.bidId
                ? bidStore.getBidRequest(mapEntry.bidId)
                : null;

              const responseJsonRaw = message?.interactive?.nfm_reply?.response_json;
              let responseData = null;
              try {
                responseData = responseJsonRaw ? JSON.parse(responseJsonRaw) : null;
              } catch (err) {
                responseData = null;
              }
              const price = responseData?.screen_0_Cena_0 || responseData?.price;
              const note =
                responseData?.screen_0_Napomena_1 ||
                responseData?.note ||
                "";

              if (mapEntry?.kind === "buyer_offer" && bid) {
                const buyerName = pickValue(responseData, [
                  "buyer_name",
                  "name",
                  "screen_0_Ime_0",
                  "screen_0_Ime_1",
                ]);
                const buyerAddress = pickValue(responseData, [
                  "buyer_address",
                  "address",
                  "screen_0_Adresa_0",
                  "screen_0_Adresa_1",
                ]);
                const buyerCity = pickValue(responseData, [
                  "buyer_city",
                  "city",
                  "screen_0_Grad_0",
                  "screen_0_Grad_1",
                ]);
                const buyerPostalCode = pickValue(responseData, [
                  "buyer_postal_code",
                  "postal_code",
                  "zip",
                  "screen_0_Postanski_broj_0",
                  "screen_0_Postanski_broj_1",
                ]);
                const buyerContact = pickValue(responseData, [
                  "buyer_contact",
                  "contact",
                  "phone",
                  "screen_0_Kontakt_0",
                  "screen_0_Kontakt_1",
                ]);

                const updated = bidStore.updateBid(bid.bidId, {
                  buyerName,
                  buyerAddress,
                  buyerCity,
                  buyerPostalCode,
                  buyerContact,
                });
                if (updated?.sellerContact && updated?.bidOffer) {
                  try {
                    await metaClient.sendOfferToOwner({
                      to: ownerNumber,
                      bidId: updated.bidId,
                      make: updated.make,
                      model: updated.model,
                      year: updated.year,
                      fuelType: updated.fuelType,
                      chassis: updated.chassis,
                      buyerName: updated.buyerName,
                      buyerAddress: updated.buyerAddress,
                      buyerCity: updated.buyerCity,
                      buyerPostalCode: updated.buyerPostalCode,
                      buyerContact: updated.buyerContact,
                      bidMessage: updated.bidMessage,
                      sellerNumber: updated.sellerContact,
                      bidOffer: updated.bidOffer,
                    });
                  } catch (err) {
                    console.error(
                      "Owner notification failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }

              if (mapEntry?.kind === "seller_inquiry") {
                const sellerContact = normalizePhone(from);
                const updated = bidStore.updateBid(mapEntry.bidId, {
                  sellerContact,
                  bidOffer: price ? String(price) : "",
                  bidNote: note ? String(note) : "",
                });
                if (updated && updated.customerNumber && price) {
                  try {
                    await metaClient.sendOfferToBuyer({
                      to: updated.customerNumber,
                      bidId: updated.bidId,
                      bidDetails: updated.bidMessage,
                      bidOffer: String(price),
                      bidNote: String(note || "-"),
                    });
                  } catch (err) {
                    console.error(
                      "Flow response forward failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
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
              continue;
            }

            const updatedBid = bidStore.updateBid(parsed.bidId, {
              sellerContact: normalizePhone(from),
              bidOffer: parsed.bidOffer,
            });

            try {
              await metaClient.sendOfferToBuyer({
                to: updatedBid?.customerNumber || bid.customerNumber,
                bidId: updatedBid?.bidId || bid.bidId,
                bidDetails: updatedBid?.bidMessage || bid.bidMessage,
                bidOffer: parsed.bidOffer,
              });
            } catch (err) {
              console.error(
                "Buyer offer failed:",
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
