import { Router } from "express";

export const createApiRouter = ({
  requestController,
  mechanicRequestController,
  towRequestController,
  partnershipController,
  healthController,
}) => {
  const router = Router();

  router.post("/request", requestController);
  router.post("/mechanic-request", mechanicRequestController);
  router.post("/tow-request", towRequestController);
  router.post("/partnership-inquiry", partnershipController);
  router.get("/health", healthController);

  return router;
};
