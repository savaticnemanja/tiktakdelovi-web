import { parseOfferMessage } from "../utils/parseOffer.js";
import { normalizePhone } from "../utils/phone.js";
import { applyMarkup } from "../utils/price.js";
import {
  formatBuyerOfferMessage,
  formatBuyerRoadsideOfferMessage,
  formatBuyerReviewMessage,
  formatBuyerImageCaption,
} from "../services/telegramMessages.js";

export const createWebhookController = ({
  bidStore,
  messageToBid,
  metaClient,
  telegramClient,
  ownerNumber,
  courierNumber,
  sellerNumbers,
  sellerMarkupPercent,
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
      const appendSeparator = " / ";

      const pickValue = (data, keys) =>
        keys
          .map((key) => data?.[key])
          .find((value) => value !== undefined && value !== null && String(value).trim() !== "");

      const formatBidDate = (dateISO) => {
        const cleanedDate = String(dateISO || "").trim();
        const match = cleanedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[3]}.${match[2]}.${match[1]}.` : cleanedDate;
      };

      const normalizeButtonPayload = (value) =>
        String(value || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

      const getRoadsideLabels = (serviceType) => {
        if (serviceType === "slep_sluzba") {
          return {
            roadsideOrTow: "ŠLEP SLUŽBA",
            roadsideOrTowData: "ŠLEP SLUŽBI",
          };
        }
        return {
          roadsideOrTow: "POMOĆ NA PUTU",
          roadsideOrTowData: "POMOĆI NA PUTU",
        };
      };

      const buildLocation = (bid) => {
        const from = String(bid?.locationFrom || "").trim();
        const to = String(bid?.locationTo || "").trim();
        if (from && to) {
          return `${from} - ${to}`;
        }
        return from || "-";
      };

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
            const messageType = message?.type;

            if (messageType === "image" && message?.image?.id && from) {
              const normalizedSender = normalizePhone(from);
              const allowedSellers = Array.isArray(sellerNumbers)
                ? sellerNumbers.map((number) => normalizePhone(number))
                : [];
              if (!allowedSellers.includes(normalizedSender)) {
                continue;
              }
              const caption = message?.image?.caption || "";
              const bidIdMatch = caption.match(/(\d+)/);
              const bidId = bidIdMatch ? bidIdMatch[1] : null;
              if (!bidId) {
                continue;
              }
              const bid = bidStore.getBidRequest(bidId);
              if (!bid) {
                continue;
              }
              const buyerCaption = formatBuyerImageCaption({
                bidId,
                bidOffer: bid.bidOffer,
              });
              const sellerContact = normalizePhone(from);
              const ownerCaption = `${buyerCaption} / prodavac: ${sellerContact}`;
              try {
                if (
                  bid.notificationPreference === "telegram" &&
                  telegramClient &&
                  bid.telegramChatId
                ) {
                  const media = await metaClient.downloadMedia(message.image.id);
                  await telegramClient.sendPhoto({
                    chatId: bid.telegramChatId,
                    buffer: media.buffer,
                    mimeType: media.mimeType,
                    caption: buyerCaption,
                    mask: true,
                  });
                } else {
                  await metaClient.sendImageMessage({
                    to: bid.customerNumber,
                    mediaId: message.image.id,
                    caption: buyerCaption,
                    mask: true,
                  });
                }
              } catch (err) {
                console.error(
                  "Buyer image forward failed:",
                  err?.response?.data || err.message || String(err),
                );
              }
              // Owner forwarding disabled by request.
              continue;
            }

            if (messageType === "button" && message?.button && from) {
              const sender = normalizePhone(from);
              const ownerSender = normalizePhone(ownerNumber);
              if (!ownerSender || sender !== ownerSender) {
                continue;
              }

              const repliedToId = message?.context?.id;
              const mapEntry = getMapEntry(repliedToId);
              const buttonPayload = message.button.payload || message.button.text || "";
              let actionFromPayload = "";
              let bidIdFromPayload = "";
              try {
                const parsedPayload = JSON.parse(buttonPayload);
                actionFromPayload = String(parsedPayload?.action || "");
                bidIdFromPayload = String(parsedPayload?.bid_id || parsedPayload?.bidId || "");
              } catch (err) {
                actionFromPayload = "";
                bidIdFromPayload = "";
              }
              const normalizedPayload = normalizeButtonPayload(buttonPayload);
              const inferredKind =
                actionFromPayload === "notify_buyer" ||
                actionFromPayload === "notify_mechanic" ||
                normalizedPayload.includes("kupca") ||
                normalizedPayload.includes("mehanicar")
                  ? "owner_notification_mechanic"
                  : "owner_notification";
              const mapEntryWithFallback =
                mapEntry || (bidIdFromPayload ? { bidId: bidIdFromPayload, kind: inferredKind } : null);
              if (!mapEntryWithFallback) {
                continue;
              }
              const bid = mapEntryWithFallback?.bidId
                ? bidStore.getBidRequest(mapEntryWithFallback.bidId)
                : null;
              if (!bid) {
                continue;
              }

              const wantsCourier =
                actionFromPayload === "notify_courier" || normalizedPayload.includes("dostavlja");
              const wantsSeller =
                actionFromPayload === "notify_seller" || normalizedPayload.includes("prodav");
              const wantsBuyer =
                actionFromPayload === "notify_buyer" || normalizedPayload.includes("kupca");
              const wantsMechanic =
                actionFromPayload === "notify_mechanic" || normalizedPayload.includes("mehanicar");

              if (
                wantsCourier &&
                mapEntryWithFallback.kind === "owner_notification"
              ) {
                if (courierNumber && bid.sellerContact && bid.bidOffer) {
                  try {
                    await metaClient.sendOfferToCourier({
                      to: courierNumber,
                      bidId: bid.bidId,
                      make: bid.make,
                      model: bid.model,
                      year: bid.year,
                      fuelType: bid.fuelType,
                      chassis: bid.chassis,
                      buyerName: bid.buyerName,
                      buyerAddress: bid.buyerAddress,
                      buyerCity: bid.buyerCity,
                      buyerPostalCode: bid.buyerPostalCode,
                      buyerContact: bid.buyerContact,
                      bidMessage: bid.bidMessage,
                      sellerNumber: bid.sellerContact,
                      bidOffer: bid.bidOffer,
                    });
                  } catch (err) {
                    console.error(
                      "Courier notification failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }

              if (
                wantsSeller &&
                mapEntryWithFallback.kind === "owner_notification"
              ) {
                if (bid.sellerContact) {
                  try {
                    await metaClient.sendNotifySeller({
                      to: bid.sellerContact,
                      bidId: bid.bidId,
                    });
                  } catch (err) {
                    console.error(
                      "Seller notify failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }

              if (
                wantsBuyer &&
                mapEntryWithFallback.kind === "owner_notification_mechanic"
              ) {
                if (bid.customerNumber && bid.sellerContact && bid.bidOffer) {
                  try {
                    await metaClient.sendBuyerMechanicNotification({
                      to: bid.customerNumber,
                      bidId: bid.bidId,
                      make: bid.make,
                      model: bid.model,
                      year: bid.year,
                      fuelType: bid.fuelType,
                      mechanicContact: bid.sellerContact,
                      bidOffer: bid.bidOffer,
                      bidDate: bid.bidDate || "-",
                      bidTime: bid.bidTime || "-",
                      bidNote: bid.bidNote || "-",
                    });
                  } catch (err) {
                    console.error(
                      "Buyer mechanic notification failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }

              if (
                wantsMechanic &&
                mapEntryWithFallback.kind === "owner_notification_mechanic"
              ) {
                if (bid.sellerContact && bid.buyerContact) {
                  try {
                    await metaClient.sendMechanicNotification({
                      to: bid.sellerContact,
                      bidId: bid.bidId,
                      buyerName: bid.buyerName || "-",
                      buyerContact: bid.buyerContact,
                      bidDetails: bid.bidMessage || "-",
                    });
                  } catch (err) {
                    console.error(
                      "Mechanic notification failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }
            }

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
              const price = pickValue(responseData, [
                "screen_0_Cena_0",
                "screen_0_Cena_2",
                "screen_0_Cena_1",
                "price",
                "cena",
              ]);
              const markedPrice = price
                ? applyMarkup(price, sellerMarkupPercent)
                : null;
              const priceForBuyer = markedPrice || (price ? String(price) : "");
              const note =
                pickValue(responseData, [
                  "screen_0_Napomena_1",
                  "screen_0_Napomena_3",
                  "screen_0_Napomena_2",
                  "note",
                ]) || "";
              const dateISO = pickValue(responseData, [
                "screen_0_Datum_0",
                "date",
                "datum",
              ]);
              const time = pickValue(responseData, [
                "screen_0_Vreme_1",
                "time",
                "vreme",
              ]);

              if (mapEntry?.kind === "buyer_review" && bid) {
                const buyerAdditionalInfoPicked = pickValue(responseData, [
                  "buyer_additional_info",
                  "additional_info",
                  "screen_0_Dodatne_informacije_0",
                  "screen_0_Dodatne_informacije_1",
                  "screen_0_Dodatne_informacije_2",
                  "screen_0_Dodatna_napomena_0",
                  "screen_0_Dodatna_napomena_1",
                ]);
                const buyerAdditionalInfo =
                  buyerAdditionalInfoPicked ||
                  Object.entries(responseData || {})
                    .filter(
                      ([key, value]) =>
                        key !== "flow_token" &&
                        typeof value === "string" &&
                        value.trim() !== "",
                    )
                    .map(([, value]) => value.trim())
                    .join(" / ");
                const currentMessage = bid.bidMessage || "";
                const appendedMessage = buyerAdditionalInfo
                  ? [currentMessage, buyerAdditionalInfo]
                      .filter((value) => String(value || "").trim() !== "")
                      .join(appendSeparator)
                  : currentMessage;

                const updatedBid = bidStore.updateBid(mapEntry.bidId, {
                  buyerAdditionalInfo: buyerAdditionalInfo || "",
                  bidMessage: appendedMessage,
                });

                if (updatedBid?.sellerContact) {
                  try {
                    await metaClient.sendInquiryToSeller({
                      to: updatedBid.sellerContact,
                      bidId: updatedBid.bidId,
                      bidMessage: updatedBid.bidMessage,
                      make: updatedBid.make,
                      model: updatedBid.model,
                      year: updatedBid.year,
                      fuelType: updatedBid.fuelType,
                      chassis: updatedBid.chassis,
                    });
                  } catch (err) {
                    console.error(
                      "Seller follow-up inquiry failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }

              if (mapEntry?.kind === "buyer_offer" && bid) {
                const buyerName = pickValue(responseData, [
                  "buyer_name",
                  "name",
                  "screen_0_Ime_i_prezime_0",
                  "screen_0_Ime_0",
                  "screen_0_Ime_1",
                ]);
                const buyerAddress = pickValue(responseData, [
                  "buyer_address",
                  "address",
                  "screen_0_Adresa_1",
                  "screen_0_Adresa_0",
                ]);
                const buyerCity = pickValue(responseData, [
                  "buyer_city",
                  "city",
                  "screen_0_Grad_2",
                  "screen_0_Grad_0",
                  "screen_0_Grad_1",
                ]);
                const buyerPostalCode = pickValue(responseData, [
                  "buyer_postal_code",
                  "postal_code",
                  "zip",
                  "screen_0_Potanski_broj_3",
                  "screen_0_Postanski_broj_0",
                  "screen_0_Postanski_broj_1",
                ]);
                const buyerContact = pickValue(responseData, [
                  "buyer_contact",
                  "contact",
                  "phone",
                  "screen_0_Kontakt_telefon_4",
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

              if (mapEntry?.kind === "buyer_mechanic_offer" && bid) {
                const buyerName = pickValue(responseData, [
                  "buyer_name",
                  "name",
                  "screen_0_Ime_i_prezime_1",
                  "screen_0_Ime_0",
                ]);
                const buyerContact = pickValue(responseData, [
                  "buyer_contact",
                  "contact",
                  "phone",
                  "screen_0_Kontakt_telefon_2",
                  "screen_0_Kontakt_0",
                ]);
                const acceptRaw = pickValue(responseData, [
                  "accept",
                  "screen_0_Prihvatam_0",
                  "screen_0_Prihvatam_1",
                ]);
                const accepted = (() => {
                  const normalized = String(acceptRaw || "").toLowerCase();
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
                  return false;
                })();

                const updated = bidStore.updateBid(bid.bidId, {
                  buyerName,
                  buyerContact,
                });

                if (accepted && updated?.sellerContact && updated?.bidOffer) {
                  try {
                    await metaClient.sendOfferToOwnerMechanic({
                      to: ownerNumber,
                      bidId: updated.bidId,
                      make: updated.make,
                      model: updated.model,
                      year: updated.year,
                      fuelType: updated.fuelType,
                      chassis: updated.chassis,
                      buyerName: updated.buyerName,
                      buyerContact: updated.buyerContact,
                      bidDetails: updated.bidMessage,
                      mechanicContact: updated.sellerContact,
                      bidOffer: updated.bidOffer,
                      bidDate: updated.bidDate,
                      bidTime: updated.bidTime,
                      bidNote: updated.bidNote || "-",
                    });
                  } catch (err) {
                    console.error(
                      "Owner mechanic notification failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }

              if (mapEntry?.kind === "buyer_roadside_offer" && bid) {
                const acceptRaw = pickValue(responseData, [
                  "accept",
                  "screen_0_Prihvatate_0",
                  "screen_0_Prihvatam_0",
                  "screen_0_Prihvatam_1",
                ]);
                const accepted = (() => {
                  const normalized = String(acceptRaw || "").toLowerCase();
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
                  return false;
                })();
                const buyerName = pickValue(responseData, [
                  "buyer_name",
                  "name",
                  "screen_0_Ime_i_prezime_0",
                  "screen_0_Ime_0",
                  "screen_0_Ime_1",
                ]);
                const buyerAddress = pickValue(responseData, [
                  "buyer_address",
                  "address",
                  "screen_0_Adresa_1",
                  "screen_0_Adresa_0",
                ]);
                const buyerCity = pickValue(responseData, [
                  "buyer_city",
                  "city",
                  "screen_0_Grad_2",
                  "screen_0_Grad_0",
                  "screen_0_Grad_1",
                ]);
                const buyerPostalCode = pickValue(responseData, [
                  "buyer_postal_code",
                  "postal_code",
                  "zip",
                  "screen_0_Potanski_broj_3",
                  "screen_0_Postanski_broj_0",
                  "screen_0_Postanski_broj_1",
                ]);
                const buyerContact = pickValue(responseData, [
                  "buyer_contact",
                  "contact",
                  "phone",
                  "screen_0_Kontakt_telefon_4",
                  "screen_0_Kontakt_0",
                  "screen_0_Kontakt_1",
                ]);

                const updated = bidStore.updateBid(bid.bidId, {
                  buyerName,
                  buyerAddress,
                  buyerCity,
                  buyerPostalCode,
                  buyerContact,
                  buyerNote: note ? String(note) : "",
                });
                if (accepted && updated?.sellerContact && updated?.bidOffer) {
                  try {
                    const labels = getRoadsideLabels(updated.serviceType);
                    const location = buildLocation(updated);
                    await metaClient.sendOwnerRoadsideNotification({
                      to: ownerNumber,
                      bidId: updated.bidId,
                      roadsideOrTow: labels.roadsideOrTow,
                      location,
                      buyerName: updated.buyerName || updated.name || "-",
                      buyerContact: updated.buyerContact || updated.customerNumber,
                      details: updated.bidMessage || "-",
                      bidDetails: updated.buyerNote || "-",
                      roadsideContact: updated.sellerContact,
                      bidOffer: updated.bidOffer,
                    });
                    await metaClient.sendRoadsideNotification({
                      to: updated.sellerContact,
                      bidId: updated.bidId,
                      roadsideOrTow: labels.roadsideOrTow,
                      buyerName: updated.buyerName || updated.name || "-",
                      buyerContact: updated.buyerContact || updated.customerNumber,
                      location,
                    });
                    await metaClient.sendBuyerRoadsideNotification({
                      to: updated.customerNumber,
                      bidId: updated.bidId,
                      roadsideOrTow: labels.roadsideOrTow,
                      roadsideOrTowData: labels.roadsideOrTowData,
                      roadsideContact: updated.sellerContact,
                      bidOffer: updated.bidOffer,
                      bidNote: updated.bidNote || "-",
                    });
                  } catch (err) {
                    console.error(
                      "Roadside acceptance notifications failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }

              if (mapEntry?.kind === "mechanic_inquiry") {
                const mechanicContact = normalizePhone(from);
                const bidDate = formatBidDate(dateISO);
                const bidTime = String(time || "").trim();

                const latestBidDetails =
                  bid?.bidMessage || bidStore.getBidRequest(mapEntry.bidId)?.bidMessage || "";

                const updated = bidStore.updateBid(mapEntry.bidId, {
                  sellerContact: mechanicContact,
                  bidOffer: price ? String(price) : "",
                  bidNote: note ? String(note) : "",
                  bidDate,
                  bidTime,
                  bidMessage: latestBidDetails || bid?.bidMessage,
                });

                if (updated && updated.customerNumber && price) {
                  try {
                    await metaClient.sendOfferToBuyerMechanic({
                      to: updated.customerNumber,
                      bidId: updated.bidId,
                      bidDetails: updated.bidMessage,
                      bidOffer: String(price),
                      bidDate: [bidDate, bidTime].filter(Boolean).join(" ") || "-",
                      bidNote: String(note || "-"),
                    });
                  } catch (err) {
                    console.error(
                      "Mechanic offer forward failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }

              if (mapEntry?.kind === "tow_inquiry") {
                const driverContact = normalizePhone(from);
                const latestBidDetails =
                  bid?.bidMessage || bidStore.getBidRequest(mapEntry.bidId)?.bidMessage || "";
                const updated = bidStore.updateBid(mapEntry.bidId, {
                  sellerContact: driverContact,
                  bidOffer: priceForBuyer,
                  bidOfferRaw: price ? String(price) : "",
                  bidNote: note ? String(note) : "",
                  bidMessage: latestBidDetails || bid?.bidMessage,
                });
                if (updated && updated.customerNumber && priceForBuyer) {
                  try {
                    if (
                      updated.notificationPreference === "telegram" &&
                      telegramClient &&
                      updated.telegramChatId
                    ) {
                      await telegramClient.sendMessage({
                        chatId: updated.telegramChatId,
                        text: formatBuyerRoadsideOfferMessage({
                          bidId: updated.bidId,
                          bidDetails: updated.bidMessage,
                          bidOffer: String(priceForBuyer),
                        }),
                        mask: true,
                      });
                    } else {
                      await metaClient.sendRoadsideOfferToBuyer({
                        to: updated.customerNumber,
                        bidId: updated.bidId,
                        bidDetails: updated.bidMessage,
                        bidOffer: String(priceForBuyer),
                      });
                    }
                  } catch (err) {
                    console.error(
                      "Tow offer forward failed:",
                      err?.response?.data || err.message || String(err),
                    );
                  }
                }
                continue;
              }

              if (mapEntry?.kind === "seller_inquiry") {
                const sellerContact = normalizePhone(from);
                const needsMoreInfoRaw = pickValue(responseData, [
                  "screen_0_Potrebne_dodatne_informacije_2",
                  "needs_more_info",
                  "more_info_needed",
                ]);
                const needsMoreInfo = (() => {
                  const normalized = String(needsMoreInfoRaw || "").toLowerCase();
                  if (
                    normalized.startsWith("0_") ||
                    normalized.endsWith("_da") ||
                    normalized.includes("da") ||
                    normalized === "yes"
                  ) {
                    return "yes";
                  }
                  if (
                    normalized.startsWith("1_") ||
                    normalized.endsWith("_ne") ||
                    normalized.includes("ne") ||
                    normalized === "no"
                  ) {
                    return "no";
                  }
                  return "";
                })();

                const latestBidDetails =
                  bid?.bidMessage || bidStore.getBidRequest(mapEntry.bidId)?.bidMessage || "";

                const updated = bidStore.updateBid(mapEntry.bidId, {
                  sellerContact,
                  bidOffer: priceForBuyer,
                  bidOfferRaw: price ? String(price) : "",
                  bidNote: note ? String(note) : "",
                  needsMoreInfo,
                  bidMessage: latestBidDetails || bid?.bidMessage,
                });
              if (updated && updated.customerNumber && needsMoreInfo === "yes") {
                try {
                  if (
                    updated.notificationPreference === "telegram" &&
                    telegramClient &&
                    updated.telegramChatId
                  ) {
                    await telegramClient.sendMessage({
                      chatId: updated.telegramChatId,
                      text: formatBuyerReviewMessage({
                        bidId: updated.bidId,
                        bidDetails: updated.bidMessage,
                        bidNote: String(note || "-"),
                      }),
                      mask: true,
                    });
                  } else {
                    await metaClient.sendBuyerReview({
                      to: updated.customerNumber,
                      bidId: updated.bidId,
                      bidDetails: updated.bidMessage,
                      bidNote: String(note || "-"),
                    });
                  }
                } catch (err) {
                  console.error(
                    "Buyer review request failed:",
                    err?.response?.data || err.message || String(err),
                  );
                }
                continue;
              }
              if (updated && updated.customerNumber && priceForBuyer) {
                try {
                  if (
                    updated.notificationPreference === "telegram" &&
                    telegramClient &&
                    updated.telegramChatId
                  ) {
                    await telegramClient.sendMessage({
                      chatId: updated.telegramChatId,
                      text: formatBuyerOfferMessage({
                        bidId: updated.bidId,
                        bidDetails: updated.bidMessage,
                        bidOffer: String(priceForBuyer),
                        bidNote: String(note || "-"),
                      }),
                      mask: true,
                    });
                  } else {
                    await metaClient.sendOfferToBuyer({
                      to: updated.customerNumber,
                      bidId: updated.bidId,
                      bidDetails: updated.bidMessage,
                      bidOffer: String(priceForBuyer),
                      bidNote: String(note || "-"),
                    });
                  }
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

            const markedOffer = applyMarkup(parsed.bidOffer, sellerMarkupPercent);
            const offerForBuyer = markedOffer || parsed.bidOffer;
            const updatedBid = bidStore.updateBid(parsed.bidId, {
              sellerContact: normalizePhone(from),
              bidOffer: offerForBuyer,
              bidOfferRaw: parsed.bidOffer,
            });

            try {
              await metaClient.sendOfferToBuyer({
                to: updatedBid?.customerNumber || bid.customerNumber,
                bidId: updatedBid?.bidId || bid.bidId,
                bidDetails: updatedBid?.bidMessage || bid.bidMessage,
                bidOffer: offerForBuyer,
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
