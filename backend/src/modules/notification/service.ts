import { Prisma, type NotificationType } from "@prisma/client";
import { env } from "../../config/env.js";
import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import {
  notificationRepository,
  type NotificationRecord,
  type NotificationRepository,
} from "./repository.js";
import type {
  CreateNotificationRequestDTO,
  ListNotificationsQueryDTO,
  NotificationActorDTO,
  NotificationHelperPayloadDTO,
  NotificationListResponseDTO,
  NotificationResponseDTO,
  PushNotificationResultDTO,
} from "./types.js";

const toNotificationResponse = (notification: NotificationRecord): NotificationResponseDTO => ({
  id: notification.id,
  userId: notification.userId,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  isRead: notification.isRead,
  metadata: notification.metadata,
  createdAt: notification.createdAt.toISOString(),
  updatedAt: notification.updatedAt.toISOString(),
});

const toJsonValue = (value: unknown): Prisma.InputJsonValue | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
};

export class NotificationService {
  public constructor(private readonly repository: NotificationRepository) {}

  public async create(
    input: CreateNotificationRequestDTO,
    actor?: NotificationActorDTO,
  ): Promise<NotificationResponseDTO> {
    if (actor !== undefined && actor.role !== Role.ADMIN && input.userId !== actor.id) {
      throw new AppError("You are not authorized to create this notification", 403);
    }

    await this.ensureUserExists(input.userId);

    const metadata = toJsonValue(input.metadata);
    const notification = await this.repository.create({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      ...(metadata === undefined ? {} : { metadata }),
    });

    if (input.sendPush === true && input.pushToken !== undefined) {
      await this.sendPushNotification(input.pushToken, input.title, input.message, input.type, input.metadata);
    }

    return toNotificationResponse(notification);
  }

  public async list(
    actor: NotificationActorDTO,
    query: ListNotificationsQueryDTO,
  ): Promise<NotificationListResponseDTO> {
    if (query.userId !== undefined && actor.role !== Role.ADMIN && query.userId !== actor.id) {
      throw new AppError("You are not authorized to list these notifications", 403);
    }

    const userId = actor.role === Role.ADMIN ? query.userId : actor.id;
    const result = await this.repository.findList(
      query.page,
      query.limit,
      {
        ...(userId === undefined ? {} : { userId }),
        ...(query.type === undefined ? {} : { type: query.type }),
        ...(query.isRead === undefined ? {} : { isRead: query.isRead }),
      },
      query.sortOrder,
    );
    const totalPages = Math.ceil(result.totalItems / query.limit);

    return {
      items: result.items.map(toNotificationResponse),
      unreadCount: result.unreadCount,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems: result.totalItems,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  public async getById(id: string, actor: NotificationActorDTO): Promise<NotificationResponseDTO> {
    const notification = await this.getAccessibleNotification(id, actor);
    return toNotificationResponse(notification);
  }

  public async markAsRead(id: string, actor: NotificationActorDTO): Promise<NotificationResponseDTO> {
    await this.getAccessibleNotification(id, actor);
    const notification = await this.repository.markAsRead(id);
    return toNotificationResponse(notification);
  }

  public async markAllAsRead(actor: NotificationActorDTO): Promise<{ updatedCount: number }> {
    const result = await this.repository.markAllAsRead(actor.id);
    return { updatedCount: result.count };
  }

  public async delete(id: string, actor: NotificationActorDTO): Promise<NotificationResponseDTO> {
    await this.getAccessibleNotification(id, actor);
    const notification = await this.repository.delete(id);
    return toNotificationResponse(notification);
  }

  public async sendPushNotification(
    token: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: unknown,
  ): Promise<PushNotificationResultDTO> {
    if (env.FCM_SERVER_KEY === undefined) {
      return { attempted: false, delivered: false, reason: "Firebase Cloud Messaging is not configured" };
    }

    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${env.FCM_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body: message,
        },
        data: {
          type,
          metadata: JSON.stringify(metadata ?? {}),
        },
      }),
    });

    if (!response.ok) {
      return { attempted: true, delivered: false, reason: `FCM request failed with ${response.status}` };
    }

    return { attempted: true, delivered: true };
  }

  private async getAccessibleNotification(
    id: string,
    actor: NotificationActorDTO,
  ): Promise<NotificationRecord> {
    const notification = await this.repository.findById(id);

    if (notification === null) {
      throw new AppError("Notification not found", 404);
    }

    if (actor.role !== Role.ADMIN && notification.userId !== actor.id) {
      throw new AppError("You are not authorized to access this notification", 403);
    }

    return notification;
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.repository.userExists(userId);

    if (user === null) {
      throw new AppError("User not found", 404);
    }
  }
}

export const notificationService = new NotificationService(notificationRepository);

const notify = (
  type: NotificationType,
  title: string,
  message: string,
  payload: NotificationHelperPayloadDTO,
): Promise<NotificationResponseDTO> =>
  notificationService.create({
    userId: payload.userId,
    title,
    message,
    type,
    sendPush: payload.pushToken !== undefined,
    ...(payload.pushToken === undefined ? {} : { pushToken: payload.pushToken }),
    metadata: {
      ...(payload.orderId === undefined ? {} : { orderId: payload.orderId }),
      ...(payload.orderNumber === undefined ? {} : { orderNumber: payload.orderNumber }),
      ...(payload.paymentId === undefined ? {} : { paymentId: payload.paymentId }),
      ...(payload.pickupCode === undefined ? {} : { pickupCode: payload.pickupCode }),
      ...(payload.metadata ?? {}),
    },
  });

export const notifyOrderCreated = (payload: NotificationHelperPayloadDTO): Promise<NotificationResponseDTO> =>
  notify(
    "ORDER_CREATED",
    "Order Created",
    "Your order has been created. Complete payment to proceed.",
    payload,
  );

export const notifyOrderConfirmed = (payload: NotificationHelperPayloadDTO): Promise<NotificationResponseDTO> =>
  notify(
    "ORDER_CONFIRMED",
    "Order Confirmed",
    "Your order has been confirmed by the restaurant.",
    payload,
  );

export const notifyOrderPreparing = (payload: NotificationHelperPayloadDTO): Promise<NotificationResponseDTO> =>
  notify(
    "ORDER_PREPARING",
    "Order Preparing",
    "Your order is currently being prepared.",
    payload,
  );

export const notifyOrderReadyForPickup = (
  payload: NotificationHelperPayloadDTO,
): Promise<NotificationResponseDTO> =>
  notify(
    "ORDER_READY_FOR_PICKUP",
    "Ready For Pickup",
    `Your order is ready for pickup.${
      payload.pickupCode === undefined ? "" : ` Pickup code: ${payload.pickupCode}.`
    }`,
    payload,
  );

export const notifyOrderCompleted = (payload: NotificationHelperPayloadDTO): Promise<NotificationResponseDTO> =>
  notify(
    "ORDER_COMPLETED",
    "Order Completed",
    "Thank you for using Food Pickup Platform.",
    payload,
  );

export const notifyOrderCancelled = (payload: NotificationHelperPayloadDTO): Promise<NotificationResponseDTO> =>
  notify("ORDER_CANCELLED", "Order Cancelled", "Your order has been cancelled.", payload);

export const notifyPaymentSuccess = (payload: NotificationHelperPayloadDTO): Promise<NotificationResponseDTO> =>
  notify("PAYMENT_SUCCESS", "Payment Successful", "Your payment was completed successfully.", payload);

export const notifyPaymentFailed = (payload: NotificationHelperPayloadDTO): Promise<NotificationResponseDTO> =>
  notify("PAYMENT_FAILED", "Payment Failed", "Your payment could not be completed.", payload);

export const notifyNewOrderReceived = (
  payload: NotificationHelperPayloadDTO,
): Promise<NotificationResponseDTO> =>
  notify(
    "NEW_ORDER_RECEIVED",
    "New Order Received",
    "A new paid order has been received and requires confirmation.",
    payload,
  );

export const notifyRestaurantApproved = (
  payload: NotificationHelperPayloadDTO,
): Promise<NotificationResponseDTO> =>
  notify(
    "RESTAURANT_APPROVED",
    "Restaurant Approved",
    "Your restaurant has been approved and is now visible to customers.",
    payload,
  );
