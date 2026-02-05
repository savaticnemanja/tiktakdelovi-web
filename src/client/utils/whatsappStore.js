export const getWhatsAppStoreUrl = () => {
  if (typeof navigator === "undefined") {
    return "https://www.whatsapp.com/download";
  }

  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) {
    return "https://play.google.com/store/apps/details?id=com.whatsapp";
  }
  if (/iPad|iPhone|iPod/i.test(ua)) {
    return "https://apps.apple.com/app/whatsapp-messenger/id310633997";
  }
  return "https://www.whatsapp.com/download";
};
