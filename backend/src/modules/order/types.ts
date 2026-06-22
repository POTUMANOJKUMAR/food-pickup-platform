import type { OrderStatus, PaymentStatus } from "@prisma/client";
import type { Role } from "../../constants/roles.js";

export interface OrderParamsDTO {
  id: string;
}

export interface UpdateOrderStatusRequestDTO {
  status: OrderStatus;
}

export interface ListOrdersQueryDTO {
  page: number;
  limit: number;
  status?: OrderStatus;
}

export interface OrderItemResponseDTO {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
}

export interface OrderResponseDTO {
  id: string;
  orderNumber: string;
  userId: string;
  restaurantId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  pickupCode: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  cancelledAt: string | null;
  paidAt: string | null;
  items: OrderItemResponseDTO[];
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

export interface OrderListResponseDTO {
  items: OrderResponseDTO[];
  pagination: PaginationDTO;
}

export interface OrderActorDTO {
  id: string;
  role: Role;
}
