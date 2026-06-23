import type { WalletTransactionType } from "@prisma/client";
import type { Role } from "../../constants/roles.js";

export interface WalletQueryDTO {
  restaurantId?: string;
}

export interface ListWalletTransactionsQueryDTO {
  page: number;
  limit: number;
  restaurantId?: string;
  transactionType?: WalletTransactionType;
  orderId?: string;
  search?: string;
}

export interface WalletResponseDTO {
  id: string;
  restaurantId: string;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionResponseDTO {
  id: string;
  walletId: string;
  orderId: string | null;
  amount: number;
  transactionType: WalletTransactionType;
  description: string | null;
  createdAt: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface WalletTransactionListResponseDTO {
  items: WalletTransactionResponseDTO[];
  pagination: PaginationDTO;
}

export interface WalletSummaryResponseDTO {
  wallet: WalletResponseDTO;
  totalCredits: number;
  totalDebits: number;
  totalSettlements: number;
  totalCommissions: number;
  transactionCount: number;
}

export interface WalletActorDTO {
  id: string;
  role: Role;
}
