import test from "node:test";
import assert from "node:assert/strict";

import { createSellerTemplates } from "../src/server/services/metaWhatsapp/templates/seller.js";
import { createMechanicTemplates } from "../src/server/services/metaWhatsapp/templates/mechanic.js";
import { createTowTemplates } from "../src/server/services/metaWhatsapp/templates/tow.js";
import { createOwnerTemplates } from "../src/server/services/metaWhatsapp/templates/owner.js";

const identity = (value) => value;
const sanitizeOrDash = (value) => value ?? "-";
const sanitizeMasked = (value) => (value == null ? value : `**${value}**`);

const makeContext = () => {
  const calls = [];
  const sendTemplate = async (payload) => {
    calls.push(payload);
    return { data: { messages: [{ id: "msg-1" }] } };
  };
  return {
    calls,
    messageToBid: new Map(),
    sendTemplate,
  };
};

const getParams = (component) => component?.parameters ?? [];
const getNames = (params) => params.map((param) => param.parameter_name);

const assertHeaderBody = (payload, headerNames, bodyNames) => {
  const [header, body] = payload.components;
  assert.equal(header.type, "header");
  assert.deepEqual(getNames(getParams(header)), headerNames);
  assert.equal(body.type, "body");
  assert.deepEqual(getNames(getParams(body)), bodyNames);
};

test("seller inquiry template components", async () => {
  const { calls, messageToBid, sendTemplate } = makeContext();
  const { sendInquiryToSeller } = createSellerTemplates({
    sendTemplate,
    sanitize: identity,
    sanitizeMasked,
    sanitizeOrDash,
    templateSellerInquiry: "seller_inquiry",
    templateSellerInquiryFlowTitle: "seller_flow",
    templateSellerNotification: "seller_notification",
    messageToBid,
  });

  await sendInquiryToSeller({
    to: "+123",
    bidId: "BID-1",
    bidMessage: "Need parts",
    make: "Toyota",
    model: "Corolla",
    year: "2020",
    fuelType: "Gas",
    chassis: "XYZ",
  });

  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.equal(payload.template, "seller_inquiry");
  assertHeaderBody(
    payload,
    ["bid_id"],
    ["make", "model", "year", "fuel_type", "chassis", "bid_message"],
  );
  assert.equal(payload.components[2].type, "button");
  assert.equal(payload.components[2].sub_type, "flow");
  assert.equal(messageToBid.get("msg-1").kind, "seller_inquiry");
});

test("seller notification template components", async () => {
  const { calls, sendTemplate } = makeContext();
  const { sendNotifySeller } = createSellerTemplates({
    sendTemplate,
    sanitize: identity,
    sanitizeMasked,
    sanitizeOrDash,
    templateSellerInquiry: "seller_inquiry",
    templateSellerInquiryFlowTitle: "seller_flow",
    templateSellerNotification: "seller_notification",
  });

  await sendNotifySeller({ to: "+123", bidId: "BID-2" });

  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.equal(payload.template, "seller_notification");
  assertHeaderBody(payload, ["bid_id"], ["bid_id"]);
});

test("mechanic inquiry template components", async () => {
  const { calls, messageToBid, sendTemplate } = makeContext();
  const { sendInquiryToMechanic } = createMechanicTemplates({
    sendTemplate,
    sanitize: identity,
    sanitizeMasked,
    sanitizeOrDash,
    templateMechanicInquiry: "mech_inquiry",
    templateMechanicInquiryFlowTitle: "mech_flow",
    templateMechanicNotification: "mech_notification",
    messageToBid,
  });

  await sendInquiryToMechanic({
    to: "+123",
    bidId: "BID-3",
    bidMessage: "Need repair",
    make: "Honda",
    model: "Civic",
    year: "2019",
    fuelType: "Gas",
    chassis: "ABC",
  });

  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.equal(payload.template, "mech_inquiry");
  assertHeaderBody(
    payload,
    ["bid_id"],
    ["make", "model", "year", "fuel_type", "chassis", "bid_message"],
  );
  assert.equal(payload.components[2].sub_type, "flow");
  assert.equal(messageToBid.get("msg-1").kind, "mechanic_inquiry");
});

test("mechanic notification template components", async () => {
  const { calls, sendTemplate } = makeContext();
  const { sendMechanicNotification } = createMechanicTemplates({
    sendTemplate,
    sanitize: identity,
    sanitizeMasked,
    sanitizeOrDash,
    templateMechanicInquiry: "mech_inquiry",
    templateMechanicInquiryFlowTitle: "mech_flow",
    templateMechanicNotification: "mech_notification",
  });

  await sendMechanicNotification({
    to: "+123",
    bidId: "BID-4",
    buyerName: "Alex",
    buyerContact: "+999",
    bidDetails: "Oil change",
  });

  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.equal(payload.template, "mech_notification");
  assertHeaderBody(
    payload,
    ["bid_id"],
    ["bid_id", "buyer_name", "buyer_contact", "bid_details"],
  );
});

test("tow inquiry template components", async () => {
  const { calls, messageToBid, sendTemplate } = makeContext();
  const { sendTowInquiry } = createTowTemplates({
    sendTemplate,
    sanitize: identity,
    sanitizeMasked,
    sanitizeOrDash,
    templateRoadsideNotification: "roadside_notification",
    messageToBid,
  });

  await sendTowInquiry({
    to: "+123",
    bidId: "BID-5",
    locationFrom: "A",
    locationTo: "B",
    details: "Flat tire",
    templateName: "tow_inquiry",
    flowTitle: "tow_flow",
  });

  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.equal(payload.template, "tow_inquiry");
  assertHeaderBody(payload, ["bid_id"], ["location", "details"]);
  assert.equal(payload.components[2].sub_type, "flow");
  assert.equal(messageToBid.get("msg-1").kind, "tow_inquiry");
});

test("roadside notification template components", async () => {
  const { calls, sendTemplate } = makeContext();
  const { sendRoadsideNotification } = createTowTemplates({
    sendTemplate,
    sanitize: identity,
    sanitizeMasked,
    sanitizeOrDash,
    templateRoadsideNotification: "roadside_notification",
  });

  await sendRoadsideNotification({
    to: "+123",
    bidId: "BID-6",
    buyerName: "Sam",
    buyerContact: "+101",
    location: "Downtown",
  });

  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.equal(payload.template, "roadside_notification");
  assertHeaderBody(
    payload,
    ["bid_id"],
    ["bid_id", "buyer_name", "buyer_contact", "location"],
  );
});

test("owner notification template components", async () => {
  const { calls, messageToBid, sendTemplate } = makeContext();
  const { sendOfferToOwner } = createOwnerTemplates({
    sendTemplate,
    sanitize: identity,
    sanitizeMasked,
    sanitizeOrDash,
    templateOwnerNotification: "owner_notification",
    templateCourierNotification: "courier_notification",
    templateOwnerNotificationMechanic: "owner_mech_notification",
    templateOwnerRoadsideNotification: "owner_roadside_notification",
    messageToBid,
  });

  await sendOfferToOwner({
    to: "+123",
    bidId: "BID-7",
    make: "Ford",
    model: "Focus",
    year: "2018",
    fuelType: "Diesel",
    chassis: "CH-1",
    buyerName: "Jamie",
    buyerAddress: "123 St",
    buyerCity: "Town",
    buyerPostalCode: "12345",
    buyerContact: "+555",
    bidMessage: "Offer",
    sellerNumber: "+777",
    bidOffer: "250",
  });

  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.equal(payload.template, "owner_notification");
  assertHeaderBody(
    payload,
    ["bid_id"],
    [
      "make",
      "model",
      "year",
      "fuel_type",
      "chassis",
      "buyer_name",
      "buyer_address",
      "buyer_city",
      "buyer_postal_code",
      "buyer_contact",
      "bid_message",
      "seller_contact",
      "bid_offer",
    ],
  );
  assert.equal(payload.components[2].sub_type, "quick_reply");
  assert.equal(payload.components[3].sub_type, "quick_reply");
  assert.equal(messageToBid.get("msg-1").kind, "owner_notification");
});

test("owner notification mechanic template components", async () => {
  const { calls, messageToBid, sendTemplate } = makeContext();
  const { sendOfferToOwnerMechanic } = createOwnerTemplates({
    sendTemplate,
    sanitize: identity,
    sanitizeMasked,
    sanitizeOrDash,
    templateOwnerNotification: "owner_notification",
    templateCourierNotification: "courier_notification",
    templateOwnerNotificationMechanic: "owner_mech_notification",
    templateOwnerRoadsideNotification: "owner_roadside_notification",
    messageToBid,
  });

  await sendOfferToOwnerMechanic({
    to: "+123",
    bidId: "BID-8",
    make: "BMW",
    model: "X1",
    year: "2021",
    fuelType: "Gas",
    chassis: "CH-2",
    buyerName: "Drew",
    buyerContact: "+222",
    bidDetails: "Diagnostics",
    mechanicContact: "+333",
    bidOffer: "300",
    bidDate: "2026-02-11",
    bidTime: "10:00",
    bidNote: "Notes",
  });

  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.equal(payload.template, "owner_mech_notification");
  assertHeaderBody(
    payload,
    ["bid_id"],
    [
      "make",
      "model",
      "year",
      "fuel_type",
      "chassis",
      "buyer_name",
      "buyer_contact",
      "bid_details",
      "mechanic_contact",
      "bid_offer",
      "bid_date",
      "bid_time",
      "bid_note",
    ],
  );
  assert.equal(payload.components[2].sub_type, "quick_reply");
  assert.equal(payload.components[3].sub_type, "quick_reply");
  assert.equal(messageToBid.get("msg-1").kind, "owner_notification_mechanic");
});

test("owner roadside notification template components", async () => {
  const { calls, sendTemplate } = makeContext();
  const { sendOwnerRoadsideNotification } = createOwnerTemplates({
    sendTemplate,
    sanitize: identity,
    sanitizeMasked,
    sanitizeOrDash,
    templateOwnerNotification: "owner_notification",
    templateCourierNotification: "courier_notification",
    templateOwnerNotificationMechanic: "owner_mech_notification",
    templateOwnerRoadsideNotification: "owner_roadside_notification",
  });

  await sendOwnerRoadsideNotification({
    to: "+123",
    bidId: "BID-9",
    roadsideOrTow: "Tow",
    location: "Highway",
    buyerName: "Taylor",
    buyerContact: "+444",
    details: "Engine",
    roadsideContact: "+555",
    bidOffer: "500",
  });

  assert.equal(calls.length, 1);
  const payload = calls[0];
  assert.equal(payload.template, "owner_roadside_notification");
  assertHeaderBody(
    payload,
    ["bid_id"],
    [
      "location",
      "details",
      "buyer_name",
      "buyer_contact",
      "roadside_or_tow",
      "roadside_contact",
      "bid_offer",
    ],
  );
});
