import type { NotificationType } from "@prisma/client";
import { logger } from "../../config/logger.js";
import type { OrderRecord } from "../order/repository.js";
import type { PaymentRecord } from "../payment/repository.js";
import type { RestaurantRecord } from "../restaurant/repository.js";
import { notificationService, type NotificationService } from "./service.js";

interface NotificationEventDefinition {
  type: NotificationType;
  title: string;
  message: string;
  recipient: "CUSTOMER" | "RESTAURANT_OWNER";
  trigger: string;
}

export const notificationEventMatrix = {
  restaurantApproved: {
    trigger: "PUT /restaurants/:id/approve",
    recipient: "RESTAURANT_OWNER",
    type: "RESTAURANT_APPROVED",
    title: "Restaurant Approved",
    message: "Your restaurant has been approved and is now visible to customers.",
  },
  orderCreated: {
    trigger: "POST /orders",
    recipient: "CUSTOMER",
    type: "ORDER_CREATED",
    title: "Order Created",
    message: "Your order has been created. Complete payment to proceed.",
  },
  paymentSuccess: {
    trigger: "POST /payments/verify",
    recipient: "CUSTOMER",
    type: "PAYMENT_SUCCESS",
    title: "Payment Successful",
    message: "Your payment was completed successfully.",
  },
  newPaidOrder: {
    trigger: "POST /payments/verify",
    recipient: "RESTAURANT_OWNER",
    type: "NEW_ORDER_RECEIVED",
    title: "New Order Received",
    message: "A new paid order has been received and requires confirmation.",
  },
  orderConfirmed: {
    trigger: "PUT /orders/:id/status",
    recipient: "CUSTOMER",
    type: "ORDER_CONFIRMED",
    title: "Order Confirmed",
    message: "Your order has been confirmed by the restaurant.",
  },
  orderPreparing: {
    trigger: "PUT /orders/:id/status",
    recipient: "CUSTOMER",
    type: "ORDER_PREPARING",
    title: "Order Preparing",
    message: "Your order is currently being prepared.",
  },
  orderReadyForPickup: {
    trigger: "PUT /orders/:id/status",
    recipient: "CUSTOMER",
    type: "ORDER_READY_FOR_PICKUP",
    title: "Ready For Pickup",
    message: "Your order is ready for pickup.",
  },
  orderCompleted: {
    trigger: "PUT /orders/:id/status",
    recipient: "CUSTOMER",
    type: "ORDER_COMPLETED",
    title: "Order Completed",
    message: "Thank you for using Food Pickup Platform.",
  },
  orderCancelled: {
    trigger: "PUT /orders/:id/cancel",
    recipient: "CUSTOMER",
    type: "ORDER_CANCELLED",
    title: "Order Cancelled",
    message: "Your order has been cancelled.",
  },
  paymentFailed: {
    trigger: "POST /payments/verify",
    recipient: "CUSTOMER",
    type: "PAYMENT_FAILED",
    title: "Payment Failed",
    message: "Your payment could not be completed.",
  },
} satisfies Record<string, NotificationEventDefinition>;

interface EventPayload {
  userId: string;
  definition: NotificationEventDefinition;
  message?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationEventService {
  public constructor(private readonly service: NotificationService) {}

  public async restaurantApproved(restaurant: RestaurantRecord): Promise<void> {
    await this.createEventNotification({
      userId: restaurant.ownerId,
      definition: notificationEventMatrix.restaurantApproved,
      metadata: { restaurantId: restaurant.id },
    });
  }

  public async orderCreated(order: OrderRecord): Promise<void> {
    await this.createOrderEventNotification(order, notificationEventMatrix.orderCreated);
  }

  public async paymentSuccess(payment: PaymentRecord): Promise<void> {
    await this.createEventNotification({
      userId: payment.userId,
      definition: notificationEventMatrix.paymentSuccess,
      metadata: {
        paymentId: payment.id,
        orderId: payment.orderId,
      },
    });
  }

  public async newPaidOrder(order: OrderRecord): Promise<void> {
    await this.createEventNotification({
      userId: order.restaurant.ownerId,
      definition: notificationEventMatrix.newPaidOrder,
      metadata: this.getOrderMetadata(order),
    });
  }

  public async orderStatusUpdated(order: OrderRecord): Promise<void> {
    if (order.status === "CONFIRMED") {
      await this.createOrderEventNotification(order, notificationEventMatrix.orderConfirmed);
      return;
    }

    if (order.status === "PREPARING") {
      await this.createOrderEventNotification(order, notificationEventMatrix.orderPreparing);
      return;
    }

    if (order.status === "READY_FOR_PICKUP") {
      await this.createOrderEventNotification(order, notificationEventMatrix.orderReadyForPickup, {
        message: `${notificationEventMatrix.orderReadyForPickup.message} Pickup code: ${order.pickupCode}.`,
      });
      return;
    }

    if (order.status === "COMPLETED") {
      await this.createOrderEventNotification(order, notificationEventMatrix.orderCompleted);
    }
  }

  public async orderCancelled(order: OrderRecord): Promise<void> {
    await this.createOrderEventNotification(order, notificationEventMatrix.orderCancelled);
  }

  public async paymentFailed(payment: PaymentRecord): Promise<void> {
    await this.createEventNotification({
      userId: payment.userId,
      definition: notificationEventMatrix.paymentFailed,
      metadata: {
        paymentId: payment.id,
        orderId: payment.orderId,
      },
    });
  }

  private async createOrderEventNotification(
    order: OrderRecord,
    definition: NotificationEventDefinition,
    options: { message?: string } = {},
  ): Promise<void> {
    await this.createEventNotification({
      userId: order.userId,
      definition,
      ...(options.message === undefined ? {} : { message: options.message }),
      metadata: this.getOrderMetadata(order),
    });
  }

  private async createEventNotification(payload: EventPayload): Promise<void> {
    try {
      await this.service.create({
        userId: payload.userId,
        title: payload.definition.title,
        message: payload.message ?? payload.definition.message,
        type: payload.definition.type,
        metadata: {
          eventTrigger: payload.definition.trigger,
          recipient: payload.definition.recipient,
          ...(payload.metadata ?? {}),
        },
      });
    } catch (error) {
      logger.error(error);
    }
  }

  private getOrderMetadata(order: OrderRecord): Record<string, unknown> {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      pickupCode: order.pickupCode,
    };
  }
}

export const notificationEventService = new NotificationEventService(notificationService);
