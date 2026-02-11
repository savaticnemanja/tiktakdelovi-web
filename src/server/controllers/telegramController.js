import { normalizePhone } from "../utils/phone.js";
import { buildLocation, getRoadsideLabels } from "./webhook/utils.js";

export const createTelegramController = ({
  bidStore,
  telegramClient,
  metaClient,
  ownerNumber,
}) => {
  const normalizeKey = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const parseYesNoFlag = (raw) => {
    const normalized = normalizeKey(raw);
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
    return null;
  };

  const mapFieldKey = (keyRaw) => {
    const key = normalizeKey(keyRaw);
    if (["ime", "ime_i_prezime", "name"].includes(key)) return "name";
    if (["adresa", "address"].includes(key)) return "address";
    if (["grad", "city"].includes(key)) return "city";
    if (["postanski_broj", "postanski", "zip", "postal", "postal_code"].includes(key)) {
      return "postalCode";
    }
    if (["kontakt", "kontakt_telefon", "telefon", "phone", "buyer_contact"].includes(key)) {
      return "contact";
    }
    if (["prihvatam", "prihvatate", "accept"].includes(key)) return "accept";
    if (["napomena", "note"].includes(key)) return "note";
    return "";
  };

  const parseFields = (raw) => {
    const output = {};
    const text = String(raw || "").trim();
    if (!text) return output;
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    lines.forEach((line) => {
      const sepIndex = line.search(/[:=]/);
      if (sepIndex < 1) return;
      const keyRaw = line.slice(0, sepIndex).trim();
      const value = line.slice(sepIndex + 1).trim();
      const mapped = mapFieldKey(keyRaw);
      if (!mapped || !value) return;
      output[mapped] = value;
    });
    return output;
  };

  const parseCommand = (rawText) => {
    const text = String(rawText || "").trim();
    if (!text.startsWith("/")) {
      return { command: "", args: text };
    }
    const firstTokenMatch = text.match(/^(\S+)([\s\S]*)$/);
    if (!firstTokenMatch) return { command: "", args: "" };
    return {
      command: normalizeKey(firstTokenMatch[1]),
      args: String(firstTokenMatch[2] || "").trim(),
    };
  };

  const inferRequestType = (bid) => {
    if (["parts", "mechanic", "roadside"].includes(bid?.requestType)) {
      return bid.requestType;
    }
    if (bid?.serviceType) return "roadside";
    if (bid?.bidDate || bid?.bidTime) return "mechanic";
    return "parts";
  };

  const getFlow = (bid) => {
    if (!bid?.telegramFlow || typeof bid.telegramFlow !== "object") return null;
    return bid.telegramFlow;
  };

  const setFlow = (bidId, flow) => bidStore.updateBid(bidId, { telegramFlow: flow || null });

  const clearFlow = (bidId) => bidStore.updateBid(bidId, { telegramFlow: null });

  const sendActionKeyboard = async (chatId, bid) => {
    const requestType = inferRequestType(bid);
    if (bid?.needsMoreInfo === "yes") {
      await telegramClient.sendMessage({
        chatId,
        text: "Izaberite opciju:",
        replyMarkup: {
          inline_keyboard: [
            [
              {
                text: "Pošalji dodatne informacije",
                callback_data: `tg:review:start:${bid.bidId}`,
              },
            ],
          ],
        },
      });
      return;
    }

    if (!bid?.bidOffer) {
      await telegramClient.sendMessage({ chatId, text: "Još nema ponude za ovaj zahtev." });
      return;
    }

    const mode =
      requestType === "mechanic" ? "mech" : requestType === "roadside" ? "road" : "parts";

    await telegramClient.sendMessage({
      chatId,
      text: "Izaberite opciju:",
      replyMarkup: {
        inline_keyboard: [
          [
            { text: "Prihvati", callback_data: `tg:${mode}:accept:${bid.bidId}` },
            { text: "Odbij", callback_data: `tg:${mode}:decline:${bid.bidId}` },
          ],
        ],
      },
    });
  };

  const buildHelpText = (bid) => {
    const requestType = inferRequestType(bid);
    if (bid?.needsMoreInfo === "yes") {
      return `Koristite dugme "Pošalji dodatne informacije" ili pošaljite:
/info Vaše dodatne informacije`;
    }
    if (requestType === "mechanic") {
      return "Kliknite na dugme Prihvati/Odbij ispod poruke sa ponudom.";
    }
    if (requestType === "roadside") {
      return "Kliknite na dugme Prihvati/Odbij ispod poruke sa ponudom.";
    }
    return "Kliknite na dugme Prihvati/Odbij ispod poruke sa ponudom.";
  };

  const sendFlowPrompt = async (chatId, bid, flow) => {
    if (!flow) return;

    if (flow.mode === "review") {
      await telegramClient.sendMessage({
        chatId,
        text: `Zahtev #${bid.bidId}: pošaljite dodatne informacije kao običnu poruku.`,
      });
      return;
    }

    if (flow.mode === "parts") {
      if (flow.step === "name") {
        await telegramClient.sendMessage({ chatId, text: "Unesite ime i prezime." });
        return;
      }
      if (flow.step === "contact") {
        await telegramClient.sendMessage({ chatId, text: "Unesite kontakt telefon (+381...)." });
        return;
      }
      if (flow.step === "address") {
        await telegramClient.sendMessage({ chatId, text: "Unesite adresu za isporuku." });
        return;
      }
      if (flow.step === "city") {
        await telegramClient.sendMessage({ chatId, text: "Unesite grad." });
        return;
      }
      if (flow.step === "postalCode") {
        await telegramClient.sendMessage({ chatId, text: "Unesite poštanski broj." });
      }
      return;
    }

    if (flow.mode === "mechanic") {
      if (flow.step === "name") {
        await telegramClient.sendMessage({ chatId, text: "Unesite ime i prezime." });
        return;
      }
      if (flow.step === "contact") {
        await telegramClient.sendMessage({ chatId, text: "Unesite kontakt telefon (+381...)." });
      }
      return;
    }

    if (flow.mode === "roadside") {
      if (flow.step === "name") {
        await telegramClient.sendMessage({ chatId, text: "Unesite ime i prezime." });
        return;
      }
      if (flow.step === "contact") {
        await telegramClient.sendMessage({ chatId, text: "Unesite kontakt telefon (+381...)." });
        return;
      }
      if (flow.step === "address") {
        await telegramClient.sendMessage({ chatId, text: "Unesite adresu." });
        return;
      }
      if (flow.step === "city") {
        await telegramClient.sendMessage({ chatId, text: "Unesite grad." });
        return;
      }
      if (flow.step === "postalCode") {
        await telegramClient.sendMessage({ chatId, text: "Unesite poštanski broj." });
        return;
      }
      if (flow.step === "note") {
        await telegramClient.sendMessage({
          chatId,
          text: "Unesite napomenu (opciono).",
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "Preskoči napomenu",
                  callback_data: `tg:road:skipnote:${bid.bidId}`,
                },
              ],
            ],
          },
        });
      }
    }
  };

  const sendAdditionalInfoToProvider = async (updatedBid) => {
    if (!updatedBid?.sellerContact) return;
    const requestType = inferRequestType(updatedBid);

    if (requestType === "mechanic") {
      await metaClient.sendInquiryToMechanic({
        to: updatedBid.sellerContact,
        bidId: updatedBid.bidId,
        bidMessage: updatedBid.bidMessage,
        make: updatedBid.make,
        model: updatedBid.model,
        year: updatedBid.year,
        fuelType: updatedBid.fuelType,
        chassis: updatedBid.chassis,
      });
      return;
    }

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
  };

  const notifyOwnerParts = async (updatedBid) => {
    if (!updatedBid?.sellerContact || !updatedBid?.bidOffer) return;
    await metaClient.sendOfferToOwner({
      to: ownerNumber,
      bidId: updatedBid.bidId,
      make: updatedBid.make,
      model: updatedBid.model,
      year: updatedBid.year,
      fuelType: updatedBid.fuelType,
      chassis: updatedBid.chassis,
      buyerName: updatedBid.buyerName,
      buyerAddress: updatedBid.buyerAddress,
      buyerCity: updatedBid.buyerCity,
      buyerPostalCode: updatedBid.buyerPostalCode,
      buyerContact: updatedBid.buyerContact,
      bidMessage: updatedBid.bidMessage,
      sellerNumber: updatedBid.sellerContact,
      bidOffer: updatedBid.bidOffer,
    });
  };

  const notifyOwnerMechanic = async (updatedBid) => {
    if (!updatedBid?.sellerContact || !updatedBid?.bidOffer) return;
    await metaClient.sendOfferToOwnerMechanic({
      to: ownerNumber,
      bidId: updatedBid.bidId,
      make: updatedBid.make,
      model: updatedBid.model,
      year: updatedBid.year,
      fuelType: updatedBid.fuelType,
      chassis: updatedBid.chassis,
      buyerName: updatedBid.buyerName,
      buyerContact: updatedBid.buyerContact,
      bidDetails: updatedBid.bidMessage,
      mechanicContact: updatedBid.sellerContact,
      bidOffer: updatedBid.bidOffer,
      bidDate: updatedBid.bidDate,
      bidTime: updatedBid.bidTime,
      bidNote: updatedBid.bidNote || "-",
    });
  };

  const notifyRoadsideAccepted = async (updatedBid) => {
    if (!updatedBid?.sellerContact || !updatedBid?.bidOffer) return;

    const labels = getRoadsideLabels(updatedBid.serviceType);
    const location = buildLocation(updatedBid);

    await metaClient.sendOwnerRoadsideNotification({
      to: ownerNumber,
      bidId: updatedBid.bidId,
      roadsideOrTow: labels.roadsideOrTow,
      location,
      buyerName: updatedBid.buyerName || updatedBid.name || "-",
      buyerContact: updatedBid.buyerContact || updatedBid.customerNumber,
      details: updatedBid.bidMessage || "-",
      roadsideContact: updatedBid.sellerContact,
      bidOffer: updatedBid.bidOffer,
    });

    await metaClient.sendRoadsideNotification({
      to: updatedBid.sellerContact,
      bidId: updatedBid.bidId,
      buyerName: updatedBid.buyerName || updatedBid.name || "-",
      buyerContact: updatedBid.buyerContact || updatedBid.customerNumber,
      location,
    });

    await metaClient.sendBuyerRoadsideNotification({
      to: updatedBid.customerNumber,
      bidId: updatedBid.bidId,
      roadsideOrTowData: labels.roadsideOrTowData,
      roadsideContact: updatedBid.sellerContact,
      bidOffer: updatedBid.bidOffer,
    });
  };

  const finalizeParts = async (bid, flowData, chatId) => {
    const updatedBid = bidStore.updateBid(bid.bidId, {
      buyerName: flowData.name || bid.buyerName || bid.name || "",
      buyerAddress: flowData.address || bid.buyerAddress || "",
      buyerCity: flowData.city || bid.buyerCity || "",
      buyerPostalCode: flowData.postalCode || bid.buyerPostalCode || "",
      buyerContact: normalizePhone(flowData.contact || bid.buyerContact || ""),
    });

    try {
      await notifyOwnerParts(updatedBid);
    } catch (err) {
      console.error(
        "Owner notification failed (telegram wizard):",
        err?.response?.data || err.message || String(err),
      );
    }

    clearFlow(bid.bidId);
    await telegramClient.sendMessage({
      chatId,
      text: `Podaci su sačuvani za zahtev #${bid.bidId}.`,
    });
  };

  const finalizeMechanic = async (bid, flowData, chatId) => {
    const updatedBid = bidStore.updateBid(bid.bidId, {
      buyerName: flowData.name || bid.buyerName || bid.name || "",
      buyerContact: normalizePhone(flowData.contact || bid.buyerContact || ""),
    });

    try {
      await notifyOwnerMechanic(updatedBid);
    } catch (err) {
      console.error(
        "Owner mechanic notification failed (telegram wizard):",
        err?.response?.data || err.message || String(err),
      );
    }

    clearFlow(bid.bidId);
    await telegramClient.sendMessage({
      chatId,
      text: `Ponuda je prihvaćena za zahtev #${bid.bidId}.`,
    });
  };

  const finalizeRoadside = async (bid, flowData, chatId) => {
    const updatedBid = bidStore.updateBid(bid.bidId, {
      buyerName: flowData.name || bid.buyerName || bid.name || "",
      buyerAddress: flowData.address || bid.buyerAddress || "",
      buyerCity: flowData.city || bid.buyerCity || "",
      buyerPostalCode: flowData.postalCode || bid.buyerPostalCode || "",
      buyerContact: normalizePhone(flowData.contact || bid.buyerContact || ""),
      buyerNote: flowData.note || "",
    });

    try {
      await notifyRoadsideAccepted(updatedBid);
    } catch (err) {
      console.error(
        "Roadside acceptance notifications failed (telegram wizard):",
        err?.response?.data || err.message || String(err),
      );
    }

    clearFlow(bid.bidId);
    await telegramClient.sendMessage({
      chatId,
      text: `Ponuda je prihvaćena za zahtev #${bid.bidId}.`,
    });
  };

  const consumeFlowMessage = async (bid, text, chatId) => {
    const flow = getFlow(bid);
    if (!flow) return false;

    if (flow.mode === "review" && flow.step === "info") {
      const additionalInfo = String(text || "").trim();
      if (!additionalInfo) {
        await sendFlowPrompt(chatId, bid, flow);
        return true;
      }

      const appendedMessage = [bid.bidMessage, additionalInfo].filter(Boolean).join(" / ");
      const updatedBid = bidStore.updateBid(bid.bidId, {
        bidMessage: appendedMessage,
        buyerAdditionalInfo: additionalInfo,
      });

      try {
        await sendAdditionalInfoToProvider(updatedBid);
      } catch (err) {
        console.error(
          "Seller follow-up inquiry failed (telegram wizard):",
          err?.response?.data || err.message || String(err),
        );
      }

      clearFlow(bid.bidId);
      await telegramClient.sendMessage({
        chatId,
        text: `Dodatne informacije su sačuvane za zahtev #${bid.bidId}.`,
      });
      return true;
    }

    const value = String(text || "").trim();
    if (!value) {
      await sendFlowPrompt(chatId, bid, flow);
      return true;
    }

    const nextData = { ...(flow.data || {}) };

    if (flow.mode === "parts") {
      if (flow.step === "name") {
        nextData.name = value;
        const nextFlow = { ...flow, step: "contact", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "contact") {
        nextData.contact = value;
        const nextFlow = { ...flow, step: "address", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "address") {
        nextData.address = value;
        const nextFlow = { ...flow, step: "city", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "city") {
        nextData.city = value;
        const nextFlow = { ...flow, step: "postalCode", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "postalCode") {
        nextData.postalCode = value;
        await finalizeParts(bid, nextData, chatId);
        return true;
      }
    }

    if (flow.mode === "mechanic") {
      if (flow.step === "name") {
        nextData.name = value;
        const nextFlow = { ...flow, step: "contact", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "contact") {
        nextData.contact = value;
        await finalizeMechanic(bid, nextData, chatId);
        return true;
      }
    }

    if (flow.mode === "roadside") {
      if (flow.step === "name") {
        nextData.name = value;
        const nextFlow = { ...flow, step: "contact", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "contact") {
        nextData.contact = value;
        const nextFlow = { ...flow, step: "address", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "address") {
        nextData.address = value;
        const nextFlow = { ...flow, step: "city", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "city") {
        nextData.city = value;
        const nextFlow = { ...flow, step: "postalCode", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "postalCode") {
        nextData.postalCode = value;
        const nextFlow = { ...flow, step: "note", data: nextData };
        setFlow(bid.bidId, nextFlow);
        await sendFlowPrompt(chatId, bid, nextFlow);
        return true;
      }
      if (flow.step === "note") {
        nextData.note = value;
        await finalizeRoadside(bid, nextData, chatId);
        return true;
      }
    }

    return false;
  };

  const handleCallbackQuery = async (callback) => {
    const callbackQueryId = callback?.id;
    const chatId = callback?.message?.chat?.id;
    const data = String(callback?.data || "");

    if (!callbackQueryId || !chatId || !data.startsWith("tg:")) {
      return false;
    }

    const [, mode, action, bidIdRaw] = data.split(":");
    const bidId = String(bidIdRaw || "").trim();
    const bid = (bidId && bidStore.getBidRequest(bidId)) || bidStore.findLatestByTelegramChatId(chatId);

    if (!bid || String(bid.telegramChatId || "") !== String(chatId)) {
      await telegramClient.answerCallbackQuery({
        callbackQueryId,
        text: "Zahtev nije pronađen za ovaj chat.",
        showAlert: true,
      });
      return true;
    }

    if (mode === "review" && action === "start") {
      setFlow(bid.bidId, { mode: "review", step: "info", data: {} });
      await telegramClient.answerCallbackQuery({ callbackQueryId, text: "Unesite informacije." });
      await sendFlowPrompt(chatId, bid, { mode: "review", step: "info", data: {} });
      return true;
    }

    if (mode === "parts" && action === "accept") {
      const flow = { mode: "parts", step: "name", data: {} };
      setFlow(bid.bidId, flow);
      await telegramClient.answerCallbackQuery({ callbackQueryId, text: "Krećemo." });
      await sendFlowPrompt(chatId, bid, flow);
      return true;
    }

    if (mode === "parts" && action === "decline") {
      clearFlow(bid.bidId);
      await telegramClient.answerCallbackQuery({ callbackQueryId, text: "Ponuda odbijena." });
      await telegramClient.sendMessage({
        chatId,
        text: `Ponuda je odbijena za zahtev #${bid.bidId}.`,
      });
      return true;
    }

    if (mode === "mech" && action === "accept") {
      const flow = { mode: "mechanic", step: "name", data: {} };
      setFlow(bid.bidId, flow);
      await telegramClient.answerCallbackQuery({ callbackQueryId, text: "Krećemo." });
      await sendFlowPrompt(chatId, bid, flow);
      return true;
    }

    if (mode === "mech" && action === "decline") {
      clearFlow(bid.bidId);
      await telegramClient.answerCallbackQuery({ callbackQueryId, text: "Ponuda odbijena." });
      await telegramClient.sendMessage({
        chatId,
        text: `Ponuda je odbijena za zahtev #${bid.bidId}.`,
      });
      return true;
    }

    if (mode === "road" && action === "accept") {
      const flow = { mode: "roadside", step: "name", data: {} };
      setFlow(bid.bidId, flow);
      await telegramClient.answerCallbackQuery({ callbackQueryId, text: "Krećemo." });
      await sendFlowPrompt(chatId, bid, flow);
      return true;
    }

    if (mode === "road" && action === "decline") {
      clearFlow(bid.bidId);
      await telegramClient.answerCallbackQuery({ callbackQueryId, text: "Ponuda odbijena." });
      await telegramClient.sendMessage({
        chatId,
        text: `Ponuda je odbijena za zahtev #${bid.bidId}.`,
      });
      return true;
    }

    if (mode === "road" && action === "skipnote") {
      const flow = getFlow(bid);
      if (flow?.mode === "roadside" && flow?.step === "note") {
        await finalizeRoadside(bid, flow.data || {}, chatId);
      }
      await telegramClient.answerCallbackQuery({ callbackQueryId, text: "Napomena preskočena." });
      return true;
    }

    await telegramClient.answerCallbackQuery({ callbackQueryId, text: "Nepoznata akcija." });
    return true;
  };

  const verifySecret = (req, res, next) => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret) return next();
    const header = req.headers["x-telegram-bot-api-secret-token"];
    if (header !== secret) {
      return res.sendStatus(403);
    }
    return next();
  };

  const handleWebhook = async (req, res) => {
    try {
      const callbackQuery = req.body?.callback_query;
      if (callbackQuery && telegramClient) {
        await handleCallbackQuery(callbackQuery);
        return res.sendStatus(200);
      }

      const message = req.body?.message;
      const text = message?.text || "";
      const chatId = message?.chat?.id;
      if (!telegramClient || !chatId) {
        return res.sendStatus(200);
      }

      if (text.startsWith("/start")) {
        const bidIdMatch = text.match(/#?(\d+)/);
        const bidId = bidIdMatch ? bidIdMatch[1] : null;
        if (!bidId) {
          await telegramClient.sendMessage({
            chatId,
            text: "Pošaljite: /start #<broj zahteva> da povežete razgovor.",
          });
          return res.sendStatus(200);
        }
        const bid = bidStore.getBidRequest(bidId);
        if (!bid) {
          await telegramClient.sendMessage({
            chatId,
            text: `Zahtev #${bidId} nije pronađen.`,
          });
          return res.sendStatus(200);
        }
        bidStore.updateBid(bidId, {
          telegramChatId: String(chatId),
          notificationPreference: "telegram",
          telegramFlow: null,
        });
        await telegramClient.sendMessage({
          chatId,
          text: `Telegram je povezan za zahtev #${bidId}.`,
        });
        await sendActionKeyboard(chatId, bidStore.getBidRequest(bidId));
        return res.sendStatus(200);
      }

      if (!text.trim()) {
        return res.sendStatus(200);
      }

      const bid = bidStore.findLatestByTelegramChatId(chatId) || null;
      if (!bid) {
        return res.sendStatus(200);
      }

      if (await consumeFlowMessage(bid, text, chatId)) {
        return res.sendStatus(200);
      }

      const { command, args } = parseCommand(text);

      if (command === "/help") {
        await telegramClient.sendMessage({ chatId, text: buildHelpText(bid) });
        await sendActionKeyboard(chatId, bid);
        return res.sendStatus(200);
      }

      if (command === "/info" && bid.needsMoreInfo === "yes") {
        const payload = String(args || "").trim();
        if (!payload) {
          await telegramClient.sendMessage({ chatId, text: buildHelpText(bid) });
          return res.sendStatus(200);
        }
        setFlow(bid.bidId, { mode: "review", step: "info", data: {} });
        await consumeFlowMessage(bidStore.getBidRequest(bid.bidId), payload, chatId);
        return res.sendStatus(200);
      }

      const replyCommands = ["/odgovor", "/reply", "/accept"];
      if (replyCommands.includes(command)) {
        const requestType = inferRequestType(bid);
        const fields = parseFields(args);

        if (requestType === "parts") {
          const data = {
            name: fields.name || bid.buyerName || bid.name || "",
            contact: fields.contact || bid.buyerContact || "",
            address: fields.address || bid.buyerAddress || "",
            city: fields.city || bid.buyerCity || "",
            postalCode: fields.postalCode || bid.buyerPostalCode || "",
          };
          if (!data.name || !data.contact) {
            await telegramClient.sendMessage({ chatId, text: buildHelpText(bid) });
            return res.sendStatus(200);
          }
          await finalizeParts(bid, data, chatId);
          return res.sendStatus(200);
        }

        if (requestType === "mechanic") {
          const accepted = parseYesNoFlag(fields.accept || "da");
          if (accepted === false) {
            clearFlow(bid.bidId);
            await telegramClient.sendMessage({
              chatId,
              text: `Ponuda je odbijena za zahtev #${bid.bidId}.`,
            });
            return res.sendStatus(200);
          }
          if (accepted === null) {
            await telegramClient.sendMessage({ chatId, text: buildHelpText(bid) });
            return res.sendStatus(200);
          }
          const data = {
            name: fields.name || bid.buyerName || bid.name || "",
            contact: fields.contact || bid.buyerContact || "",
          };
          if (!data.name || !data.contact) {
            await telegramClient.sendMessage({ chatId, text: buildHelpText(bid) });
            return res.sendStatus(200);
          }
          await finalizeMechanic(bid, data, chatId);
          return res.sendStatus(200);
        }

        const accepted = parseYesNoFlag(fields.accept || "da");
        if (accepted === false) {
          clearFlow(bid.bidId);
          await telegramClient.sendMessage({
            chatId,
            text: `Ponuda je odbijena za zahtev #${bid.bidId}.`,
          });
          return res.sendStatus(200);
        }
        if (accepted === null) {
          await telegramClient.sendMessage({ chatId, text: buildHelpText(bid) });
          return res.sendStatus(200);
        }

        const data = {
          name: fields.name || bid.buyerName || bid.name || "",
          contact: fields.contact || bid.buyerContact || "",
          address: fields.address || bid.buyerAddress || "",
          city: fields.city || bid.buyerCity || "",
          postalCode: fields.postalCode || bid.buyerPostalCode || "",
          note: fields.note || "",
        };

        if (!data.name || !data.contact) {
          await telegramClient.sendMessage({ chatId, text: buildHelpText(bid) });
          return res.sendStatus(200);
        }

        await finalizeRoadside(bid, data, chatId);
        return res.sendStatus(200);
      }

      await telegramClient.sendMessage({ chatId, text: buildHelpText(bid) });
      await sendActionKeyboard(chatId, bid);
      return res.sendStatus(200);
    } catch (err) {
      console.error(
        "Telegram webhook error:",
        err?.response?.data || err.message || err,
      );
      return res.sendStatus(200);
    }
  };

  return {
    verifySecret,
    handleWebhook,
  };
};
