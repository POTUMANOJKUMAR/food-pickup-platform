import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: "food-pickup-platform-backend",
    environment: env.NODE_ENV,
  },
  redact: {
    paths: ["req.headers.authorization", "authorization", "password", "otp", "token", "refreshToken"],
    censor: "[REDACTED]",
  },
});
