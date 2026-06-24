import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { reviewController } from "./controller.js";
import {
  createReviewSchema,
  listReviewsSchema,
  ratingSummarySchema,
  restaurantReviewsSchema,
  reviewIdSchema,
  updateReviewSchema,
} from "./validator.js";

export const reviewRouter = Router();
export const restaurantReviewRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review for a completed order
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateReviewInput' }
 *     responses:
 *       201: { description: Review created }
 *       400: { description: Only completed orders can be reviewed }
 *       409: { description: Order has already been reviewed }
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: restaurantId, schema: { type: string, format: uuid } }
 *       - { in: query, name: userId, schema: { type: string, format: uuid } }
 *       - { in: query, name: orderId, schema: { type: string, format: uuid } }
 *       - { in: query, name: rating, schema: { type: integer, minimum: 1, maximum: 5 } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 100 } }
 *     responses:
 *       200:
 *         description: Paginated review list
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ReviewListResponse' }
 */
reviewRouter.post(
  "/",
  authenticate,
  authorize(Role.USER),
  validateRequest(createReviewSchema),
  asyncHandler(reviewController.create),
);
reviewRouter.get(
  "/",
  authenticate,
  authorize(Role.USER, Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(listReviewsSchema),
  asyncHandler(reviewController.list),
);
reviewRouter.get(
  "/analytics",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  asyncHandler(reviewController.analytics),
);
reviewRouter.get(
  "/recent",
  authenticate,
  authorize(Role.RESTAURANT_OWNER, Role.ADMIN),
  asyncHandler(reviewController.recent),
);

/**
 * @openapi
 * /reviews/analytics:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews analytics (average, total, distribution)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Reviews analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating: { type: number }
 *                 totalReviews: { type: integer }
 *                 ratingDistribution: { type: object }
 */

/**
 * @openapi
 * /reviews/recent:
 *   get:
 *     tags: [Reviews]
 *     summary: Get recent reviews
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Recent reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ReviewResponse' }
 */

/**
 * @openapi
 * /reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get a review
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Review details }
 *       404: { description: Review not found }
 *   put:
 *     tags: [Reviews]
 *     summary: Update own review
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateReviewInput' }
 *     responses:
 *       200: { description: Review updated }
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete own review
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Review deleted }
 */
reviewRouter.get(
  "/:id",
  authenticate,
  authorize(Role.USER, Role.RESTAURANT_OWNER, Role.ADMIN),
  validateRequest(reviewIdSchema),
  asyncHandler(reviewController.getById),
);
reviewRouter.put(
  "/:id",
  authenticate,
  authorize(Role.USER),
  validateRequest(updateReviewSchema),
  asyncHandler(reviewController.update),
);
reviewRouter.delete(
  "/:id",
  authenticate,
  authorize(Role.USER),
  validateRequest(reviewIdSchema),
  asyncHandler(reviewController.delete),
);

/**
 * @openapi
 * /restaurants/{restaurantId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List public reviews for a restaurant
 *     parameters:
 *       - { in: path, name: restaurantId, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: rating, schema: { type: integer, minimum: 1, maximum: 5 } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 100 } }
 *     responses:
 *       200: { description: Paginated restaurant reviews }
 * /restaurants/{restaurantId}/rating-summary:
 *   get:
 *     tags: [Reviews]
 *     summary: Get restaurant rating summary
 *     parameters:
 *       - { in: path, name: restaurantId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Rating summary
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RatingSummaryResponse' }
 */
restaurantReviewRouter.get(
  "/reviews",
  validateRequest(restaurantReviewsSchema),
  asyncHandler(reviewController.listForRestaurant),
);
restaurantReviewRouter.get(
  "/rating-summary",
  validateRequest(ratingSummarySchema),
  asyncHandler(reviewController.ratingSummary),
);
