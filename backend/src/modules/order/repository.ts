import { Prisma, type OrderStatus, type PaymentStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const orderSelect = {
  id: true,
  orderNumber: true,
  userId: true,
  restaurantId: true,
  status: true,
  paymentStatus: true,
  pickupCode: true,
  subtotal: true,
  taxAmount: true,
  totalAmount: true,
  cancelledAt: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  restaurant: {
    select: {
      ownerId: true,
    },
  },
  items: {
    select: {
      id: true,
      menuItemId: true,
      name: true,
      quantity: true,
      unitPrice: true,
      subtotal: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.OrderSelect;

const checkoutCartSelect = {
  id: true,
  userId: true,
  restaurantId: true,
  subtotal: true,
  items: {
    select: {
      menuItemId: true,
      quantity: true,
      unitPrice: true,
      subtotal: true,
      menuItem: {
        select: {
          id: true,
          name: true,
          isActive: true,
          isAvailable: true,
          restaurantId: true,
          category: { select: { isActive: true } },
        },
      },
    },
  },
} satisfies Prisma.CartSelect;

export type OrderRecord = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;
export type CheckoutCartRecord = Prisma.CartGetPayload<{ select: typeof checkoutCartSelect }>;

interface OrderListFilters {
  userId?: string;
  ownerId?: string;
  status?: OrderStatus;
}

interface OrderListResult {
  items: OrderRecord[];
  totalItems: number;
}

interface CreateOrderFromCartData {
  cart: CheckoutCartRecord;
  orderNumber: string;
  pickupCode: string;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
}

export class OrderRepository {
  public findCheckoutCart(userId: string): Promise<CheckoutCartRecord | null> {
    return prisma.cart.findFirst({
      where: { userId, isActive: true },
      select: checkoutCartSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  public async createFromCart(data: CreateOrderFromCartData): Promise<OrderRecord> {
    return prisma.$transaction(async (transaction) => {
      if (data.cart.restaurantId === null) {
        throw new Error("Cannot create order without restaurant");
      }

      const order = await transaction.order.create({
        data: {
          orderNumber: data.orderNumber,
          userId: data.cart.userId,
          restaurantId: data.cart.restaurantId,
          pickupCode: data.pickupCode,
          subtotal: data.cart.subtotal,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          items: {
            create: data.cart.items.map((item) => ({
              menuItemId: item.menuItemId,
              name: item.menuItem.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
        },
        select: orderSelect,
      });

      await transaction.cart.update({
        where: { id: data.cart.id },
        data: { isActive: false },
      });

      return order;
    });
  }

  public async findList(
    page: number,
    limit: number,
    filters: OrderListFilters = {},
  ): Promise<OrderListResult> {
    const where: Prisma.OrderWhereInput = {
      ...(filters.userId === undefined ? {} : { userId: filters.userId }),
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
      ...(filters.status === undefined ? {} : { status: filters.status }),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        select: orderSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, totalItems };
  }

  public findById(id: string): Promise<OrderRecord | null> {
    return prisma.order.findUnique({
      where: { id },
      select: orderSelect,
    });
  }

  public updateStatus(id: string, status: OrderStatus): Promise<OrderRecord> {
    return prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      },
      select: orderSelect,
    });
  }

  public markPaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    paidAt?: Date | null,
  ): Promise<OrderRecord> {
    return prisma.order.update({
      where: { id },
      data: {
        paymentStatus,
        ...(paidAt === undefined ? {} : { paidAt }),
      },
      select: orderSelect,
    });
  }
}

export const orderRepository = new OrderRepository();
