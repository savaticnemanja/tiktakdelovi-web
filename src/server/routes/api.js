import { Router } from "express";

export const createApiRouter = ({ requestController, towRequestController, healthController }) => {
  const router = Router();

  router.post("/request", requestController);
  router.post("/tow-request", towRequestController);
  router.get("/health", healthController);

  return router;
};
