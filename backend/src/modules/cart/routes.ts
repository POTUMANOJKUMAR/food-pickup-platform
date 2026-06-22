import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { cartController } from "./controller.js";
import { addCartItemSchema, cartItemIdSchema, getCartSchema, updateCartItemSchema } from "./validator.js";

export const cartRouter = Router();

cartRouter.use(authenticate, authorize(Role.USER));

/**
 * @openapi
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get active cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Active cart
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CartResponse' }
 */
cartRouter.get("/", validateRequest(getCartSchema), asyncHandler(cartController.get));

/**
 * @openapi
 * /cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddCartItemInput' }
 *     responses:
 *       201:
 *         description: Cart item added
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CartResponse' }
 */
cartRouter.post(
  "/items",
  validateRequest(addCartItemSchema),
  asyncHandler(cartController.addItem),
);

/**
 * @openapi
 * /cart/items/{itemId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCartItemInput' }
 *     responses:
 *       200:
 *         description: Cart item updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CartResponse' }
 *   delete:
 *     tags: [Cart]
 *     summary: Remove cart item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: itemId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Cart item removed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CartResponse' }
 */
cartRouter.put(
  "/items/:itemId",
  validateRequest(updateCartItemSchema),
  asyncHandler(cartController.updateItem),
);
cartRouter.delete(
  "/items/:itemId",
  validateRequest(cartItemIdSchema),
  asyncHandler(cartController.removeItem),
);

/**
 * @openapi
 * /cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear active cart
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cart cleared }
 */
cartRouter.delete("/clear", validateRequest(getCartSchema), asyncHandler(cartController.clear));
