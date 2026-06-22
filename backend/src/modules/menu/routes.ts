import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { menuController } from "./controller.js";
import {
  createMenuItemSchema,
  listCategoryMenuSchema,
  listMenuItemsSchema,
  listRestaurantMenuSchema,
  menuItemIdSchema,
  updateMenuItemSchema,
} from "./validator.js";

export const menuRouter = Router();
export const restaurantMenuRouter = Router({ mergeParams: true });
export const categoryMenuRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /menu-items:
 *   post:
 *     tags: [Menu]
 *     summary: Create a menu item
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MenuItemInput' }
 *           examples:
 *             biryani:
 *               value:
 *                 restaurantId: "6f7b2d0c-1111-4444-8888-987654321000"
 *                 categoryId: "9fa2b111-2222-4444-8888-123456789000"
 *                 name: "Chicken Biryani"
 *                 description: "Aromatic basmati rice with spiced chicken"
 *                 price: 249
 *                 imageUrl: "https://cdn.example.com/menu/chicken-biryani.jpg"
 *                 isAvailable: true
 *                 preparationTime: 25
 *     responses:
 *       201:
 *         description: Menu item created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MenuItemResponse' }
 *   get:
 *     tags: [Menu]
 *     summary: List menu items
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 100 } }
 *       - { in: query, name: categoryId, schema: { type: string, format: uuid } }
 *       - { in: query, name: isAvailable, schema: { type: boolean } }
 *       - { in: query, name: sortByPrice, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: Paginated menu item list
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MenuItemListResponse' }
 */
menuRouter.post(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.RESTAURANT_OWNER),
  validateRequest(createMenuItemSchema),
  asyncHandler(menuController.create),
);
menuRouter.get(
  "/",
  validateRequest(listMenuItemsSchema),
  asyncHandler(menuController.list),
);

/**
 * @openapi
 * /menu-items/{id}:
 *   get:
 *     tags: [Menu]
 *     summary: Get a menu item
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Menu item details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MenuItemResponse' }
 *       404: { description: Menu item not found }
 *   put:
 *     tags: [Menu]
 *     summary: Update a menu item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MenuItemUpdateInput' }
 *     responses:
 *       200:
 *         description: Menu item updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MenuItemResponse' }
 *   delete:
 *     tags: [Menu]
 *     summary: Soft-delete a menu item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Menu item deleted }
 */
menuRouter.get(
  "/:id",
  validateRequest(menuItemIdSchema),
  asyncHandler(menuController.getById),
);
menuRouter.put(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.RESTAURANT_OWNER),
  validateRequest(updateMenuItemSchema),
  asyncHandler(menuController.update),
);
menuRouter.delete(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.RESTAURANT_OWNER),
  validateRequest(menuItemIdSchema),
  asyncHandler(menuController.delete),
);

/**
 * @openapi
 * /restaurants/{restaurantId}/menu:
 *   get:
 *     tags: [Menu]
 *     summary: List menu items for a restaurant
 *     parameters:
 *       - { in: path, name: restaurantId, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 100 } }
 *       - { in: query, name: categoryId, schema: { type: string, format: uuid } }
 *       - { in: query, name: isAvailable, schema: { type: boolean } }
 *       - { in: query, name: sortByPrice, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: Restaurant menu
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MenuItemListResponse' }
 */
restaurantMenuRouter.get(
  "/",
  validateRequest(listRestaurantMenuSchema),
  asyncHandler(menuController.listByRestaurant),
);

/**
 * @openapi
 * /categories/{categoryId}/menu:
 *   get:
 *     tags: [Menu]
 *     summary: List menu items for a category
 *     parameters:
 *       - { in: path, name: categoryId, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 100 } }
 *       - { in: query, name: isAvailable, schema: { type: boolean } }
 *       - { in: query, name: sortByPrice, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: Category menu
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MenuItemListResponse' }
 */
categoryMenuRouter.get(
  "/",
  validateRequest(listCategoryMenuSchema),
  asyncHandler(menuController.listByCategory),
);
