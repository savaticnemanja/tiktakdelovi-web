import { normalizePhone } from "../../../utils/phone.js";
import { applyMarkup } from "../../../utils/price.js";
import {
  formatBuyerOfferMessage,
  formatBuyerMechanicOfferMessage,
  formatBuyerRoadsideOfferMessage,
  formatBuyerReviewMessage,
} from "../../telegram/telegramMessages.js";
import { applyDecision } from "../helpers/decision.js";
import { getBuyerContact, getBuyerName } from "../helpers/bid.js";
import {
  pickValue,
  formatBidDate,
  getMapEntry,
  parseYesNoFlag,
  parseYesNoString,
  buildLocation,
} from "../utils.js";

export const createInteractiveHandler = ({
  bidStore,
  messageToBid,
  metaClient,
  telegramClient,
  ownerNumber,
  sellerMarkupPercent,
  notifyRoadsideAcceptance,
}) => {
  const appendSeparator = " / ";

  return async (message) => {
    if (message?.interactive?.type !== "nfm_reply") {
      return false;
    }

    const repliedToId = message?.context?.id;
    let mapEntry = getMapEntry(messageToBid, repliedToId);
    let bid = mapEntry?.bidId ? bidStore.getBidRequest(mapEntry.bidId) : null;

    const responseJsonRaw = message?.interactive?.nfm_reply?.response_json;
    let responseData = null;
    try {
      responseData = responseJsonRaw ? JSON.parse(responseJsonRaw) : null;
    } catch (err) {
      responseData = null;
    }

    if (!mapEntry && responseData?.Ime_i_Prezime_82e14b && message?.from) {
      const latestMechanic = bidStore.findLatestByCustomerNumber(message.from, "mechanic");
      if (latestMechanic) {
        mapEntry = { bidId: latestMechanic.bidId, kind: "service_customer_offer" };
        bid = latestMechanic;
      } else {
        const latestRoadside = bidStore.findLatestByCustomerNumber(message.from, "roadside");
        if (latestRoadside) {
          mapEntry = { bidId: latestRoadside.bidId, kind: "towing_customer_offer" };
          bid = latestRoadside;
        }
      }
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

    if (mapEntry?.kind === "parts_customer_review" && bid) {
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

    if (mapEntry?.kind === "parts_customer_offer" && bid) {
      const decision = applyDecision(bidStore, bid.bidId, "accepted", "whatsapp_buyer_offer");
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
        buyerContact: buyerContact || getBuyerContact(bid),
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

    if (mapEntry?.kind === "service_customer_offer" && bid) {
      const buyerName = pickValue(responseData, [
        "buyer_name",
        "name",
        "Ime_i_Prezime_82e14b",
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
      const decision = applyDecision(
        bidStore,
        bid.bidId,
        "accepted",
        "whatsapp_buyer_mechanic_offer",
      );
      if (!decision?.applied) {
        return true;
      }

      const fallbackContact = buyerContact || getBuyerContact(bid);
      const updated = bidStore.updateBid(bid.bidId, {
        buyerName,
        buyerContact: fallbackContact,
      });

      if (updated?.sellerContact && updated?.bidOffer) {
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

    if (mapEntry?.kind === "towing_customer_offer" && bid) {
      const acceptRaw = pickValue(responseData, [
        "accept",
        "screen_0_Prihvatate_0",
        "screen_0_Prihvatam_0",
        "screen_0_Prihvatam_1",
      ]);
      const accepted = acceptRaw ? parseYesNoFlag(acceptRaw) ?? false : true;
      const decision = applyDecision(
        bidStore,
        bid.bidId,
        accepted ? "accepted" : "declined",
        "whatsapp_buyer_roadside_offer",
      );
      if (!decision?.applied) {
        return true;
      }

      const buyerName = pickValue(responseData, [
        "buyer_name",
        "name",
        "Ime_i_Prezime_82e14b",
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
        buyerContact: buyerContact || getBuyerContact(bid),
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

    if (mapEntry?.kind === "service_mechanic_inquiry") {
      const mechanicContact = normalizePhone(message?.from);
      const bidDate = formatBidDate(dateISO);
      const bidTime = String(time || "").trim();

      const latestBidDetails =
        bid?.bidMessage || bidStore.getBidRequest(mapEntry.bidId)?.bidMessage || "";

      const updated = bidStore.updateBid(mapEntry.bidId, {
        sellerContact: mechanicContact,
        bidOffer: priceForBuyer,
        bidOfferRaw: price ? String(price) : "",
        bidNote: note ? String(note) : "",
        bidDate,
        bidTime,
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
              text: formatBuyerMechanicOfferMessage({
                bidId: updated.bidId,
                bidDetails: updated.bidMessage,
                bidOffer: String(priceForBuyer),
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
              bidOffer: String(priceForBuyer),
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

    if (mapEntry?.kind === "towing_operator_inquiry") {
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
              location: buildLocation(updated),
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

    if (mapEntry?.kind === "parts_provider_inquiry") {
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
};
