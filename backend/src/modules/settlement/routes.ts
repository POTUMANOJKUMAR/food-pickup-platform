import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { settlementController } from "./controller.js";
import {
  listSettlementsSchema,
  markSettlementPaidSchema,
  rejectSettlementSchema,
  requestSettlementSchema,
  settlementIdSchema,
} from "./validator.js";

export const settlementRouter = Router();

settlementRouter.use(authenticate, authorize(Role.RESTAURANT_OWNER, Role.ADMIN));

/**
 * @openapi
 * /settlements/request:
 *   post:
 *     tags: [Settlements]
 *     summary: Request restaurant settlement
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RequestSettlementInput' }
 *     responses:
 *       201: { description: Settlement requested }
 *       400: { description: Insufficient wallet balance }
 * /settlements:
 *   get:
 *     tags: [Settlements]
 *     summary: List settlements
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: restaurantId, schema: { type: string, format: uuid } }
 *       - { in: query, name: status, schema: { type: string, enum: [PENDING, APPROVED, PROCESSING, PAID, REJECTED] } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 100 } }
 *     responses:
 *       200:
 *         description: Paginated settlement list
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SettlementListResponse' }
 */
settlementRouter.post(
  "/request",
  authorize(Role.RESTAURANT_OWNER),
  validateRequest(requestSettlementSchema),
  asyncHandler(settlementController.request),
);
settlementRouter.get(
  "/",
  validateRequest(listSettlementsSchema),
  asyncHandler(settlementController.list),
);
settlementRouter.get("/summary", asyncHandler(settlementController.summary));

/**
 * @openapi
 * /settlements/summary:
 *   get:
 *     tags: [Settlements]
 *     summary: Get settlement summary
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Settlement summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availableToSettle: { type: number }
 *                 inTransit: { type: number }
 *                 settledThisMonth: { type: number }
 */

/**
 * @openapi
 * /settlements/{id}:
 *   get:
 *     tags: [Settlements]
 *     summary: Get settlement
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Settlement details }
 * /settlements/{id}/approve:
 *   put:
 *     tags: [Settlements]
 *     summary: Approve settlement
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Settlement approved }
 * /settlements/{id}/reject:
 *   put:
 *     tags: [Settlements]
 *     summary: Reject settlement and refund reserved balance
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RejectSettlementInput' }
 *     responses:
 *       200: { description: Settlement rejected }
 * /settlements/{id}/mark-paid:
 *   put:
 *     tags: [Settlements]
 *     summary: Mark settlement paid
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MarkSettlementPaidInput' }
 *     responses:
 *       200: { description: Settlement paid }
 */
settlementRouter.get(
  "/:id",
  validateRequest(settlementIdSchema),
  asyncHandler(settlementController.getById),
);
settlementRouter.put(
  "/:id/approve",
  authorize(Role.ADMIN),
  validateRequest(settlementIdSchema),
  asyncHandler(settlementController.approve),
);
settlementRouter.put(
  "/:id/reject",
  authorize(Role.ADMIN),
  validateRequest(rejectSettlementSchema),
  asyncHandler(settlementController.reject),
);
settlementRouter.put(
  "/:id/mark-paid",
  authorize(Role.ADMIN),
  validateRequest(markSettlementPaidSchema),
  asyncHandler(settlementController.markPaid),
);
