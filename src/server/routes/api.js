import { Router } from "express";

export const createApiRouter = ({
  modelsController,
  requestController,
  healthController,
}) => {
  const router = Router();

  router.get("/models", modelsController);
  router.post("/request", requestController);
  router.get("/health", healthController);

  return router;
};
