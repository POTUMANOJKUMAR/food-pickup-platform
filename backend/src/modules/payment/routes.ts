import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { paymentController } from "./controller.js";
import { createPaymentOrderSchema, paymentHistorySchema, verifyPaymentSchema } from "./validator.js";

export const paymentRouter = Router();

paymentRouter.use(authenticate, authorize(Role.USER, Role.ADMIN));

/**
 * @openapi
 * /payments/create-order:
 *   post:
 *     tags: [Payments]
 *     summary: Create Razorpay order
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreatePaymentOrderInput' }
 *     responses:
 *       201:
 *         description: Razorpay order created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RazorpayOrderResponse' }
 */
paymentRouter.post(
  "/create-order",
  validateRequest(createPaymentOrderSchema),
  asyncHandler(paymentController.createOrder),
);

/**
 * @openapi
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify Razorpay payment
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VerifyPaymentInput' }
 *     responses:
 *       200:
 *         description: Payment verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentResponse' }
 */
paymentRouter.post(
  "/verify",
  validateRequest(verifyPaymentSchema),
  asyncHandler(paymentController.verify),
);

/**
 * @openapi
 * /payments/history:
 *   get:
 *     tags: [Payments]
 *     summary: Payment history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: status, schema: { type: string, enum: [PENDING, SUCCESS, FAILED, REFUNDED] } }
 *     responses:
 *       200:
 *         description: Payment history
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentListResponse' }
 */
paymentRouter.get(
  "/history",
  validateRequest(paymentHistorySchema),
  asyncHandler(paymentController.history),
);
