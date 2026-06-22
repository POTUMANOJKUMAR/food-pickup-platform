import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const cartSelect = {
  id: true,
  userId: true,
  restaurantId: true,
  subtotal: true,
  totalAmount: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      menuItemId: true,
      quantity: true,
      unitPrice: true,
      subtotal: true,
      createdAt: true,
      updatedAt: true,
      menuItem: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          isAvailable: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.CartSelect;

const menuItemForCartSelect = {
  id: true,
  restaurantId: true,
  name: true,
  price: true,
  isActive: true,
  isAvailable: true,
  restaurant: {
    select: {
      isActive: true,
      isApproved: true,
    },
  },
} satisfies Prisma.MenuItemSelect;

export type CartRecord = Prisma.CartGetPayload<{ select: typeof cartSelect }>;
export type CartMenuItemRecord = Prisma.MenuItemGetPayload<{ select: typeof menuItemForCartSelect }>;

export class CartRepository {
  public findAvailableMenuItem(id: string): Promise<CartMenuItemRecord | null> {
    return prisma.menuItem.findFirst({
      where: {
        id,
        isActive: true,
        isAvailable: true,
        restaurant: { isActive: true, isApproved: true },
        category: { isActive: true },
      },
      select: menuItemForCartSelect,
    });
  }

  public findActiveByUserId(userId: string): Promise<CartRecord | null> {
    return prisma.cart.findFirst({
      where: { userId, isActive: true },
      select: cartSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  public createActive(userId: string): Promise<CartRecord> {
    return prisma.cart.create({
      data: { userId },
      select: cartSelect,
    });
  }

  public async getOrCreateActive(userId: string): Promise<CartRecord> {
    const existing = await this.findActiveByUserId(userId);
    return existing ?? this.createActive(userId);
  }

  public async addItem(
    cartId: string,
    menuItem: CartMenuItemRecord,
    quantity: number,
  ): Promise<CartRecord> {
    return prisma.$transaction(async (transaction) => {
      const existingItem = await transaction.cartItem.findUnique({
        where: { cartId_menuItemId: { cartId, menuItemId: menuItem.id } },
      });
      const nextQuantity = (existingItem?.quantity ?? 0) + quantity;
      const subtotal = menuItem.price.mul(nextQuantity);

      if (existingItem === null) {
        await transaction.cartItem.create({
          data: {
            cartId,
            menuItemId: menuItem.id,
            quantity: nextQuantity,
            unitPrice: menuItem.price,
            subtotal,
          },
        });
      } else {
        await transaction.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: nextQuantity,
            unitPrice: menuItem.price,
            subtotal,
          },
        });
      }

      await transaction.cart.update({
        where: { id: cartId },
        data: { restaurantId: menuItem.restaurantId },
      });

      return this.recalculateAndFind(transaction, cartId);
    });
  }

  public async updateItemQuantity(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartRecord | null> {
    return prisma.$transaction(async (transaction) => {
      const item = await transaction.cartItem.findFirst({
        where: { id: itemId, cart: { userId, isActive: true } },
      });

      if (item === null) {
        return null;
      }

      await transaction.cartItem.update({
        where: { id: item.id },
        data: {
          quantity,
          subtotal: item.unitPrice.mul(quantity),
        },
      });

      return this.recalculateAndFind(transaction, item.cartId);
    });
  }

  public async removeItem(userId: string, itemId: string): Promise<CartRecord | null> {
    return prisma.$transaction(async (transaction) => {
      const item = await transaction.cartItem.findFirst({
        where: { id: itemId, cart: { userId, isActive: true } },
      });

      if (item === null) {
        return null;
      }

      await transaction.cartItem.delete({ where: { id: item.id } });
      return this.recalculateAndFind(transaction, item.cartId);
    });
  }

  public async clear(userId: string): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const cart = await transaction.cart.findFirst({
        where: { userId, isActive: true },
        select: { id: true },
      });

      if (cart === null) {
        return;
      }

      await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });
      await transaction.cart.update({
        where: { id: cart.id },
        data: { restaurantId: null, subtotal: 0, totalAmount: 0 },
      });
    });
  }

  private async recalculateAndFind(
    transaction: Prisma.TransactionClient,
    cartId: string,
  ): Promise<CartRecord> {
    const aggregate = await transaction.cartItem.aggregate({
      where: { cartId },
      _sum: { subtotal: true },
      _count: { id: true },
    });
    const subtotal = aggregate._sum.subtotal ?? new Prisma.Decimal(0);

    await transaction.cart.update({
      where: { id: cartId },
      data: {
        subtotal,
        totalAmount: subtotal,
        ...(aggregate._count.id === 0 ? { restaurantId: null } : {}),
      },
    });

    const cart = await transaction.cart.findUnique({
      where: { id: cartId },
      select: cartSelect,
    });

    if (cart === null) {
      throw new Error("Cart not found after recalculation");
    }

    return cart;
  }
}

export const cartRepository = new CartRepository();
