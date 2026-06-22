import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/app-error.js";
import { sendError } from "../utils/api-response.js";

export const notFoundHandler: RequestHandler = (request, _response, next): void => {
  next(new AppError(`Route ${request.method} ${request.originalUrl} not found`, 404));
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Something went wrong";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = error.code === "P2025" ? 404 : 409;
    message = error.code === "P2025" ? "Resource not found" : "Database request conflict";
  }

  const logContext = {
    error,
    method: request.method,
    path: request.originalUrl,
    statusCode,
  };

  if (statusCode >= 500) {
    logger.error(logContext, "Request failed");
  } else {
    logger.warn(logContext, "Request rejected");
  }

  sendError(response, message, statusCode);
};
