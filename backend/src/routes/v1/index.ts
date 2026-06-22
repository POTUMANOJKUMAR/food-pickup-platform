import { Router } from "express";
import { authRouter } from "../../modules/auth/routes.js";
import { restaurantRouter } from "../../modules/restaurant/routes.js";
import { healthRouter } from "./health.routes.js";

export const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/restaurants", restaurantRouter);
v1Router.use("/health", healthRouter);
