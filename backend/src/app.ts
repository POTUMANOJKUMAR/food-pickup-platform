import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import swaggerUi, { type JsonObject } from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerDocument } from "./config/swagger.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/logger.middleware.js";
import { apiRouter } from "./routes/index.js";

export const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.get("/api-docs.json", (_request, response) => response.json(swaggerDocument));
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument as JsonObject, { customSiteTitle: "Food Pickup API Docs" }),
  );

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(requestLogger);

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
