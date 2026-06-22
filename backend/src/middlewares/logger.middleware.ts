import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { logger } from "../config/logger.js";

export const requestLogger: RequestHandler = (request, response, next): void => {
  const requestIdHeader = request.headers["x-request-id"];
  const requestId = typeof requestIdHeader === "string" ? requestIdHeader : randomUUID();
  const startedAt = process.hrtime.bigint();

  response.setHeader("x-request-id", requestId);

  response.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const context = {
      requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    if (response.statusCode >= 500) {
      logger.error(context, "HTTP request completed");
    } else if (response.statusCode >= 400) {
      logger.warn(context, "HTTP request completed");
    } else {
      logger.info(context, "HTTP request completed");
    }
  });

  next();
};
