import { normalizePhone } from "../../../utils/phone.js";

const toPositiveMs = (value, fallbackMs) => {
  if (!Number.isFinite(Number(value))) return fallbackMs;
  return Math.max(1, Number(value));
};

const toSeconds = (ms) => Math.max(1, Math.ceil(ms / 1000));

const pruneExpired = (map, nowMs) => {
  for (const [key, expiresAt] of map.entries()) {
    if (expiresAt <= nowMs) {
      map.delete(key);
    }
  }
};

export const createInquiryThrottle = ({ windowMs, ipEnabled = true }) => {
  const cooldownMs = toPositiveMs(windowMs, 30_000);
  const customerStore = new Map();
  const ipStore = new Map();

  const makeKey = (scope, identity) => `${scope}:${identity}`;

  return {
    checkAndHit: ({ scope, customerNumber, ip }) => {
      const nowMs = Date.now();
      pruneExpired(customerStore, nowMs);
      pruneExpired(ipStore, nowMs);

      const normalizedScope = String(scope || "default").trim().toLowerCase();
      const normalizedCustomer = normalizePhone(customerNumber);
      const normalizedIp = String(ip || "").trim();

      const customerKey = normalizedCustomer
        ? makeKey(normalizedScope, normalizedCustomer)
        : "";
      const ipKey =
        ipEnabled && normalizedIp ? makeKey(normalizedScope, normalizedIp) : "";

      const customerExpiresAt = customerKey ? customerStore.get(customerKey) || 0 : 0;
      const ipExpiresAt = ipKey ? ipStore.get(ipKey) || 0 : 0;

      if (customerExpiresAt > nowMs) {
        const retryAfterMs = customerExpiresAt - nowMs;
        return {
          blocked: true,
          blockedBy: "customer",
          retryAfterMs,
          retryAfterSeconds: toSeconds(retryAfterMs),
        };
      }

      if (ipExpiresAt > nowMs) {
        const retryAfterMs = ipExpiresAt - nowMs;
        return {
          blocked: true,
          blockedBy: "ip",
          retryAfterMs,
          retryAfterSeconds: toSeconds(retryAfterMs),
        };
      }

      const nextWindowExpiresAt = nowMs + cooldownMs;
      if (customerKey) {
        customerStore.set(customerKey, nextWindowExpiresAt);
      }
      if (ipKey) {
        ipStore.set(ipKey, nextWindowExpiresAt);
      }

      return {
        blocked: false,
        blockedBy: null,
        retryAfterMs: 0,
        retryAfterSeconds: 0,
      };
    },
  };
};
