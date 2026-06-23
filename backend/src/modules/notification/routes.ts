import { Router } from "express";
import { Role } from "../../constants/roles.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorize.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { notificationController } from "./controller.js";
import {
  createNotificationSchema,
  listNotificationsSchema,
  markAllNotificationsReadSchema,
  notificationIdSchema,
} from "./validator.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate, authorize(Role.USER, Role.RESTAURANT_OWNER, Role.ADMIN));

/**
 * @openapi
 * /notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create notification
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateNotificationInput' }
 *     responses:
 *       201:
 *         description: Notification created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/NotificationResponse' }
 *   get:
 *     tags: [Notifications]
 *     summary: List user notifications
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *       - { in: query, name: type, schema: { $ref: '#/components/schemas/NotificationType' } }
 *       - { in: query, name: isRead, schema: { type: boolean } }
 *       - { in: query, name: sortOrder, schema: { type: string, enum: [asc, desc], default: desc } }
 *       - { in: query, name: userId, schema: { type: string, format: uuid }, description: Admin-only user filter }
 *     responses:
 *       200:
 *         description: Notification list
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/NotificationListResponse' }
 */
notificationRouter.post(
  "/",
  validateRequest(createNotificationSchema),
  asyncHandler(notificationController.create),
);
notificationRouter.get(
  "/",
  validateRequest(listNotificationsSchema),
  asyncHandler(notificationController.list),
);

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all current user's notifications as read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
notificationRouter.put(
  "/read-all",
  validateRequest(markAllNotificationsReadSchema),
  asyncHandler(notificationController.markAllAsRead),
);

/**
 * @openapi
 * /notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification details
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Notification details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/NotificationResponse' }
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Notification deleted
 */
notificationRouter.get(
  "/:id",
  validateRequest(notificationIdSchema),
  asyncHandler(notificationController.getById),
);
notificationRouter.delete(
  "/:id",
  validateRequest(notificationIdSchema),
  asyncHandler(notificationController.delete),
);

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/NotificationResponse' }
 */
notificationRouter.put(
  "/:id/read",
  validateRequest(notificationIdSchema),
  asyncHandler(notificationController.markAsRead),
);
