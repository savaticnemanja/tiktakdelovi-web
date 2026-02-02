import fs from "fs";
import express from "express";
import cors from "cors";

import { ENV } from "./config/env.js";
import { createBidStore } from "./stores/bidStore.js";
import { createMessageBidMap } from "./stores/messageBidMap.js";
import { createMetaClient } from "./services/metaWhatsapp.js";
import { createRequestController } from "./controllers/requestController.js";
import { createTowRequestController } from "./controllers/towRequestController.js";
import { createWebhookController } from "./controllers/webhookController.js";
import { createHealthController } from "./controllers/healthController.js";
import { createTelegramController } from "./controllers/telegramController.js";
import { createApiRouter } from "./routes/api.js";
import { createWebhookRouter } from "./routes/webhook.js";
import { createRequestLogger } from "./services/requestLogger.js";
import { createMetaLogger } from "./services/metaLogger.js";
import { createTelegramClient } from "./services/telegramClient.js";

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const logsDir = new URL("../../logs", import.meta.url).pathname;
  const { apiLogger, webhookLogger, getApiLogs, getWebhookLogs } =
    createRequestLogger({ logsDir });
  const { logError: logMetaError, getMetaLogs } = createMetaLogger({ logsDir });

  const bidStore = createBidStore({
    ttlMs: ENV.BID_STORE_TTL_MS,
    idStart: ENV.BID_ID_START,
  });
  const messageToBid = createMessageBidMap();

  const metaClient = createMetaClient({
    token: ENV.META_WHATSAPP_TOKEN,
    phoneNumberId: ENV.META_PHONE_NUMBER_ID,
    templateSellerInquiry: ENV.META_TEMPLATE_SELLER_INQUIRY,
    templateSellerNotification: ENV.META_TEMPLATE_SELLER_NOTIFICATION,
    templateSellerInquiryFlowTitle: ENV.META_TEMPLATE_SELLER_INQUIRY_FLOW_TITLE,
    templateBuyerReview: ENV.META_TEMPLATE_BUYER_REVIEW,
    templateBuyerReviewFlowTitle: ENV.META_TEMPLATE_BUYER_REVIEW_FLOW_TITLE,
    templateLanguage: ENV.META_TEMPLATE_LANGUAGE,
    templateBuyerOffer: ENV.META_TEMPLATE_BUYER_OFFER,
    templateBuyerOfferFlowTitle: ENV.META_TEMPLATE_BUYER_OFFER_FLOW_TITLE,
    templateOwnerNotification: ENV.META_TEMPLATE_OWNER_NOTIFICATION,
    templateCourierNotification: ENV.META_TEMPLATE_COURIER_NOTIFICATION,
    templateTowInquiry: ENV.META_TEMPLATE_TOW_INQUIRY,
    templateRoadsideInquiry: ENV.META_TEMPLATE_ROADSIDE_INQUIRY,
    templateTowInquiryFlowTitle: ENV.META_TEMPLATE_TOW_INQUIRY_FLOW_TITLE,
    templateRoadsideInquiryFlowTitle: ENV.META_TEMPLATE_ROADSIDE_INQUIRY_FLOW_TITLE,
    messageToBid,
    metaLogger: { logError: logMetaError },
  });
  const telegramClient = createTelegramClient({
    token: ENV.TELEGRAM_BOT_TOKEN,
  });

  const requestController = createRequestController({
    sellerNumbers: ENV.SELLER_NUMBERS,
    bidStore,
    metaClient,
    templateName: ENV.META_TEMPLATE_SELLER_INQUIRY,
  });
  const towRequestController = createTowRequestController({
    towDriverNumbers: ENV.TOW_DRIVER_NUMBERS,
    bidStore,
    metaClient,
    templateTowInquiry: ENV.META_TEMPLATE_TOW_INQUIRY,
    templateRoadsideInquiry: ENV.META_TEMPLATE_ROADSIDE_INQUIRY,
    templateTowInquiryFlowTitle: ENV.META_TEMPLATE_TOW_INQUIRY_FLOW_TITLE,
    templateRoadsideInquiryFlowTitle: ENV.META_TEMPLATE_ROADSIDE_INQUIRY_FLOW_TITLE,
  });
  const healthController = createHealthController();

  const webhookController = createWebhookController({
    bidStore,
    messageToBid,
    metaClient,
    telegramClient,
    ownerNumber: ENV.OWNER_NUMBER,
    courierNumber: ENV.COURIER_NUMBER,
    sellerNumbers: ENV.SELLER_NUMBERS,
    verifyToken: ENV.META_WEBHOOK_VERIFICATION_TOKEN,
  });
  const telegramController = createTelegramController({
    bidStore,
    telegramClient,
    metaClient,
  });

  app.use("/api", apiLogger, createApiRouter({
    requestController,
    towRequestController,
    healthController,
  }));
  app.use("/webhook", webhookLogger, createWebhookRouter({ webhookController }));
  app.post(
    "/telegram/webhook",
    telegramController.verifySecret,
    telegramController.handleWebhook,
  );

  app.get("/logs/api", getApiLogs);
  app.get("/logs/webhook", getWebhookLogs);
  app.get("/logs/meta", getMetaLogs);

  const distPath = new URL("../../dist", import.meta.url).pathname;
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = `${distPath}/index.html`;
      if (!fs.existsSync(indexPath)) {
        return res.status(404).send("Frontend not built");
      }
      return res.sendFile(indexPath);
    });
  } else {
    console.warn(
      "dist/ not found; frontend assets will not be served (expected in production).",
    );
  }

  return app;
};
