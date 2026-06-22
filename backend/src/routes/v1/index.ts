import { Router } from "express";
import { authRouter } from "../../modules/auth/routes.js";
import { categoryMenuRouter, menuRouter, restaurantMenuRouter } from "../../modules/menu/routes.js";
import { categoryRouter, restaurantCategoryRouter } from "../../modules/category/routes.js";
import { restaurantRouter } from "../../modules/restaurant/routes.js";
import { healthRouter } from "./health.routes.js";

export const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/restaurants", restaurantRouter);
v1Router.use("/restaurants/:restaurantId/categories", restaurantCategoryRouter);
v1Router.use("/restaurants/:restaurantId/menu", restaurantMenuRouter);
v1Router.use("/categories", categoryRouter);
v1Router.use("/categories/:categoryId/menu", categoryMenuRouter);
v1Router.use("/menu-items", menuRouter);
v1Router.use("/health", healthRouter);
