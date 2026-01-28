import { Router } from "express";

export const createWebhookRouter = ({ webhookController }) => {
  const router = Router();

  router.get("/", webhookController.verifyWebhook);
  router.post("/", webhookController.handleWebhook);

  return router;
};
