import { Prisma, type WalletTransactionType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const walletSelect = {
  id: true,
  restaurantId: true,
  availableBalance: true,
  pendingBalance: true,
  lifetimeEarnings: true,
  createdAt: true,
  updatedAt: true,
  restaurant: {
    select: {
      ownerId: true,
    },
  },
} satisfies Prisma.RestaurantWalletSelect;

const walletTransactionSelect = {
  id: true,
  walletId: true,
  orderId: true,
  amount: true,
  transactionType: true,
  description: true,
  createdAt: true,
  wallet: {
    select: {
      restaurantId: true,
      restaurant: {
        select: {
          ownerId: true,
        },
      },
    },
  },
} satisfies Prisma.WalletTransactionSelect;

const walletOrderSelect = {
  id: true,
  restaurantId: true,
  status: true,
  totalAmount: true,
  restaurant: {
    select: {
      ownerId: true,
    },
  },
} satisfies Prisma.OrderSelect;

export type WalletRecord = Prisma.RestaurantWalletGetPayload<{ select: typeof walletSelect }>;
export type WalletTransactionRecord = Prisma.WalletTransactionGetPayload<{
  select: typeof walletTransactionSelect;
}>;
export type WalletOrderRecord = Prisma.OrderGetPayload<{ select: typeof walletOrderSelect }>;

interface TransactionListFilters {
  restaurantId?: string;
  ownerId?: string;
  transactionType?: WalletTransactionType;
  orderId?: string;
  search?: string;
}

interface TransactionListResult {
  items: WalletTransactionRecord[];
  totalItems: number;
}

export class WalletRepository {
  public findOwnerRestaurant(ownerId: string, restaurantId?: string): Promise<{ id: string } | null> {
    return prisma.restaurant.findFirst({
      where: {
        ownerId,
        isActive: true,
        ...(restaurantId === undefined ? {} : { id: restaurantId }),
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
  }

  public findOrderForWallet(orderId: string): Promise<WalletOrderRecord | null> {
    return prisma.order.findUnique({
      where: { id: orderId },
      select: walletOrderSelect,
    });
  }

  public findByRestaurantId(restaurantId: string): Promise<WalletRecord | null> {
    return prisma.restaurantWallet.findUnique({
      where: { restaurantId },
      select: walletSelect,
    });
  }

  public async getOrCreateByRestaurantId(restaurantId: string): Promise<WalletRecord> {
    return prisma.restaurantWallet.upsert({
      where: { restaurantId },
      update: {},
      create: { restaurantId },
      select: walletSelect,
    });
  }

  public async creditPendingForOrder(data: {
    restaurantId: string;
    orderId: string;
    restaurantShare: Prisma.Decimal;
    commissionAmount: Prisma.Decimal;
  }): Promise<WalletRecord> {
    return prisma.$transaction(async (transaction) => {
      const wallet = await transaction.restaurantWallet.upsert({
        where: { restaurantId: data.restaurantId },
        update: {},
        create: { restaurantId: data.restaurantId },
      });
      const existingCredit = await transaction.walletTransaction.findFirst({
        where: { walletId: wallet.id, orderId: data.orderId, transactionType: "CREDIT" },
        select: { id: true },
      });

      if (existingCredit === null) {
        await transaction.restaurantWallet.update({
          where: { id: wallet.id },
          data: {
            pendingBalance: { increment: data.restaurantShare },
            lifetimeEarnings: { increment: data.restaurantShare },
          },
        });
        await transaction.walletTransaction.createMany({
          data: [
            {
              walletId: wallet.id,
              orderId: data.orderId,
              amount: data.restaurantShare,
              transactionType: "CREDIT",
              description: "Restaurant share credited to pending balance",
            },
            {
              walletId: wallet.id,
              orderId: data.orderId,
              amount: data.commissionAmount,
              transactionType: "COMMISSION",
              description: "Platform commission retained",
            },
          ],
        });
      }

      return transaction.restaurantWallet.findUniqueOrThrow({
        where: { id: wallet.id },
        select: walletSelect,
      });
    });
  }

  public async releasePendingForOrder(data: {
    restaurantId: string;
    orderId: string;
  }): Promise<WalletRecord> {
    return prisma.$transaction(async (transaction) => {
      const wallet = await transaction.restaurantWallet.findUnique({
        where: { restaurantId: data.restaurantId },
      });

      if (wallet === null) {
        throw new Error("Wallet not found");
      }

      const credit = await transaction.walletTransaction.findFirst({
        where: { walletId: wallet.id, orderId: data.orderId, transactionType: "CREDIT" },
        select: { amount: true },
      });
      const existingRelease = await transaction.walletTransaction.findFirst({
        where: { walletId: wallet.id, orderId: data.orderId, transactionType: "SETTLEMENT" },
        select: { id: true },
      });

      if (credit !== null && existingRelease === null) {
        await transaction.restaurantWallet.update({
          where: { id: wallet.id },
          data: {
            pendingBalance: { decrement: credit.amount },
            availableBalance: { increment: credit.amount },
          },
        });
        await transaction.walletTransaction.create({
          data: {
            walletId: wallet.id,
            orderId: data.orderId,
            amount: credit.amount,
            transactionType: "SETTLEMENT",
            description: "Order completed and pending balance moved to available balance",
          },
        });
      }

      return transaction.restaurantWallet.findUniqueOrThrow({
        where: { id: wallet.id },
        select: walletSelect,
      });
    });
  }

  public async findTransactions(
    page: number,
    limit: number,
    filters: TransactionListFilters = {},
  ): Promise<TransactionListResult> {
    const where: Prisma.WalletTransactionWhereInput = {
      ...(filters.restaurantId === undefined
        ? {}
        : { wallet: { restaurantId: filters.restaurantId } }),
      ...(filters.ownerId === undefined
        ? {}
        : { wallet: { restaurant: { ownerId: filters.ownerId } } }),
      ...(filters.transactionType === undefined
        ? {}
        : { transactionType: filters.transactionType }),
      ...(filters.orderId === undefined ? {} : { orderId: filters.orderId }),
      ...(filters.search === undefined
        ? {}
        : { description: { contains: filters.search, mode: "insensitive" } }),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.walletTransaction.findMany({
        where,
        select: walletTransactionSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return { items, totalItems };
  }

  public async getSummary(walletId: string): Promise<{
    totalCredits: Prisma.Decimal;
    totalDebits: Prisma.Decimal;
    totalSettlements: Prisma.Decimal;
    totalCommissions: Prisma.Decimal;
    transactionCount: number;
  }> {
    const [credit, debit, settlement, commission, transactionCount] = await prisma.$transaction([
      prisma.walletTransaction.aggregate({
        where: { walletId, transactionType: "CREDIT" },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { walletId, transactionType: "DEBIT" },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { walletId, transactionType: "SETTLEMENT" },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { walletId, transactionType: "COMMISSION" },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.count({ where: { walletId } }),
    ]);

    return {
      totalCredits: credit._sum.amount ?? new Prisma.Decimal(0),
      totalDebits: debit._sum.amount ?? new Prisma.Decimal(0),
      totalSettlements: settlement._sum.amount ?? new Prisma.Decimal(0),
      totalCommissions: commission._sum.amount ?? new Prisma.Decimal(0),
      transactionCount,
    };
  }

  public async getAnalytics(filters: { restaurantId?: string; ownerId?: string } = {}) {
    const whereWallet: Prisma.RestaurantWalletWhereInput = {
      ...(filters.restaurantId === undefined ? {} : { restaurantId: filters.restaurantId }),
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
    };

    const wallets = await prisma.restaurantWallet.findMany({ where: whereWallet, select: { id: true, availableBalance: true, pendingBalance: true, lifetimeEarnings: true } });

    const availableBalance = wallets.reduce((s, w) => s + Number(w.availableBalance.toString()), 0);
    const pendingBalance = wallets.reduce((s, w) => s + Number(w.pendingBalance.toString()), 0);
    const lifetimeEarnings = wallets.reduce((s, w) => s + Number(w.lifetimeEarnings.toString()), 0);

    // orders this week and average order value
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const orderWhere: Prisma.OrderWhereInput = {
      createdAt: { gte: weekAgo },
      ...(filters.restaurantId === undefined ? {} : { restaurantId: filters.restaurantId }),
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
      status: { not: "CANCELLED" },
    } as any;

    const [ordersThisWeek, avgResult] = await prisma.$transaction([
      prisma.order.count({ where: orderWhere }),
      prisma.order.aggregate({ where: { ...(filters.restaurantId === undefined ? {} : { restaurantId: filters.restaurantId }), ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }), status: { not: "CANCELLED" } }, _avg: { totalAmount: true } }),
    ]);

    const averageOrderValue = Number(avgResult._avg.totalAmount ?? 0);

    const commissionAgg = await prisma.walletTransaction.aggregate({ where: { transactionType: "COMMISSION", ...(filters.restaurantId === undefined ? {} : { wallet: { restaurantId: filters.restaurantId } }), ...(filters.ownerId === undefined ? {} : { wallet: { restaurant: { ownerId: filters.ownerId } } }) }, _sum: { amount: true } });

    return {
      availableBalance,
      pendingBalance,
      lifetimeEarnings,
      ordersThisWeek,
      averageOrderValue,
      commissionPaid: Number(commissionAgg._sum.amount ?? 0),
    };
  }

  public async getRevenueChart(filters: { restaurantId?: string; ownerId?: string } = {}, days = 7) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));

    const where: Prisma.OrderWhereInput = {
      createdAt: { gte: start },
      ...(filters.restaurantId === undefined ? {} : { restaurantId: filters.restaurantId }),
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
      status: { not: "CANCELLED" },
    } as any;

    const orders = await prisma.order.findMany({ where, select: { createdAt: true, totalAmount: true } });

    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      labels.push(iso);
      const daySum = orders.reduce((s, o) => (o.createdAt.toISOString().slice(0, 10) === iso ? s + Number(o.totalAmount.toString()) : s), 0);
      values.push(daySum);
    }

    return { labels, values };
  }
}

export const walletRepository = new WalletRepository();
