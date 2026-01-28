import dotenv from "dotenv";

dotenv.config();

const PROVIDER = process.env.PROVIDER || "meta";

const META_WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "";
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || "";
const META_TEMPLATE_NAME = process.env.META_TEMPLATE_NAME || "seller_inquiry";
const META_TEMPLATE_LANGUAGE = process.env.META_TEMPLATE_LANGUAGE || "en_US";
const META_TEMPLATE_OFFER_NAME =
  process.env.META_TEMPLATE_OFFER_NAME || "bid_offer_to_buyer";
const META_TEMPLATE_OWNER_NAME =
  process.env.META_TEMPLATE_OWNER_NAME || "bid_offer_to_owner";
const META_WEBHOOK_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "";
const META_FLOW_SCREEN = process.env.META_FLOW_SCREEN || "Podaci za dostavu";
const META_FLOW_BUTTON_INDEX = process.env.META_FLOW_BUTTON_INDEX || "0";

const OWNER_NUMBER = process.env.OWNER_NUMBER || "";

const BID_STORE_TTL_HOURS = Number(process.env.BID_STORE_TTL_HOURS || "72");
const BID_STORE_TTL_MS = Number.isFinite(BID_STORE_TTL_HOURS)
  ? BID_STORE_TTL_HOURS * 60 * 60 * 1000
  : 72 * 60 * 60 * 1000;

const BID_ID_START = Number(process.env.BID_ID_START || "10001");
const BID_ID_START_SAFE = Number.isFinite(BID_ID_START) ? BID_ID_START : 10001;

const SELLER_NUMBERS = (process.env.SELLER_NUMBERS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const ENV = {
  PROVIDER,
  META_WHATSAPP_TOKEN,
  META_PHONE_NUMBER_ID,
  META_TEMPLATE_NAME,
  META_TEMPLATE_LANGUAGE,
  META_TEMPLATE_OFFER_NAME,
  META_TEMPLATE_OWNER_NAME,
  META_WEBHOOK_VERIFY_TOKEN,
  META_FLOW_SCREEN,
  META_FLOW_BUTTON_INDEX,
  OWNER_NUMBER,
  BID_STORE_TTL_MS,
  BID_ID_START_SAFE,
  SELLER_NUMBERS,
};
