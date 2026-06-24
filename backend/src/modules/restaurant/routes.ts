import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { restaurantController } from "./controller.js";
import multer from "multer";
import path from "path";
import {
  restaurantProfileQuerySchema,
  updateRestaurantProfileSchema,
  businessHoursSchema,
} from "./validator.js";
import {
  createRestaurantSchema,
  listRestaurantsSchema,
  restaurantIdSchema,
  updateRestaurantSchema,
} from "./validator.js";

export const restaurantRouter = Router();

const upload = multer({ dest: path.join(process.cwd(), "uploads") });

restaurantRouter.get(
  "/profile",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(restaurantProfileQuerySchema),
  asyncHandler(restaurantController.getProfile),
);

/**
 * @openapi
 * /restaurants/profile:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant profile and settings
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: restaurantId, schema: { type: string, format: uuid }, description: Required for admins }
 *     responses:
 *       200:
 *         description: Restaurant profile with settings
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RestaurantProfileResponse' }
 */

restaurantRouter.put(
  "/profile",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(updateRestaurantProfileSchema),
  asyncHandler(restaurantController.updateProfile),
);

/**
 * @openapi
 * /restaurants/profile:
 *   put:
 *     tags: [Restaurants]
 *     summary: Update restaurant profile and settings
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RestaurantProfileInput' }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RestaurantProfileResponse' }
 */

restaurantRouter.get(
  "/business-hours",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  asyncHandler(restaurantController.getBusinessHours),
);

/**
 * @openapi
 * /restaurants/business-hours:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get business hours
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: restaurantId, schema: { type: string, format: uuid }, description: Required for admins }
 *     responses:
 *       200:
 *         description: Business hours array
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BusinessHoursResponse' }
 */

restaurantRouter.put(
  "/business-hours",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(businessHoursSchema),
  asyncHandler(restaurantController.updateBusinessHours),
);

/**
 * @openapi
 * /restaurants/business-hours:
 *   put:
 *     tags: [Restaurants]
 *     summary: Replace business hours
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BusinessHoursInput' }
 *     responses:
 *       200:
 *         description: Business hours updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BusinessHoursResponse' }
 */

restaurantRouter.post(
  "/logo",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  upload.single("file"),
  asyncHandler(restaurantController.uploadLogo),
);

/**
 * @openapi
 * /restaurants/logo:
 *   post:
 *     tags: [Restaurants]
 *     summary: Upload restaurant logo
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logoUrl: { type: string }
 */

restaurantRouter.post(
  "/banner",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  upload.single("file"),
  asyncHandler(restaurantController.uploadBanner),
);

/**
 * @openapi
 * /restaurants/banner:
 *   post:
 *     tags: [Restaurants]
 *     summary: Upload restaurant banner
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Banner uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bannerUrl: { type: string }
 */

/**
 * @openapi
 * /restaurants:
 *   post:
 *     tags: [Restaurants]
 *     summary: Create a restaurant
 *     description: Creates an unapproved restaurant owned by the authenticated restaurant owner.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RestaurantInput' }
 *     responses:
 *       201:
 *         description: Restaurant created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RestaurantResponse' }
 *       400: { description: Validation failed }
 *       401: { description: Authentication required }
 *       403: { description: Restaurant owner role required }
 *   get:
 *     tags: [Restaurants]
 *     summary: List approved restaurants
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: search, description: Case-insensitive restaurant name search, schema: { type: string, maxLength: 100 } }
 *     responses:
 *       200:
 *         description: Paginated restaurant list
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RestaurantListResponse' }
 */
restaurantRouter.post(
  "/",
  authenticate,
  authorize(Role.RESTAURANT_OWNER),
  validateRequest(createRestaurantSchema),
  asyncHandler(restaurantController.create),
);

/**
 * @openapi
 * /restaurants/business-hours:
 *   post:
 *     tags: [Restaurants]
 *     summary: Create business hours
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BusinessHoursInput' }
 *     responses:
 *       201:
 *         description: Business hours created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BusinessHoursResponse' }
 */
restaurantRouter.post(
  "/business-hours",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(businessHoursSchema),
  asyncHandler(restaurantController.createBusinessHours),
);
restaurantRouter.get(
  "/",
  validateRequest(listRestaurantsSchema),
  asyncHandler(restaurantController.list),
);

/**
 * @openapi
 * /restaurants/{id}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get an approved restaurant
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Restaurant details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RestaurantResponse' }
 *       404: { description: Restaurant not found }
 *   put:
 *     tags: [Restaurants]
 *     summary: Update a restaurant
 *     description: Restaurant owners may update their own restaurant; admins may update any restaurant. Owner updates reset approval.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - { $ref: '#/components/schemas/RestaurantInput' }
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: Restaurant updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RestaurantResponse' }
 *       403: { description: Not authorized to manage this restaurant }
 *       404: { description: Restaurant not found }
 *   delete:
 *     tags: [Restaurants]
 *     summary: Soft-delete a restaurant
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Restaurant deleted }
 *       403: { description: Not authorized to manage this restaurant }
 *       404: { description: Restaurant not found }
 */
restaurantRouter.get(
  "/:id",
  validateRequest(restaurantIdSchema),
  asyncHandler(restaurantController.getById),
);
restaurantRouter.put(
  "/:id",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(updateRestaurantSchema),
  asyncHandler(restaurantController.update),
);
restaurantRouter.delete(
  "/:id",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(restaurantIdSchema),
  asyncHandler(restaurantController.delete),
);

/**
 * @openapi
 * /restaurants/{id}/approve:
 *   put:
 *     tags: [Restaurants]
 *     summary: Approve a restaurant
 *     description: Requires the ADMIN role and triggers RESTAURANT_APPROVED for the restaurant owner.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Restaurant approved
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RestaurantResponse' }
 *       403: { description: Admin role required }
 *       404: { description: Restaurant not found }
 */
restaurantRouter.put(
  "/:id/approve",
  authenticate,
  authorize(Role.ADMIN),
  validateRequest(restaurantIdSchema),
  asyncHandler(restaurantController.approve),
);
