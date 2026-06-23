import type { SettlementStatus } from "@prisma/client";
import type { Role } from "../../constants/roles.js";

export interface SettlementParamsDTO {
  id: string;
}

export interface RequestSettlementDTO {
  restaurantId?: string;
  amount: number;
  remarks?: string | null;
}

export interface RejectSettlementDTO {
  remarks?: string | null;
}

export interface MarkSettlementPaidDTO {
  referenceNumber: string;
  remarks?: string | null;
}

export interface ListSettlementsQueryDTO {
  page: number;
  limit: number;
  restaurantId?: string;
  status?: SettlementStatus;
  search?: string;
}

export interface SettlementResponseDTO {
  id: string;
  restaurantId: string;
  walletId: string;
  amount: number;
  status: SettlementStatus;
  referenceNumber: string | null;
  remarks: string | null;
  requestedAt: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SettlementListResponseDTO {
  items: SettlementResponseDTO[];
  pagination: PaginationDTO;
}

export interface CommissionCalculationDTO {
  orderAmount: number;
  platformCommissionPercent: number;
  restaurantSharePercent: number;
  platformCommission: number;
  restaurantShare: number;
}

export interface SettlementActorDTO {
  id: string;
  role: Role;
}
