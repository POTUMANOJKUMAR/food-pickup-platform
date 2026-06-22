import type { PaymentStatus } from "@prisma/client";
import type { Role } from "../../constants/roles.js";

export interface CreatePaymentOrderRequestDTO {
  orderId: string;
}

export interface VerifyPaymentRequestDTO {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface ListPaymentsQueryDTO {
  page: number;
  limit: number;
  status?: PaymentStatus;
}

export interface PaymentResponseDTO {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  transactionReference: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayOrderResponseDTO {
  payment: PaymentResponseDTO;
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
    receipt: string | null;
  };
}

export interface PaginationDTO {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaymentListResponseDTO {
  items: PaymentResponseDTO[];
  pagination: PaginationDTO;
}

export interface PaymentActorDTO {
  id: string;
  role: Role;
}
