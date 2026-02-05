import dotenv from "dotenv";
import { CITY_KEYS } from "../../shared/cities.js";

dotenv.config();

const OWNER_NUMBER = process.env.OWNER_NUMBER || "";
const COURIER_NUMBER = process.env.COURIER_NUMBER || "";

const parseNumbers = (value) =>
  (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const buildCityNumbers = (suffix) =>
  CITY_KEYS.reduce((acc, cityKey) => {
    const envKey = `${cityKey.toUpperCase()}_${suffix}`;
    acc[cityKey] = parseNumbers(process.env[envKey]);
    return acc;
  }, {});

const mergeCityNumbers = (numbersByCity) => {
  const merged = Object.values(numbersByCity).flat();
  return [...new Set(merged.filter(Boolean))];
};

const SELLER_NUMBERS_BY_CITY = buildCityNumbers("SELLER_NUMBERS");
const TOW_DRIVER_NUMBERS_BY_CITY = buildCityNumbers("TOW_DRIVER_NUMBERS");
const MECHANIC_NUMBERS_BY_CITY = buildCityNumbers("MECHANIC_NUMBERS");

const SELLER_NUMBERS = mergeCityNumbers(SELLER_NUMBERS_BY_CITY);
const TOW_DRIVER_NUMBERS = mergeCityNumbers(TOW_DRIVER_NUMBERS_BY_CITY);
const MECHANIC_NUMBERS = mergeCityNumbers(MECHANIC_NUMBERS_BY_CITY);

const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "";
const META_WEBHOOK_VERIFICATION_TOKEN =
  process.env.META_WEBHOOK_VERIFICATION_TOKEN || "";
const META_TEMPLATE_SELLER_INQUIRY = "seller_inquiry";
const META_TEMPLATE_SELLER_NOTIFICATION = "seller_notification";
const META_TEMPLATE_TOW_INQUIRY = "tow_inquiry";
const META_TEMPLATE_ROADSIDE_INQUIRY = "roadside_inquiry";
const META_TEMPLATE_TOW_INQUIRY_FLOW_TITLE = "Kreiranje ponude";
const META_TEMPLATE_ROADSIDE_INQUIRY_FLOW_TITLE = "Kreiranje ponude";
const META_TEMPLATE_SELLER_INQUIRY_FLOW_TITLE = "Kreiranje ponude";
const META_TEMPLATE_MECHANIC_INQUIRY = "mechanic_inquiry";
const META_TEMPLATE_MECHANIC_INQUIRY_FLOW_TITLE = "Kreiranje ponude";
const META_TEMPLATE_LANGUAGE = "sr";
const META_TEMPLATE_BUYER_REVIEW = "buyer_review";
const META_TEMPLATE_BUYER_REVIEW_FLOW_TITLE = "Dodaj napomenu";
const META_TEMPLATE_BUYER_OFFER = "buyer_offer";
const META_TEMPLATE_BUYER_MECHANIC_OFFER = "buyer_mechanic_offer";
const META_TEMPLATE_BUYER_OFFER_FLOW_TITLE = "Podaci za dostavu";
const META_TEMPLATE_OWNER_NOTIFICATION = "owner_notification";
const META_TEMPLATE_COURIER_NOTIFICATION = "courier_notification";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";

const BID_ID_START = Number.isFinite(Number(process.env.BID_ID_START))
  ? Number(process.env.BID_ID_START)
  : 10001;

const BID_STORE_TTL_MS = Number.isFinite(Number(process.env.BID_STORE_TTL_HOURS))
  ? Number(process.env.BID_STORE_TTL_HOURS) * 60 * 60 * 1000
  : 72 * 60 * 60 * 1000;

export const ENV = {
  OWNER_NUMBER,
  COURIER_NUMBER,
  SELLER_NUMBERS,
  TOW_DRIVER_NUMBERS,
  MECHANIC_NUMBERS,
  SELLER_NUMBERS_BY_CITY,
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
  META_TEMPLATE_BUYER_MECHANIC_OFFER,
  META_TEMPLATE_BUYER_OFFER_FLOW_TITLE,
  META_TEMPLATE_OWNER_NOTIFICATION,
  META_TEMPLATE_COURIER_NOTIFICATION,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_SECRET,
  BID_ID_START,
  BID_STORE_TTL_MS,
};
