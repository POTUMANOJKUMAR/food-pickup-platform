import type { RequestHandler } from "express";
import type { z } from "zod";
import { AppError } from "../utils/app-error.js";

export interface RequestInput {
  body: unknown;
  params: unknown;
  query: unknown;
}

export const validateRequest = (schema: z.ZodType<RequestInput>): RequestHandler =>
  (request, _response, next): void => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query,
    });

    if (!result.success) {
      next(new AppError("Validation failed", 400));
      return;
    }

    next();
  };
