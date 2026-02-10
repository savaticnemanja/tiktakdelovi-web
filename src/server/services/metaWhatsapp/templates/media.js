import axios from "axios";

export const createMediaHandlers = ({
  token,
  phoneNumberId,
  sanitize,
  sanitizeMasked,
  withPlus,
}) => {
  const sendImageMessage = async ({ to, mediaId, caption, mask = false }) => {
    if (!token || !phoneNumberId) {
      throw new Error("Meta Cloud API not configured.");
    }
    if (!to || !mediaId) {
      throw new Error("to and mediaId are required.");
    }
    const url = `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`;
    const safeCaption = mask ? sanitizeMasked(caption) : sanitize(caption);
    const payload = {
      messaging_product: "whatsapp",
      to: withPlus(to),
      type: "image",
      image: {
        id: mediaId,
        caption: safeCaption || undefined,
      },
    };
    const metaResp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return { data: metaResp.data };
  };

  const getMediaUrl = async (mediaId) => {
    if (!token || !mediaId) {
      throw new Error("Meta Cloud API not configured or mediaId missing.");
    }
    const url = `https://graph.facebook.com/v24.0/${mediaId}`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp.data;
  };

  const downloadMedia = async (mediaId) => {
    if (!token || !mediaId) {
      throw new Error("Meta Cloud API not configured or mediaId missing.");
    }
    const mediaInfo = await axios.get(
      `https://graph.facebook.com/v24.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const mediaUrl = mediaInfo?.data?.url;
    const mimeType = mediaInfo?.data?.mime_type || "image/jpeg";
    if (!mediaUrl) {
      throw new Error("Media URL not found.");
    }
    const mediaResp = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "arraybuffer",
    });
    return { buffer: Buffer.from(mediaResp.data), mimeType };
  };

  return {
    sendImageMessage,
    getMediaUrl,
    downloadMedia,
  };
};
