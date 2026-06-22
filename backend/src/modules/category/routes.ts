import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { categoryController } from "./controller.js";
import {
  categoryIdSchema,
  createCategorySchema,
  listCategoriesSchema,
  listRestaurantCategoriesSchema,
  updateCategorySchema,
} from "./validator.js";

export const categoryRouter = Router();
export const restaurantCategoryRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a category
 *     description: Restaurant owners may create categories for their own restaurants; admins may create for any active restaurant.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryInput' }
 *           examples:
 *             biryani:
 *               value: { restaurantId: "6f7b2d0c-1111-4444-8888-987654321000", name: "Biryani", description: "Signature rice dishes" }
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryResponse' }
 *       401: { description: Authentication required }
 *       403: { description: Not authorized }
 *   get:
 *     tags: [Categories]
 *     summary: List categories
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: search, description: Case-insensitive category name search, schema: { type: string, maxLength: 100 } }
 *     responses:
 *       200:
 *         description: Paginated category list
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryListResponse' }
 */
categoryRouter.post(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.RESTAURANT_OWNER),
  validateRequest(createCategorySchema),
  asyncHandler(categoryController.create),
);
categoryRouter.get(
  "/",
  validateRequest(listCategoriesSchema),
  asyncHandler(categoryController.list),
);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryResponse' }
 *       404: { description: Category not found }
 *   put:
 *     tags: [Categories]
 *     summary: Update a category
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryUpdateInput' }
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryResponse' }
 *       403: { description: Not authorized to manage this category }
 *       404: { description: Category not found }
 *   delete:
 *     tags: [Categories]
 *     summary: Soft-delete a category
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Category deleted }
 *       403: { description: Not authorized to manage this category }
 *       404: { description: Category not found }
 */
categoryRouter.get(
  "/:id",
  validateRequest(categoryIdSchema),
  asyncHandler(categoryController.getById),
);
categoryRouter.put(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.RESTAURANT_OWNER),
  validateRequest(updateCategorySchema),
  asyncHandler(categoryController.update),
);
categoryRouter.delete(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.RESTAURANT_OWNER),
  validateRequest(categoryIdSchema),
  asyncHandler(categoryController.delete),
);

/**
 * @openapi
 * /restaurants/{restaurantId}/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories for a restaurant
 *     parameters:
 *       - { in: path, name: restaurantId, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 100 } }
 *     responses:
 *       200:
 *         description: Restaurant categories
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryListResponse' }
 */
restaurantCategoryRouter.get(
  "/",
  validateRequest(listRestaurantCategoriesSchema),
  asyncHandler(categoryController.listByRestaurant),
);
