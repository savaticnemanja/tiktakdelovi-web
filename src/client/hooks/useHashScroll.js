import { useEffect } from "react";

const scrollToHash = (hash, behavior) => {
  const id = decodeURIComponent(String(hash || "").replace(/^#/, ""));
  if (!id) return false;
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior, block: "start" });
  return true;
};

// In a SPA the target element does not exist yet when the browser tries to
// apply the URL hash on initial load, so the native scroll never happens.
// This re-applies the hash once React has rendered, and also handles in-page
// hash changes (e.g. clicking footer/header anchors).
export const useHashScroll = () => {
  useEffect(() => {
    if (!window.location.hash) return undefined;

    // Retry across a few frames so it works even if layout/fonts settle late.
    let attempts = 0;
    let frame;
    const tryScroll = () => {
      if (scrollToHash(window.location.hash, "auto") || attempts > 20) return;
      attempts += 1;
      frame = requestAnimationFrame(tryScroll);
    };
    frame = requestAnimationFrame(tryScroll);

    const onHashChange = () => scrollToHash(window.location.hash, "smooth");
    window.addEventListener("hashchange", onHashChange);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);
};
