import { Router } from "express";

export const createApiRouter = ({ requestController, healthController }) => {
  const router = Router();

  router.post("/request", requestController);
  router.get("/health", healthController);

  return router;
};
