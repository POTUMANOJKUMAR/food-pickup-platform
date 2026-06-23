import { Prisma } from "@prisma/client";
import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { notificationEventService } from "../notification/event-service.js";
import { orderRepository, type OrderRecord, type OrderRepository } from "./repository.js";
import type {
  ListOrdersQueryDTO,
  OrderActorDTO,
  OrderListResponseDTO,
  OrderResponseDTO,
  UpdateOrderStatusRequestDTO,
} from "./types.js";

const TAX_RATE = new Prisma.Decimal("0.05");

const toOrderResponse = (order: OrderRecord): OrderResponseDTO => ({
  id: order.id,
  orderNumber: order.orderNumber,
  userId: order.userId,
  restaurantId: order.restaurantId,
  status: order.status,
  paymentStatus: order.paymentStatus,
  pickupCode: order.pickupCode,
  subtotal: order.subtotal.toNumber(),
  taxAmount: order.taxAmount.toNumber(),
  totalAmount: order.totalAmount.toNumber(),
  cancelledAt: order.cancelledAt?.toISOString() ?? null,
  paidAt: order.paidAt?.toISOString() ?? null,
  items: order.items.map((item) => ({
    id: item.id,
    menuItemId: item.menuItemId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toNumber(),
    subtotal: item.subtotal.toNumber(),
    createdAt: item.createdAt.toISOString(),
  })),
  createdAt: order.createdAt.toISOString(),
  updatedAt: order.updatedAt.toISOString(),
});

const generateOrderNumber = (): string => `FP${Math.floor(1000 + Math.random() * 9000)}`;
const generatePickupCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

export class OrderService {
  public constructor(private readonly repository: OrderRepository) {}

  public async createFromCart(actor: OrderActorDTO): Promise<OrderResponseDTO> {
    if (actor.role !== Role.USER) {
      throw new AppError("Only customers can create orders", 403);
    }

    const cart = await this.repository.findCheckoutCart(actor.id);

    if (cart === null || cart.items.length === 0 || cart.restaurantId === null) {
      throw new AppError("Cart is empty", 400);
    }

    const hasUnavailableItem = cart.items.some(
      (item) =>
        !item.menuItem.isActive ||
        !item.menuItem.isAvailable ||
        !item.menuItem.category.isActive ||
        item.menuItem.restaurantId !== cart.restaurantId,
    );

    if (hasUnavailableItem) {
      throw new AppError("Cart contains unavailable menu items", 400);
    }

    const taxAmount = cart.subtotal.mul(TAX_RATE).toDecimalPlaces(2);
    const totalAmount = cart.subtotal.add(taxAmount).toDecimalPlaces(2);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const order = await this.repository.createFromCart({
          cart,
          orderNumber: generateOrderNumber(),
          pickupCode: generatePickupCode(),
          taxAmount,
          totalAmount,
        });
        await notificationEventService.orderCreated(order);
        return toOrderResponse(order);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          continue;
        }
        throw error;
      }
    }

    throw new AppError("Unable to generate unique order number", 500);
  }

  public async list(actor: OrderActorDTO, query: ListOrdersQueryDTO): Promise<OrderListResponseDTO> {
    const result = await this.repository.findList(query.page, query.limit, {
      ...(actor.role === Role.USER ? { userId: actor.id } : {}),
      ...(actor.role === Role.RESTAURANT_OWNER ? { ownerId: actor.id } : {}),
      ...(query.status === undefined ? {} : { status: query.status }),
    });
    const totalPages = Math.ceil(result.totalItems / query.limit);

    return {
      items: result.items.map(toOrderResponse),
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

  public async getById(id: string, actor: OrderActorDTO): Promise<OrderResponseDTO> {
    const order = await this.getAccessibleOrder(id, actor);
    return toOrderResponse(order);
  }

  public async updateStatus(
    id: string,
    input: UpdateOrderStatusRequestDTO,
    actor: OrderActorDTO,
  ): Promise<OrderResponseDTO> {
    const order = await this.getAccessibleOrder(id, actor);

    if (actor.role === Role.USER) {
      throw new AppError("Customers cannot update order status", 403);
    }

    if (order.status === "CANCELLED" || order.status === "COMPLETED") {
      throw new AppError("Order status cannot be updated", 400);
    }

    if (input.status === "CANCELLED") {
      throw new AppError("Use cancel endpoint to cancel an order", 400);
    }

    const updated = await this.repository.updateStatus(id, input.status);
    await notificationEventService.orderStatusUpdated(updated);
    return toOrderResponse(updated);
  }

  public async cancel(id: string, actor: OrderActorDTO): Promise<OrderResponseDTO> {
    const order = await this.getAccessibleOrder(id, actor);

    if (order.status === "CANCELLED") {
      throw new AppError("Order is already cancelled", 400);
    }

    if (order.status === "COMPLETED") {
      throw new AppError("Completed orders cannot be cancelled", 400);
    }

    const updated = await this.repository.updateStatus(id, "CANCELLED");
    await notificationEventService.orderCancelled(updated);
    return toOrderResponse(updated);
  }

  private async getAccessibleOrder(id: string, actor: OrderActorDTO): Promise<OrderRecord> {
    const order = await this.repository.findById(id);

    if (order === null) {
      throw new AppError("Order not found", 404);
    }

    if (!this.canAccess(order, actor)) {
      throw new AppError("You are not authorized to access this order", 403);
    }

    return order;
  }

  private canAccess(order: OrderRecord, actor: OrderActorDTO): boolean {
    if (actor.role === Role.ADMIN) {
      return true;
    }

    if (actor.role === Role.RESTAURANT_OWNER) {
      return order.restaurant.ownerId === actor.id;
    }

    return order.userId === actor.id;
  }
}

export const orderService = new OrderService(orderRepository);
