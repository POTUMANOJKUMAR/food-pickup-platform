import { Prisma } from "@prisma/client";
import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { CommissionEngine } from "../settlement/service.js";
import {
  walletRepository,
  type WalletRecord,
  type WalletRepository,
  type WalletTransactionRecord,
} from "./repository.js";
import type {
  ListWalletTransactionsQueryDTO,
  WalletActorDTO,
  WalletQueryDTO,
  WalletResponseDTO,
  WalletSummaryResponseDTO,
  WalletTransactionListResponseDTO,
  WalletTransactionResponseDTO,
} from "./types.js";

const toWalletResponse = (wallet: WalletRecord): WalletResponseDTO => ({
  id: wallet.id,
  restaurantId: wallet.restaurantId,
  availableBalance: wallet.availableBalance.toNumber(),
  pendingBalance: wallet.pendingBalance.toNumber(),
  lifetimeEarnings: wallet.lifetimeEarnings.toNumber(),
  createdAt: wallet.createdAt.toISOString(),
  updatedAt: wallet.updatedAt.toISOString(),
});

const toWalletTransactionResponse = (
  transaction: WalletTransactionRecord,
): WalletTransactionResponseDTO => ({
  id: transaction.id,
  walletId: transaction.walletId,
  orderId: transaction.orderId,
  amount: transaction.amount.toNumber(),
  transactionType: transaction.transactionType,
  description: transaction.description,
  createdAt: transaction.createdAt.toISOString(),
});

export class WalletService {
  public constructor(private readonly repository: WalletRepository) {}

  public async getWallet(
    actor: WalletActorDTO,
    query: WalletQueryDTO = {},
  ): Promise<WalletResponseDTO> {
    const restaurantId = await this.resolveRestaurantId(actor, query.restaurantId);
    const wallet = await this.repository.getOrCreateByRestaurantId(restaurantId);
    this.ensureCanAccessWallet(wallet, actor);
    return toWalletResponse(wallet);
  }

  public async transactions(
    actor: WalletActorDTO,
    query: ListWalletTransactionsQueryDTO,
  ): Promise<WalletTransactionListResponseDTO> {
    const restaurantId =
      actor.role === Role.RESTAURANT_OWNER
        ? await this.resolveRestaurantId(actor, query.restaurantId)
        : query.restaurantId;
    const result = await this.repository.findTransactions(query.page, query.limit, {
      ...(restaurantId === undefined ? {} : { restaurantId }),
      ...(actor.role === Role.RESTAURANT_OWNER ? { ownerId: actor.id } : {}),
      ...(query.transactionType === undefined ? {} : { transactionType: query.transactionType }),
      ...(query.orderId === undefined ? {} : { orderId: query.orderId }),
      ...(query.search === undefined ? {} : { search: query.search }),
    });
    const totalPages = Math.ceil(result.totalItems / query.limit);

    return {
      items: result.items.map(toWalletTransactionResponse),
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

  public async summary(
    actor: WalletActorDTO,
    query: WalletQueryDTO = {},
  ): Promise<WalletSummaryResponseDTO> {
    const restaurantId = await this.resolveRestaurantId(actor, query.restaurantId);
    const wallet = await this.repository.getOrCreateByRestaurantId(restaurantId);
    this.ensureCanAccessWallet(wallet, actor);
    const summary = await this.repository.getSummary(wallet.id);

    return {
      wallet: toWalletResponse(wallet),
      totalCredits: summary.totalCredits.toNumber(),
      totalDebits: summary.totalDebits.toNumber(),
      totalSettlements: summary.totalSettlements.toNumber(),
      totalCommissions: summary.totalCommissions.toNumber(),
      transactionCount: summary.transactionCount,
    };
  }

  public async analytics(
    actor: WalletActorDTO,
    query: WalletQueryDTO = {},
  ): Promise<{
    availableBalance: number;
    pendingBalance: number;
    lifetimeEarnings: number;
    ordersThisWeek: number;
    averageOrderValue: number;
    commissionPaid: number;
  }> {
    const restaurantId = actor.role === Role.RESTAURANT_OWNER ? await this.resolveRestaurantId(actor, query.restaurantId) : query.restaurantId;
    const filters: { restaurantId?: string; ownerId?: string } =
      actor.role === Role.RESTAURANT_OWNER
        ? { ownerId: actor.id }
        : restaurantId === undefined
        ? {}
        : { restaurantId };
    const result = await this.repository.getAnalytics(filters);
    return {
      availableBalance: result.availableBalance,
      pendingBalance: result.pendingBalance,
      lifetimeEarnings: result.lifetimeEarnings,
      ordersThisWeek: result.ordersThisWeek,
      averageOrderValue: result.averageOrderValue,
      commissionPaid: result.commissionPaid,
    };
  }

  public async revenueChart(
    actor: WalletActorDTO,
    query: WalletQueryDTO = {},
  ): Promise<{ labels: string[]; values: number[] }> {
    const restaurantId = actor.role === Role.RESTAURANT_OWNER ? await this.resolveRestaurantId(actor, query.restaurantId) : query.restaurantId;
    const filters: { restaurantId?: string; ownerId?: string } =
      actor.role === Role.RESTAURANT_OWNER
        ? { ownerId: actor.id }
        : restaurantId === undefined
        ? {}
        : { restaurantId };
    return this.repository.getRevenueChart(filters, 14);
  }

  public async creditPendingForPaidOrder(orderId: string): Promise<void> {
    const order = await this.repository.findOrderForWallet(orderId);

    if (order === null) {
      throw new AppError("Order not found", 404);
    }

    const commission = CommissionEngine.calculate(order.totalAmount);
    await this.repository.creditPendingForOrder({
      restaurantId: order.restaurantId,
      orderId: order.id,
      restaurantShare: new Prisma.Decimal(commission.restaurantShare),
      commissionAmount: new Prisma.Decimal(commission.platformCommission),
    });
  }

  public async releasePendingForCompletedOrder(orderId: string): Promise<void> {
    const order = await this.repository.findOrderForWallet(orderId);

    if (order === null) {
      throw new AppError("Order not found", 404);
    }

    if (order.status !== "COMPLETED") {
      throw new AppError("Only completed orders can release pending wallet balance", 400);
    }

    await this.repository.releasePendingForOrder({
      restaurantId: order.restaurantId,
      orderId: order.id,
    });
  }

  private async resolveRestaurantId(actor: WalletActorDTO, restaurantId?: string): Promise<string> {
    if (actor.role === Role.ADMIN) {
      if (restaurantId === undefined) {
        throw new AppError("Restaurant id is required", 400);
      }

      return restaurantId;
    }

    if (actor.role !== Role.RESTAURANT_OWNER) {
      throw new AppError("Only restaurant owners can access wallet", 403);
    }

    const restaurant = await this.repository.findOwnerRestaurant(actor.id, restaurantId);

    if (restaurant === null) {
      throw new AppError("Restaurant not found", 404);
    }

    return restaurant.id;
  }

  private ensureCanAccessWallet(wallet: WalletRecord, actor: WalletActorDTO): void {
    if (actor.role === Role.ADMIN) {
      return;
    }

    if (wallet.restaurant.ownerId !== actor.id) {
      throw new AppError("You are not authorized to access this wallet", 403);
    }
  }
}

export const walletService = new WalletService(walletRepository);
