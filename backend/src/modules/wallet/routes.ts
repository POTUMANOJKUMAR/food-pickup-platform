import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { walletController } from "./controller.js";
import { walletQuerySchema, walletTransactionsSchema } from "./validator.js";

export const walletRouter = Router();

walletRouter.use(authenticate, authorize(Role.RESTAURANT_OWNER, Role.ADMIN));

/**
 * @openapi
 * /wallet:
 *   get:
 *     tags: [Wallet]
 *     summary: Get restaurant wallet
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: restaurantId, schema: { type: string, format: uuid }, description: Required for admins; optional for restaurant owners with multiple restaurants. }
 *     responses:
 *       200:
 *         description: Restaurant wallet
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WalletResponse' }
 * /wallet/transactions:
 *   get:
 *     tags: [Wallet]
 *     summary: List wallet transactions
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: restaurantId, schema: { type: string, format: uuid } }
 *       - { in: query, name: transactionType, schema: { type: string, enum: [CREDIT, DEBIT, SETTLEMENT, COMMISSION] } }
 *       - { in: query, name: orderId, schema: { type: string, format: uuid } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 100 } }
 *     responses:
 *       200:
 *         description: Paginated wallet transactions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WalletTransactionListResponse' }
 * /wallet/summary:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet summary
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: restaurantId, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Wallet summary
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/WalletSummaryResponse' }
 */
walletRouter.get("/", validateRequest(walletQuerySchema), asyncHandler(walletController.get));
walletRouter.get(
  "/transactions",
  validateRequest(walletTransactionsSchema),
  asyncHandler(walletController.transactions),
);
walletRouter.get(
  "/summary",
  validateRequest(walletQuerySchema),
  asyncHandler(walletController.summary),
);
walletRouter.get(
  "/analytics",
  validateRequest(walletQuerySchema),
  asyncHandler(walletController.analytics),
);
walletRouter.get(
  "/revenue-chart",
  validateRequest(walletQuerySchema),
  asyncHandler(walletController.revenueChart),
);

/**
 * @openapi
 * /wallet/analytics:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet analytics
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: restaurantId, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Wallet analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availableBalance: { type: number }
 *                 pendingBalance: { type: number }
 *                 lifetimeEarnings: { type: number }
 *                 ordersThisWeek: { type: integer }
 *                 averageOrderValue: { type: number }
 *                 commissionPaid: { type: number }
 */

/**
 * @openapi
 * /wallet/revenue-chart:
 *   get:
 *     tags: [Wallet]
 *     summary: Get wallet revenue chart
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: restaurantId, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Revenue chart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 labels: { type: array, items: { type: string } }
 *                 values: { type: array, items: { type: number } }
 */
