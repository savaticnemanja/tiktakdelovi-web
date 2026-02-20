import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const OWNER_NUMBER = process.env.OWNER_NUMBER || "";
const COURIER_NUMBER = process.env.COURIER_NUMBER || "";

const parseBoolean = (value, fallback = false) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
};

const parseNumbers = (value) =>
  (value || [])
    .map((entry) => String(entry).trim())
    .filter(Boolean);

const loadPhoneNumbers = () => {
  try {
    const jsonPath = new URL("../../shared/phoneNumbers.json", import.meta.url);
    const raw = fs.readFileSync(jsonPath, "utf8");
    return JSON.parse(raw) || {};
  } catch (err) {
    console.error("Failed to load phoneNumbers.json:", err?.message || err);
    return {};
  }
};

const buildCityNumbers = (phoneData, field) =>
  Object.keys(phoneData || {}).reduce((acc, cityKey) => {
    const entry = phoneData?.[cityKey];
    acc[cityKey] = parseNumbers(entry?.[field]);
    return acc;
  }, {});

const buildCityNumbersByMake = (phoneData, field) =>
  Object.keys(phoneData || {}).reduce((acc, cityKey) => {
    const entry = phoneData?.[cityKey];
    const byMake = entry?.[field] || {};
    acc[cityKey] = Object.keys(byMake).reduce((makeAcc, makeKey) => {
      makeAcc[makeKey] = parseNumbers(byMake[makeKey]);
      return makeAcc;
    }, {});
    return acc;
  }, {});

const mergeCityNumbers = (numbersByCity) => {
  const merged = Object.values(numbersByCity).flat();
  return [...new Set(merged.filter(Boolean))];
};

const phoneData = loadPhoneNumbers();

const SELLER_NUMBERS_BY_CITY = buildCityNumbers(phoneData, "sellers");
const SELLER_NUMBERS_BY_CITY_BY_MAKE = buildCityNumbersByMake(
  phoneData,
  "sellersByMake",
);
const TOW_DRIVER_NUMBERS_BY_CITY = buildCityNumbers(phoneData, "towDrivers");
const MECHANIC_NUMBERS_BY_CITY = buildCityNumbers(phoneData, "mechanics");

const SELLER_NUMBERS = mergeCityNumbers(SELLER_NUMBERS_BY_CITY);
const TOW_DRIVER_NUMBERS = mergeCityNumbers(TOW_DRIVER_NUMBERS_BY_CITY);
const MECHANIC_NUMBERS = mergeCityNumbers(MECHANIC_NUMBERS_BY_CITY);

const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "";
const META_WEBHOOK_VERIFICATION_TOKEN =
  process.env.META_WEBHOOK_VERIFICATION_TOKEN || "";
const META_TEMPLATE_SELLER_INQUIRY = "parts_provider_inquiry";
const META_TEMPLATE_SELLER_NOTIFICATION = "parts_provider_notification";
const META_TEMPLATE_TOW_INQUIRY = "towing_operator_inquiry";
const META_TEMPLATE_ROADSIDE_INQUIRY = "towing_operator_inquiry";
const META_TEMPLATE_TOW_INQUIRY_FLOW_TITLE = "Kreiranje ponude";
const META_TEMPLATE_ROADSIDE_INQUIRY_FLOW_TITLE = "Kreiranje ponude";
const META_TEMPLATE_SELLER_INQUIRY_FLOW_TITLE = "Kreiranje ponude";
const META_TEMPLATE_MECHANIC_INQUIRY = "service_mechanic_inquiry";
const META_TEMPLATE_MECHANIC_INQUIRY_FLOW_TITLE = "Kreiranje ponude";
const META_TEMPLATE_LANGUAGE = "sr";
const META_TEMPLATE_BUYER_REVIEW = "parts_customer_review";
const META_TEMPLATE_BUYER_REVIEW_FLOW_TITLE = "Dodaj napomenu";
const META_TEMPLATE_BUYER_OFFER = "parts_customer_offer";
const META_TEMPLATE_BUYER_ROADSIDE_OFFER = "towing_customer_offer";
const META_TEMPLATE_BUYER_MECHANIC_OFFER = "service_customer_offer";
const META_TEMPLATE_BUYER_OFFER_FLOW_TITLE = "Podaci za dostavu";
const META_TEMPLATE_BUYER_ROADSIDE_OFFER_FLOW_TITLE = "Prihvati ponudu";
const META_TEMPLATE_BUYER_MECHANIC_OFFER_FLOW_TITLE = "Prihvati ponudu";
const META_TEMPLATE_OWNER_ROADSIDE_NOTIFICATION = "towing_owner_notification";
const META_TEMPLATE_ROADSIDE_NOTIFICATION = "towing_operator_notification";
const META_TEMPLATE_BUYER_ROADSIDE_NOTIFICATION = "towing_customer_notification";
const META_TEMPLATE_OWNER_NOTIFICATION = "parts_owner_notification";
const META_TEMPLATE_COURIER_NOTIFICATION = "parts_courier_notification";
const META_TEMPLATE_OWNER_NOTIFICATION_MECHANIC = "service_owner_notification";
const META_TEMPLATE_MECHANIC_NOTIFICATION = "service_mechanic_notification";
const META_TEMPLATE_BUYER_MECHANIC_NOTIFICATION = "service_customer_notification";
const META_TEMPLATE_PARTNERSHIP_OWNER_INQUIRY = "partnership_owner_inquiry";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

const SELLER_MARKUP_PERCENT = Number.isFinite(Number(process.env.SELLER_MARKUP_PERCENT))
  ? Number(process.env.SELLER_MARKUP_PERCENT)
  : 5;

const BID_ID_START = Number.isFinite(Number(process.env.BID_ID_START))
  ? Number(process.env.BID_ID_START)
  : 10001;

const BID_STORE_TTL_MS = Number.isFinite(Number(process.env.BID_STORE_TTL_HOURS))
  ? Number(process.env.BID_STORE_TTL_HOURS) * 60 * 60 * 1000
  : 72 * 60 * 60 * 1000;

const BUYER_INQUIRY_THROTTLE_SECONDS = Number.isFinite(
  Number(process.env.BUYER_INQUIRY_THROTTLE_SECONDS),
)
  ? Math.max(1, Number(process.env.BUYER_INQUIRY_THROTTLE_SECONDS))
  : 30;

const BUYER_INQUIRY_THROTTLE_MS = BUYER_INQUIRY_THROTTLE_SECONDS * 1000;

const BUYER_INQUIRY_IP_THROTTLE_ENABLED = parseBoolean(
  process.env.BUYER_INQUIRY_IP_THROTTLE_ENABLED,
  true,
);

const EXPRESS_TRUST_PROXY_HOPS = Number.isFinite(
  Number(process.env.EXPRESS_TRUST_PROXY_HOPS),
)
  ? Math.max(0, Number(process.env.EXPRESS_TRUST_PROXY_HOPS))
  : 1;

export const ENV = {
  OWNER_NUMBER,
  COURIER_NUMBER,
  SELLER_NUMBERS,
  TOW_DRIVER_NUMBERS,
  MECHANIC_NUMBERS,
  SELLER_NUMBERS_BY_CITY,
  SELLER_NUMBERS_BY_CITY_BY_MAKE,
  TOW_DRIVER_NUMBERS_BY_CITY,
  MECHANIC_NUMBERS_BY_CITY,
  META_WHATSAPP_TOKEN,
  META_PHONE_NUMBER_ID,
  META_WEBHOOK_VERIFICATION_TOKEN,
  META_TEMPLATE_SELLER_INQUIRY,
  META_TEMPLATE_SELLER_NOTIFICATION,
  META_TEMPLATE_TOW_INQUIRY,
  META_TEMPLATE_ROADSIDE_INQUIRY,
  META_TEMPLATE_TOW_INQUIRY_FLOW_TITLE,
  META_TEMPLATE_ROADSIDE_INQUIRY_FLOW_TITLE,
  META_TEMPLATE_SELLER_INQUIRY_FLOW_TITLE,
  META_TEMPLATE_MECHANIC_INQUIRY,
  META_TEMPLATE_MECHANIC_INQUIRY_FLOW_TITLE,
  META_TEMPLATE_LANGUAGE,
  META_TEMPLATE_BUYER_REVIEW,
  META_TEMPLATE_BUYER_REVIEW_FLOW_TITLE,
  META_TEMPLATE_BUYER_OFFER,
  META_TEMPLATE_BUYER_ROADSIDE_OFFER,
  META_TEMPLATE_BUYER_MECHANIC_OFFER,
  META_TEMPLATE_BUYER_OFFER_FLOW_TITLE,
  META_TEMPLATE_BUYER_ROADSIDE_OFFER_FLOW_TITLE,
  META_TEMPLATE_BUYER_MECHANIC_OFFER_FLOW_TITLE,
  META_TEMPLATE_OWNER_ROADSIDE_NOTIFICATION,
  META_TEMPLATE_ROADSIDE_NOTIFICATION,
  META_TEMPLATE_BUYER_ROADSIDE_NOTIFICATION,
  META_TEMPLATE_OWNER_NOTIFICATION,
  META_TEMPLATE_COURIER_NOTIFICATION,
  META_TEMPLATE_OWNER_NOTIFICATION_MECHANIC,
  META_TEMPLATE_MECHANIC_NOTIFICATION,
  META_TEMPLATE_BUYER_MECHANIC_NOTIFICATION,
  META_TEMPLATE_PARTNERSHIP_OWNER_INQUIRY,
  TELEGRAM_BOT_TOKEN,
  SELLER_MARKUP_PERCENT,
  BID_ID_START,
  BID_STORE_TTL_MS,
  BUYER_INQUIRY_THROTTLE_SECONDS,
  BUYER_INQUIRY_THROTTLE_MS,
  BUYER_INQUIRY_IP_THROTTLE_ENABLED,
  EXPRESS_TRUST_PROXY_HOPS,
};
