import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { Role } from "../../constants/roles.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { dashboardController } from "./controller.js";

export const dashboardRouter = Router();

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 todayOrders: { type: integer }
 *                 revenue: { type: number }
 *                 pendingOrders: { type: integer }
 *                 preparingOrders: { type: integer }
 *                 readyForPickup: { type: integer }
 *                 averageRating: { type: number }
 *                 walletBalance: { type: number }
 *                 cancelledOrders: { type: integer }
 */
dashboardRouter.get("/summary", authenticate, authorize(Role.RESTAURANT_OWNER, Role.ADMIN), asyncHandler(dashboardController.summary));

/**
 * @openapi
 * /dashboard/charts:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard charts
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Charts response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenueTrend: { type: array, items: { type: number } }
 *                 ordersTrend: { type: array, items: { type: integer } }
 *                 dateLabels: { type: array, items: { type: string } }
 */
dashboardRouter.get("/charts", authenticate, authorize(Role.RESTAURANT_OWNER, Role.ADMIN), asyncHandler(dashboardController.charts));
