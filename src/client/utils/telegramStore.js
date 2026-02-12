export const getTelegramStoreUrl = () => {
  if (typeof navigator === "undefined") {
    return "https://telegram.org/apps";
  }

  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) {
    return "https://play.google.com/store/apps/details?id=org.telegram.messenger";
  }
  if (/iPad|iPhone|iPod/i.test(ua)) {
    return "https://apps.apple.com/app/telegram-messenger/id686449807";
  }
  return "https://telegram.org/apps";
};
