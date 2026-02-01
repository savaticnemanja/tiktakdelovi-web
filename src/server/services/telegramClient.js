import { sanitizeTelegramText, maskPhoneNumbers } from "../utils/sanitize.js";

export const createTelegramClient = ({ token }) => {
  if (!token) {
    return null;
  }

  const apiBase = `https://api.telegram.org/bot${token}`;
  const sanitize = (value) => sanitizeTelegramText(value);
  const sanitizeMasked = (value) => sanitize(maskPhoneNumbers(value));

  const sendMessage = async ({ chatId, text, mask = false }) => {
    if (!chatId || !text) {
      throw new Error("chatId and text are required.");
    }
    const payload = {
      chat_id: chatId,
      text: mask ? sanitizeMasked(text) : sanitize(text),
    };
    const resp = await fetch(`${apiBase}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const errBody = await resp.text();
      throw new Error(`Telegram sendMessage failed: ${errBody}`);
    }
    return resp.json();
  };

  const sendPhoto = async ({
    chatId,
    buffer,
    mimeType = "image/jpeg",
    filename = "image.jpg",
    caption,
    mask = false,
  }) => {
    if (!chatId || !buffer) {
      throw new Error("chatId and buffer are required.");
    }
    const form = new FormData();
    form.append("chat_id", chatId);
    if (caption) {
      form.append("caption", mask ? sanitizeMasked(caption) : sanitize(caption));
    }
    const blob = new Blob([buffer], { type: mimeType });
    form.append("photo", blob, filename);
    const resp = await fetch(`${apiBase}/sendPhoto`, {
      method: "POST",
      body: form,
    });
    if (!resp.ok) {
      const errBody = await resp.text();
      throw new Error(`Telegram sendPhoto failed: ${errBody}`);
    }
    return resp.json();
  };

  return {
    sendMessage,
    sendPhoto,
  };
};
