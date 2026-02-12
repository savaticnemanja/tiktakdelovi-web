import { parseOfferMessage } from "../../utils/parseOffer.js";
import { normalizePhone } from "../../utils/phone.js";
import { applyMarkup } from "../../utils/price.js";
import {
  formatBuyerOfferMessage,
  formatBuyerMechanicNotificationMessage,
  formatBuyerMechanicOfferMessage,
  formatBuyerRoadsideOfferMessage,
  formatBuyerReviewMessage,
  formatBuyerImageCaption,
} from "../../services/telegramMessages.js";
import {
  pickValue,
  formatBidDate,
  normalizeButtonPayload,
  getRoadsideLabels,
  buildLocation,
  getMapEntry,
  parseYesNoFlag,
  parseYesNoString,
} from "./utils.js";

export const createWebhookHandlers = ({
  bidStore,
  messageToBid,
  metaClient,
  telegramClient,
  ownerNumber,
  courierNumber,
  sellerNumbers,
  sellerMarkupPercent,
}) => {
  const appendSeparator = " / ";
  const notifyRoadsideAcceptance = async (bid) => {
    if (!bid?.sellerContact || !bid?.bidOffer) {
      return;
    }
    const labels = getRoadsideLabels(bid.serviceType);
    const location = buildLocation(bid);
    await metaClient.sendOwnerRoadsideNotification({
      to: ownerNumber,
      bidId: bid.bidId,
      roadsideOrTow: labels.roadsideOrTow,
      location,
      buyerName: bid.buyerName || bid.name || "-",
      buyerContact: bid.buyerContact || bid.customerNumber,
      details: bid.bidMessage || "-",
      roadsideContact: bid.sellerContact,
      bidOffer: bid.bidOffer,
    });
    await metaClient.sendRoadsideNotification({
      to: bid.sellerContact,
      bidId: bid.bidId,
      buyerName: bid.buyerName || bid.name || "-",
      buyerContact: bid.buyerContact || bid.customerNumber,
      location,
    });
    await metaClient.sendBuyerRoadsideNotification({
      to: bid.customerNumber,
      bidId: bid.bidId,
      roadsideOrTowData: labels.roadsideOrTowData,
      roadsideContact: bid.sellerContact,
      bidOffer: bid.bidOffer,
    });
  };

  const handleImageMessage = async (message) => {
    const from = message?.from;
    if (message?.type !== "image" || !message?.image?.id || !from) {
      return false;
    }
    const normalizedSender = normalizePhone(from);
    const allowedSellers = Array.isArray(sellerNumbers)
      ? sellerNumbers.map((number) => normalizePhone(number))
      : [];
    if (!allowedSellers.includes(normalizedSender)) {
      return true;
    }
    const caption = message?.image?.caption || "";
    const bidIdMatch = caption.match(/(\d+)/);
    const bidId = bidIdMatch ? bidIdMatch[1] : null;
    if (!bidId) {
      return true;
    }
    const bid = bidStore.getBidRequest(bidId);
    if (!bid) {
      return true;
    }
    const buyerCaption = formatBuyerImageCaption({
      bidId,
      bidOffer: bid.bidOffer,
    });
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
    return true;
  };

  const handleButtonMessage = async (message) => {
    const from = message?.from;
    if (message?.type !== "button" || !message?.button || !from) {
      return false;
    }
    const sender = normalizePhone(from);
    const repliedToId = message?.context?.id;
    const mapEntry = getMapEntry(messageToBid, repliedToId);
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
    const normalizedText = normalizeButtonPayload(message?.button?.text || "");

    if (mapEntry?.kind === "buyer_roadside_offer" && mapEntry?.bidId) {
      const bid = bidStore.getBidRequest(mapEntry.bidId);
      if (!bid) {
        return true;
      }
      const expectedBuyer = normalizePhone(bid.customerNumber);
      if (!expectedBuyer || sender !== expectedBuyer) {
        return true;
      }
      const declinesRoadside =
        actionFromPayload === "decline_roadside_offer" ||
        actionFromPayload === "decline_offer" ||
        normalizedPayload.includes("odbij") ||
        normalizedText.includes("odbij") ||
        normalizedPayload.includes("ne prihvat") ||
        normalizedText.includes("ne prihvat") ||
        normalizedPayload.includes("neprihvat") ||
        normalizedText.includes("neprihvat");
      const acceptsRoadside =
        !declinesRoadside &&
        (
          actionFromPayload === "accept_roadside_offer" ||
          actionFromPayload === "accept_offer" ||
          normalizedPayload.includes("prihvat") ||
          normalizedText.includes("prihvat") ||
          normalizedPayload.includes("accept") ||
          normalizedText.includes("accept")
        );
      if (!acceptsRoadside) {
        return true;
      }

      const decision = bidStore.setBuyerDecision(bid.bidId, {
        status: "accepted",
        source: "whatsapp_buyer_roadside_quick_reply",
      });
      if (!decision?.applied) {
        return true;
      }
      const updated = bidStore.updateBid(bid.bidId, {
        buyerContact: bid.buyerContact || bid.customerNumber,
      });
      try {
        await notifyRoadsideAcceptance(updated || bid);
      } catch (err) {
        console.error(
          "Roadside acceptance notifications failed:",
          err?.response?.data || err.message || String(err),
        );
      }
      return true;
    }

    const ownerSender = normalizePhone(ownerNumber);
    if (!ownerSender || sender !== ownerSender) {
      return true;
    }

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
      return true;
    }
    const bid = mapEntryWithFallback?.bidId
      ? bidStore.getBidRequest(mapEntryWithFallback.bidId)
      : null;
    if (!bid) {
      return true;
    }

    const wantsCourier =
      actionFromPayload === "notify_courier" || normalizedPayload.includes("dostavlja");
    const wantsSeller =
      actionFromPayload === "notify_seller" || normalizedPayload.includes("prodav");
    const wantsBuyer =
      actionFromPayload === "notify_buyer" || normalizedPayload.includes("kupca");
    const wantsMechanic =
      actionFromPayload === "notify_mechanic" || normalizedPayload.includes("mehanicar");

    if (wantsCourier && mapEntryWithFallback.kind === "owner_notification") {
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
      return true;
    }

    if (wantsSeller && mapEntryWithFallback.kind === "owner_notification") {
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
      return true;
    }

    if (wantsBuyer && mapEntryWithFallback.kind === "owner_notification_mechanic") {
      if (bid.customerNumber && bid.sellerContact && bid.bidOffer) {
        try {
          if (
            bid.notificationPreference === "telegram" &&
            telegramClient &&
            bid.telegramChatId
          ) {
            await telegramClient.sendMessage({
              chatId: bid.telegramChatId,
              text: formatBuyerMechanicNotificationMessage({
                bidId: bid.bidId,
                make: bid.make || "-",
                model: bid.model || "-",
                year: bid.year || "-",
                fuelType: bid.fuelType || "-",
                mechanicContact: bid.sellerContact || "-",
                bidOffer: bid.bidOffer || "-",
                bidDate: bid.bidDate || "-",
                bidTime: bid.bidTime || "-",
                bidNote: bid.bidNote || "-",
              }),
            });
          } else {
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
          }
        } catch (err) {
          console.error(
            "Buyer mechanic notification failed:",
            err?.response?.data || err.message || String(err),
          );
        }
      }
      return true;
    }

    if (wantsMechanic && mapEntryWithFallback.kind === "owner_notification_mechanic") {
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
    }
    return true;
  };

  const handleInteractiveMessage = async (message) => {
    if (message?.interactive?.type !== "nfm_reply") {
      return false;
    }

    const repliedToId = message?.context?.id;
    const mapEntry = getMapEntry(messageToBid, repliedToId);
    const bid = mapEntry?.bidId ? bidStore.getBidRequest(mapEntry.bidId) : null;

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
    const markedPrice = price ? applyMarkup(price, sellerMarkupPercent) : null;
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
      return true;
    }

    if (mapEntry?.kind === "buyer_offer" && bid) {
      const decision = bidStore.setBuyerDecision(bid.bidId, {
        status: "accepted",
        source: "whatsapp_buyer_offer",
      });
      if (!decision?.applied) {
        return true;
      }

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
      return true;
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
      const accepted = parseYesNoFlag(acceptRaw) ?? false;
      const decision = bidStore.setBuyerDecision(bid.bidId, {
        status: accepted ? "accepted" : "declined",
        source: "whatsapp_buyer_mechanic_offer",
      });
      if (!decision?.applied) {
        return true;
      }

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
      return true;
    }

    if (mapEntry?.kind === "buyer_roadside_offer" && bid) {
      const acceptRaw = pickValue(responseData, [
        "accept",
        "screen_0_Prihvatate_0",
        "screen_0_Prihvatam_0",
        "screen_0_Prihvatam_1",
      ]);
      const accepted = parseYesNoFlag(acceptRaw) ?? false;
      const decision = bidStore.setBuyerDecision(bid.bidId, {
        status: accepted ? "accepted" : "declined",
        source: "whatsapp_buyer_roadside_offer",
      });
      if (!decision?.applied) {
        return true;
      }

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
      if (accepted) {
        try {
          await notifyRoadsideAcceptance(updated);
        } catch (err) {
          console.error(
            "Roadside acceptance notifications failed:",
            err?.response?.data || err.message || String(err),
          );
        }
      }
      return true;
    }

    if (mapEntry?.kind === "mechanic_inquiry") {
      const mechanicContact = normalizePhone(message?.from);
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
          if (
            updated.notificationPreference === "telegram" &&
            telegramClient &&
            updated.telegramChatId
          ) {
            await telegramClient.sendMessage({
              chatId: updated.telegramChatId,
              text: formatBuyerMechanicOfferMessage({
                bidId: updated.bidId,
                bidDetails: updated.bidMessage,
                bidOffer: String(price),
                bidDate: [bidDate, bidTime].filter(Boolean).join(" ") || "-",
                bidNote: String(note || "-"),
              }),
              mask: true,
              replyMarkup: {
                inline_keyboard: [
                  [
                    { text: "Prihvati", callback_data: `tg:mech:accept:${updated.bidId}` },
                    { text: "Odbij", callback_data: `tg:mech:decline:${updated.bidId}` },
                  ],
                ],
              },
            });
          } else {
            await metaClient.sendOfferToBuyerMechanic({
              to: updated.customerNumber,
              bidId: updated.bidId,
              bidDetails: updated.bidMessage,
              bidOffer: String(price),
              bidDate: [bidDate, bidTime].filter(Boolean).join(" ") || "-",
              bidNote: String(note || "-"),
            });
          }
        } catch (err) {
          console.error(
            "Mechanic offer forward failed:",
            err?.response?.data || err.message || String(err),
          );
        }
      }
      return true;
    }

    if (mapEntry?.kind === "tow_inquiry") {
      const driverContact = normalizePhone(message?.from);
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
              replyMarkup: {
                inline_keyboard: [
                  [
                    { text: "Prihvati", callback_data: `tg:road:accept:${updated.bidId}` },
                    { text: "Odbij", callback_data: `tg:road:decline:${updated.bidId}` },
                  ],
                ],
              },
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
      return true;
    }

    if (mapEntry?.kind === "seller_inquiry") {
      const sellerContact = normalizePhone(message?.from);
      const needsMoreInfoRaw = pickValue(responseData, [
        "screen_0_Potrebne_dodatne_informacije_2",
        "needs_more_info",
        "more_info_needed",
      ]);
      const needsMoreInfo = parseYesNoString(needsMoreInfoRaw);

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
              replyMarkup: {
                inline_keyboard: [
                  [
                    {
                      text: "Pošalji dodatne informacije",
                      callback_data: `tg:review:start:${updated.bidId}`,
                    },
                  ],
                ],
              },
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
        return true;
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
              replyMarkup: {
                inline_keyboard: [
                  [
                    { text: "Prihvati", callback_data: `tg:parts:accept:${updated.bidId}` },
                    { text: "Odbij", callback_data: `tg:parts:decline:${updated.bidId}` },
                  ],
                ],
              },
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
    return true;
  };

  const handleTextMessage = async (message) => {
    const textBody = message?.text?.body;
    const from = message?.from;
    if (!textBody || !from) {
      return false;
    }
    const parsed = parseOfferMessage(textBody);
    if (!parsed) {
      return true;
    }

    const bid = bidStore.getBidRequest(parsed.bidId);
    if (!bid) {
      return true;
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
    return true;
  };

  return {
    handleImageMessage,
    handleButtonMessage,
    handleInteractiveMessage,
    handleTextMessage,
  };
};
