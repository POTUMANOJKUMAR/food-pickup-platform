import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { orderController } from "./controller.js";
import { createOrderSchema, listOrdersSchema, orderIdSchema, updateOrderStatusSchema } from "./validator.js";

export const orderRouter = Router();

orderRouter.use(authenticate);

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create order from active cart
 *     description: Creates an order in the pending-payment business state and triggers ORDER_CREATED for the customer. Restaurant owners are not notified until payment succeeds.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OrderResponse' }
 *   get:
 *     tags: [Orders]
 *     summary: List orders
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: status, schema: { type: string, enum: [PENDING, CONFIRMED, PREPARING, READY_FOR_PICKUP, COMPLETED, CANCELLED] } }
 *     responses:
 *       200:
 *         description: Order list
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OrderListResponse' }
 */
orderRouter.post(
  "/",
  authorize(Role.USER),
  validateRequest(createOrderSchema),
  asyncHandler(orderController.create),
);
orderRouter.get(
  "/",
  authorize(Role.USER, Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(listOrdersSchema),
  asyncHandler(orderController.list),
);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order details
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OrderResponse' }
 */
orderRouter.get(
  "/:id",
  authorize(Role.USER, Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(orderIdSchema),
  asyncHandler(orderController.getById),
);

/**
 * @openapi
 * /orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Update order status
 *     description: Triggers customer notifications for CONFIRMED, PREPARING, READY_FOR_PICKUP, and COMPLETED. READY_FOR_PICKUP notifications include the pickup code.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateOrderStatusInput' }
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OrderResponse' }
 */
orderRouter.put(
  "/:id/status",
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(updateOrderStatusSchema),
  asyncHandler(orderController.updateStatus),
);

/**
 * @openapi
 * /orders/{id}/cancel:
 *   put:
 *     tags: [Orders]
 *     summary: Cancel order
 *     description: Triggers ORDER_CANCELLED for the customer.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Order cancelled
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OrderResponse' }
 */
orderRouter.put(
  "/:id/cancel",
  authorize(Role.USER, Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(orderIdSchema),
  asyncHandler(orderController.cancel),
);
