import { Prisma, type SettlementStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const settlementSelect = {
  id: true,
  restaurantId: true,
  walletId: true,
  amount: true,
  status: true,
  referenceNumber: true,
  remarks: true,
  requestedAt: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true,
  restaurant: {
    select: {
      ownerId: true,
    },
  },
  wallet: {
    select: {
      availableBalance: true,
    },
  },
} satisfies Prisma.SettlementSelect;

const settlementWalletSelect = {
  id: true,
  restaurantId: true,
  availableBalance: true,
  restaurant: {
    select: {
      ownerId: true,
    },
  },
} satisfies Prisma.RestaurantWalletSelect;

export type SettlementRecord = Prisma.SettlementGetPayload<{ select: typeof settlementSelect }>;
export type SettlementWalletRecord = Prisma.RestaurantWalletGetPayload<{
  select: typeof settlementWalletSelect;
}>;

interface SettlementListFilters {
  restaurantId?: string;
  ownerId?: string;
  status?: SettlementStatus;
  search?: string;
}

interface SettlementListResult {
  items: SettlementRecord[];
  totalItems: number;
}

export class SettlementRepository {
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

  public async getOrCreateWallet(restaurantId: string): Promise<SettlementWalletRecord> {
    return prisma.restaurantWallet.upsert({
      where: { restaurantId },
      update: {},
      create: { restaurantId },
      select: settlementWalletSelect,
    });
  }

  public async request(data: {
    restaurantId: string;
    walletId: string;
    amount: Prisma.Decimal;
    remarks?: string | null;
  }): Promise<SettlementRecord> {
    return prisma.$transaction(async (transaction) => {
      const wallet = await transaction.restaurantWallet.findUniqueOrThrow({
        where: { id: data.walletId },
        select: { availableBalance: true },
      });

      if (wallet.availableBalance.lessThan(data.amount)) {
        throw new Error("Insufficient wallet balance");
      }

      await transaction.restaurantWallet.update({
        where: { id: data.walletId },
        data: { availableBalance: { decrement: data.amount } },
      });
      await transaction.walletTransaction.create({
        data: {
          walletId: data.walletId,
          amount: data.amount,
          transactionType: "DEBIT",
          description: "Settlement requested and balance reserved",
        },
      });

      const settlement = await transaction.settlement.create({
        data: {
          restaurantId: data.restaurantId,
          walletId: data.walletId,
          amount: data.amount,
          ...(data.remarks === undefined ? {} : { remarks: data.remarks }),
        },
        select: { id: true },
      });

      return transaction.settlement.findUniqueOrThrow({
        where: { id: settlement.id },
        select: settlementSelect,
      });
    });
  }

  public async findList(
    page: number,
    limit: number,
    filters: SettlementListFilters = {},
  ): Promise<SettlementListResult> {
    const where: Prisma.SettlementWhereInput = {
      ...(filters.restaurantId === undefined ? {} : { restaurantId: filters.restaurantId }),
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
      ...(filters.status === undefined ? {} : { status: filters.status }),
      ...(filters.search === undefined
        ? {}
        : {
            OR: [
              { referenceNumber: { contains: filters.search, mode: "insensitive" } },
              { remarks: { contains: filters.search, mode: "insensitive" } },
            ],
          }),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.settlement.findMany({
        where,
        select: settlementSelect,
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.settlement.count({ where }),
    ]);

    return { items, totalItems };
  }

  public findById(id: string): Promise<SettlementRecord | null> {
    return prisma.settlement.findUnique({
      where: { id },
      select: settlementSelect,
    });
  }

  public updateStatus(data: {
    id: string;
    status: SettlementStatus;
    remarks?: string | null;
    referenceNumber?: string | null;
    processedAt?: Date | null;
  }): Promise<SettlementRecord> {
    return prisma.settlement.update({
      where: { id: data.id },
      data: {
        status: data.status,
        ...(data.remarks === undefined ? {} : { remarks: data.remarks }),
        ...(data.referenceNumber === undefined ? {} : { referenceNumber: data.referenceNumber }),
        ...(data.processedAt === undefined ? {} : { processedAt: data.processedAt }),
      },
      select: settlementSelect,
    });
  }

  public async rejectAndRefund(data: {
    id: string;
    walletId: string;
    amount: Prisma.Decimal;
    remarks?: string | null;
  }): Promise<SettlementRecord> {
    return prisma.$transaction(async (transaction) => {
      await transaction.restaurantWallet.update({
        where: { id: data.walletId },
        data: { availableBalance: { increment: data.amount } },
      });
      await transaction.walletTransaction.create({
        data: {
          walletId: data.walletId,
          amount: data.amount,
          transactionType: "CREDIT",
          description: "Rejected settlement refunded to available balance",
        },
      });

      await transaction.settlement.update({
        where: { id: data.id },
        data: {
          status: "REJECTED",
          ...(data.remarks === undefined ? {} : { remarks: data.remarks }),
          processedAt: new Date(),
        },
        select: { id: true },
      });

      return transaction.settlement.findUniqueOrThrow({
        where: { id: data.id },
        select: settlementSelect,
      });
    });
  }

  public async markPaid(data: {
    id: string;
    walletId: string;
    amount: Prisma.Decimal;
    referenceNumber: string;
    remarks?: string | null;
  }): Promise<SettlementRecord> {
    return prisma.$transaction(async (transaction) => {
      await transaction.walletTransaction.create({
        data: {
          walletId: data.walletId,
          amount: data.amount,
          transactionType: "SETTLEMENT",
          description: "Settlement paid to restaurant",
        },
      });

      await transaction.settlement.update({
        where: { id: data.id },
        data: {
          status: "PAID",
          referenceNumber: data.referenceNumber,
          ...(data.remarks === undefined ? {} : { remarks: data.remarks }),
          processedAt: new Date(),
        },
        select: { id: true },
      });

      return transaction.settlement.findUniqueOrThrow({
        where: { id: data.id },
        select: settlementSelect,
      });
    });
  }

  public async getSummary(filters: { ownerId?: string } = {}) {
    const walletWhere: Prisma.RestaurantWalletWhereInput = {
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
    };

    const walletAgg = await prisma.restaurantWallet.aggregate({ where: walletWhere, _sum: { availableBalance: true, pendingBalance: true } });

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const settledThisMonthAgg = await prisma.settlement.aggregate({ where: { status: "PAID", processedAt: { gte: firstOfMonth }, ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }) }, _sum: { amount: true } });

    return {
      availableToSettle: Number(walletAgg._sum.availableBalance ?? 0),
      inTransit: Number(walletAgg._sum.pendingBalance ?? 0),
      settledThisMonth: Number(settledThisMonthAgg._sum.amount ?? 0),
    };
  }
}

export const settlementRepository = new SettlementRepository();
