import { Router } from "express";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess } from "../../utils/api-response.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_request, response): Promise<void> => {
    await prisma.$queryRaw`SELECT 1`;

    sendSuccess(response, {
      status: "healthy",
      database: "connected",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }),
);
