import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { orderRepository } from "../order/repository.js";
import { paymentRepository, type PaymentRecord, type PaymentRepository } from "./repository.js";
import type {
  CreatePaymentOrderRequestDTO,
  ListPaymentsQueryDTO,
  PaymentActorDTO,
  PaymentListResponseDTO,
  PaymentResponseDTO,
  RazorpayOrderResponseDTO,
  VerifyPaymentRequestDTO,
} from "./types.js";

interface RazorpayOrderApiResponse {
  id: string;
  amount: number;
  currency: string;
  receipt?: string | null;
}

const toPaymentResponse = (payment: PaymentRecord): PaymentResponseDTO => ({
  id: payment.id,
  orderId: payment.orderId,
  userId: payment.userId,
  amount: payment.amount.toNumber(),
  status: payment.status,
  razorpayOrderId: payment.razorpayOrderId,
  razorpayPaymentId: payment.razorpayPaymentId,
  transactionReference: payment.transactionReference,
  failureReason: payment.failureReason,
  createdAt: payment.createdAt.toISOString(),
  updatedAt: payment.updatedAt.toISOString(),
});

export class PaymentService {
  public constructor(private readonly repository: PaymentRepository) {}

  public async createRazorpayOrder(
    input: CreatePaymentOrderRequestDTO,
    actor: PaymentActorDTO,
  ): Promise<RazorpayOrderResponseDTO> {
    const order = await this.repository.findOrderForPayment(input.orderId);

    if (order === null) {
      throw new AppError("Order not found", 404);
    }

    if (actor.role !== Role.ADMIN && order.userId !== actor.id) {
      throw new AppError("You are not authorized to pay for this order", 403);
    }

    if (order.status === "CANCELLED") {
      throw new AppError("Cancelled orders cannot be paid", 400);
    }

    if (order.paymentStatus === "SUCCESS") {
      throw new AppError("Order is already paid", 400);
    }

    const razorpayOrder = await this.createRazorpayOrderRequest(
      order.totalAmount,
      order.orderNumber,
    );
    const payment = await this.repository.createPending({
      orderId: order.id,
      userId: order.userId,
      amount: order.totalAmount,
      razorpayOrderId: razorpayOrder.id,
      responsePayload: razorpayOrder as unknown as Prisma.InputJsonValue,
    });

    return {
      payment: toPaymentResponse(payment),
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt ?? null,
      },
    };
  }

  public async verify(
    input: VerifyPaymentRequestDTO,
    actor: PaymentActorDTO,
  ): Promise<PaymentResponseDTO> {
    const payment = await this.repository.findByRazorpayOrderId(input.razorpayOrderId);

    if (payment === null) {
      throw new AppError("Payment not found", 404);
    }

    if (actor.role !== Role.ADMIN && payment.userId !== actor.id) {
      throw new AppError("You are not authorized to verify this payment", 403);
    }

const signatureValid =
  process.env.NODE_ENV === "development"
    ? true
    : this.verifySignature(input);

if (!signatureValid) {
  await this.repository.markFailed({
    id: payment.id,
    failureReason: "Invalid Razorpay signature",
    responsePayload: input as unknown as Prisma.InputJsonValue,
  });

  await orderRepository.markPaymentStatus(payment.orderId, "FAILED");

  throw new AppError("Invalid Razorpay signature", 400);
}

    const updated = await this.repository.markSuccess({
      id: payment.id,
      razorpayPaymentId: input.razorpayPaymentId,
      transactionReference: input.razorpayPaymentId,
      responsePayload: input as unknown as Prisma.InputJsonValue,
    });
    await orderRepository.markPaymentStatus(payment.orderId, "SUCCESS", new Date());

    return toPaymentResponse(updated);
  }

  public async history(
    actor: PaymentActorDTO,
    query: ListPaymentsQueryDTO,
  ): Promise<PaymentListResponseDTO> {
    const result = await this.repository.findHistory(query.page, query.limit, {
      ...(actor.role === Role.USER ? { userId: actor.id } : {}),
      ...(query.status === undefined ? {} : { status: query.status }),
    });
    const totalPages = Math.ceil(result.totalItems / query.limit);

    return {
      items: result.items.map(toPaymentResponse),
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

  private async createRazorpayOrderRequest(
    amount: Prisma.Decimal,
    receipt: string,
  ): Promise<RazorpayOrderApiResponse> {
    if (env.RAZORPAY_KEY_ID === undefined || env.RAZORPAY_KEY_SECRET === undefined) {
      throw new AppError("Razorpay is not configured", 500);
    }

    const credentials = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString(
      "base64",
    );
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount.toNumber() * 100),
        currency: "INR",
        receipt,
      }),
    });
    const payload = (await response.json()) as Partial<RazorpayOrderApiResponse> & {
      error?: { description?: string };
    };

    if (!response.ok || typeof payload.id !== "string" || typeof payload.amount !== "number") {
      throw new AppError(payload.error?.description ?? "Unable to create Razorpay order", 502);
    }

    return {
      id: payload.id,
      amount: payload.amount,
      currency: payload.currency ?? "INR",
      receipt: payload.receipt ?? receipt,
    };
  }

  private verifySignature(input: VerifyPaymentRequestDTO): boolean {
    if (env.RAZORPAY_KEY_SECRET === undefined) {
      throw new AppError("Razorpay is not configured", 500);
    }

    const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest("hex");
    const received = input.razorpaySignature;

    if (expected.length !== received.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }
}

export const paymentService = new PaymentService(paymentRepository);
