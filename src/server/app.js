import fs from "fs";
import express from "express";
import cors from "cors";

import { ENV } from "./config/env.js";
import { paths } from "./config/paths.js";
import { loadScrapedModels } from "./services/modelsCache.js";
import { createBidStore } from "./stores/bidStore.js";
import { createMessageBidMap } from "./stores/messageBidMap.js";
import { createMetaClient } from "./services/metaWhatsapp.js";
import { createModelsController } from "./controllers/modelsController.js";
import { createRequestController } from "./controllers/requestController.js";
import { createWebhookController } from "./controllers/webhookController.js";
import { createHealthController } from "./controllers/healthController.js";
import { createApiRouter } from "./routes/api.js";
import { createWebhookRouter } from "./routes/webhook.js";

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const scrapedModels = loadScrapedModels(paths.modelsPath);
  const bidStore = createBidStore({
    ttlMs: ENV.BID_STORE_TTL_MS,
    idStart: ENV.BID_ID_START_SAFE,
  });
  const messageToBid = createMessageBidMap();

  const metaClient = createMetaClient({
    token: ENV.META_WHATSAPP_TOKEN,
    phoneNumberId: ENV.META_PHONE_NUMBER_ID,
    templateName: ENV.META_TEMPLATE_NAME,
    templateLanguage: ENV.META_TEMPLATE_LANGUAGE,
    templateOfferName: ENV.META_TEMPLATE_OFFER_NAME,
    templateOwnerName: ENV.META_TEMPLATE_OWNER_NAME,
    flowScreen: ENV.META_FLOW_SCREEN,
    flowButtonIndex: ENV.META_FLOW_BUTTON_INDEX,
    messageToBid,
  });

  const modelsController = createModelsController({ scrapedModels });
  const requestController = createRequestController({
    sellerNumbers: ENV.SELLER_NUMBERS,
    bidStore,
    metaClient,
    templateName: ENV.META_TEMPLATE_NAME,
  });
  const healthController = createHealthController({ provider: ENV.PROVIDER });

  const webhookController = createWebhookController({
    bidStore,
    messageToBid,
    metaClient,
    ownerNumber: ENV.OWNER_NUMBER,
    verifyToken: ENV.META_WEBHOOK_VERIFY_TOKEN,
  });

  app.use("/api", createApiRouter({
    modelsController,
    requestController,
    healthController,
  }));
  app.use("/webhook", createWebhookRouter({ webhookController }));

  if (fs.existsSync(paths.distPath)) {
    app.use(express.static(paths.distPath));
    app.get("*", (req, res) => {
      const indexPath = `${paths.distPath}/index.html`;
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
