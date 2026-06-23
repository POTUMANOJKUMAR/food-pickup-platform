import { Prisma } from "@prisma/client";
import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import {
  settlementRepository,
  type SettlementRecord,
  type SettlementRepository,
} from "./repository.js";
import type {
  CommissionCalculationDTO,
  ListSettlementsQueryDTO,
  MarkSettlementPaidDTO,
  RejectSettlementDTO,
  RequestSettlementDTO,
  SettlementActorDTO,
  SettlementListResponseDTO,
  SettlementResponseDTO,
} from "./types.js";

const PLATFORM_COMMISSION_PERCENT = 5;

const toSettlementResponse = (settlement: SettlementRecord): SettlementResponseDTO => ({
  id: settlement.id,
  restaurantId: settlement.restaurantId,
  walletId: settlement.walletId,
  amount: settlement.amount.toNumber(),
  status: settlement.status,
  referenceNumber: settlement.referenceNumber,
  remarks: settlement.remarks,
  requestedAt: settlement.requestedAt.toISOString(),
  processedAt: settlement.processedAt?.toISOString() ?? null,
  createdAt: settlement.createdAt.toISOString(),
  updatedAt: settlement.updatedAt.toISOString(),
});

const normalizeRemarks = (remarks: string | null | undefined): string | null | undefined => {
  if (remarks === undefined) {
    return undefined;
  }

  if (remarks === null) {
    return null;
  }

  const trimmed = remarks.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export class CommissionEngine {
  public static calculate(
    orderAmount: Prisma.Decimal | number,
    platformCommissionPercent = PLATFORM_COMMISSION_PERCENT,
  ): CommissionCalculationDTO {
    const amount = new Prisma.Decimal(orderAmount);
    const commission = amount
      .mul(platformCommissionPercent)
      .div(100)
      .toDecimalPlaces(2);
    const restaurantShare = amount.sub(commission).toDecimalPlaces(2);

    return {
      orderAmount: amount.toNumber(),
      platformCommissionPercent,
      restaurantSharePercent: 100 - platformCommissionPercent,
      platformCommission: commission.toNumber(),
      restaurantShare: restaurantShare.toNumber(),
    };
  }
}

export class SettlementService {
  public constructor(private readonly repository: SettlementRepository) {}

  public async request(
    input: RequestSettlementDTO,
    actor: SettlementActorDTO,
  ): Promise<SettlementResponseDTO> {
    if (actor.role !== Role.RESTAURANT_OWNER) {
      throw new AppError("Only restaurant owners can request settlements", 403);
    }

    const restaurant = await this.repository.findOwnerRestaurant(actor.id, input.restaurantId);

    if (restaurant === null) {
      throw new AppError("Restaurant not found", 404);
    }

    const wallet = await this.repository.getOrCreateWallet(restaurant.id);
    const amount = new Prisma.Decimal(input.amount).toDecimalPlaces(2);

    if (wallet.availableBalance.lessThan(amount)) {
      throw new AppError("Insufficient wallet balance", 400);
    }

    try {
      const remarks = normalizeRemarks(input.remarks);
      const settlement = await this.repository.request({
        restaurantId: restaurant.id,
        walletId: wallet.id,
        amount,
        ...(remarks === undefined ? {} : { remarks }),
      });
      return toSettlementResponse(settlement);
    } catch (error) {
      if (error instanceof Error && error.message === "Insufficient wallet balance") {
        throw new AppError("Insufficient wallet balance", 400);
      }
      throw error;
    }
  }

  public async list(
    actor: SettlementActorDTO,
    query: ListSettlementsQueryDTO,
  ): Promise<SettlementListResponseDTO> {
    const result = await this.repository.findList(query.page, query.limit, {
      ...(query.restaurantId === undefined ? {} : { restaurantId: query.restaurantId }),
      ...(actor.role === Role.RESTAURANT_OWNER ? { ownerId: actor.id } : {}),
      ...(query.status === undefined ? {} : { status: query.status }),
      ...(query.search === undefined ? {} : { search: query.search }),
    });
    const totalPages = Math.ceil(result.totalItems / query.limit);

    return {
      items: result.items.map(toSettlementResponse),
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

  public async getById(id: string, actor: SettlementActorDTO): Promise<SettlementResponseDTO> {
    const settlement = await this.getAccessibleSettlement(id, actor);
    return toSettlementResponse(settlement);
  }

  public async approve(id: string, actor: SettlementActorDTO): Promise<SettlementResponseDTO> {
    this.ensureAdmin(actor);
    const settlement = await this.getExistingSettlement(id);

    if (settlement.status !== "PENDING") {
      throw new AppError("Only pending settlements can be approved", 400);
    }

    const updated = await this.repository.updateStatus({
      id,
      status: "APPROVED",
      processedAt: new Date(),
    });
    return toSettlementResponse(updated);
  }

  public async reject(
    id: string,
    input: RejectSettlementDTO,
    actor: SettlementActorDTO,
  ): Promise<SettlementResponseDTO> {
    this.ensureAdmin(actor);
    const settlement = await this.getExistingSettlement(id);

    if (settlement.status !== "PENDING" && settlement.status !== "APPROVED") {
      throw new AppError("Settlement cannot be rejected", 400);
    }

    const remarks = normalizeRemarks(input.remarks);
    const updated = await this.repository.rejectAndRefund({
      id,
      walletId: settlement.walletId,
      amount: settlement.amount,
      ...(remarks === undefined ? {} : { remarks }),
    });
    return toSettlementResponse(updated);
  }

  public async markPaid(
    id: string,
    input: MarkSettlementPaidDTO,
    actor: SettlementActorDTO,
  ): Promise<SettlementResponseDTO> {
    this.ensureAdmin(actor);
    const settlement = await this.getExistingSettlement(id);

    if (settlement.status !== "APPROVED" && settlement.status !== "PROCESSING") {
      throw new AppError("Only approved or processing settlements can be marked paid", 400);
    }

    const remarks = normalizeRemarks(input.remarks);
    const updated = await this.repository.markPaid({
      id,
      walletId: settlement.walletId,
      amount: settlement.amount,
      referenceNumber: input.referenceNumber.trim(),
      ...(remarks === undefined ? {} : { remarks }),
    });
    return toSettlementResponse(updated);
  }

  private async getExistingSettlement(id: string): Promise<SettlementRecord> {
    const settlement = await this.repository.findById(id);

    if (settlement === null) {
      throw new AppError("Settlement not found", 404);
    }

    return settlement;
  }

  private async getAccessibleSettlement(
    id: string,
    actor: SettlementActorDTO,
  ): Promise<SettlementRecord> {
    const settlement = await this.getExistingSettlement(id);

    if (actor.role === Role.ADMIN || settlement.restaurant.ownerId === actor.id) {
      return settlement;
    }

    throw new AppError("You are not authorized to access this settlement", 403);
  }

  private ensureAdmin(actor: SettlementActorDTO): void {
    if (actor.role !== Role.ADMIN) {
      throw new AppError("Admin role required", 403);
    }
  }
}

export const settlementService = new SettlementService(settlementRepository);
