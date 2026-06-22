import { Prisma, type PaymentStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const paymentSelect = {
  id: true,
  orderId: true,
  userId: true,
  amount: true,
  status: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
  transactionReference: true,
  responsePayload: true,
  failureReason: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      restaurant: {
        select: {
          ownerId: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

const orderForPaymentSelect = {
  id: true,
  orderNumber: true,
  userId: true,
  status: true,
  paymentStatus: true,
  totalAmount: true,
} satisfies Prisma.OrderSelect;

export type PaymentRecord = Prisma.PaymentGetPayload<{ select: typeof paymentSelect }>;
export type PaymentOrderRecord = Prisma.OrderGetPayload<{ select: typeof orderForPaymentSelect }>;

interface PaymentListFilters {
  userId?: string;
  status?: PaymentStatus;
}

interface PaymentListResult {
  items: PaymentRecord[];
  totalItems: number;
}

export class PaymentRepository {
  public findOrderForPayment(orderId: string): Promise<PaymentOrderRecord | null> {
    return prisma.order.findUnique({
      where: { id: orderId },
      select: orderForPaymentSelect,
    });
  }

  public createPending(data: {
    orderId: string;
    userId: string;
    amount: Prisma.Decimal;
    razorpayOrderId: string;
    responsePayload: Prisma.InputJsonValue;
  }): Promise<PaymentRecord> {
    return prisma.payment.create({
      data,
      select: paymentSelect,
    });
  }

  public findByRazorpayOrderId(razorpayOrderId: string): Promise<PaymentRecord | null> {
    return prisma.payment.findUnique({
      where: { razorpayOrderId },
      select: paymentSelect,
    });
  }

  public markSuccess(data: {
    id: string;
    razorpayPaymentId: string;
    transactionReference: string;
    responsePayload: Prisma.InputJsonValue;
  }): Promise<PaymentRecord> {
    return prisma.payment.update({
      where: { id: data.id },
      data: {
        status: "SUCCESS",
        razorpayPaymentId: data.razorpayPaymentId,
        transactionReference: data.transactionReference,
        responsePayload: data.responsePayload,
        failureReason: null,
      },
      select: paymentSelect,
    });
  }

  public markFailed(data: {
    id: string;
    failureReason: string;
    responsePayload?: Prisma.InputJsonValue;
  }): Promise<PaymentRecord> {
    return prisma.payment.update({
      where: { id: data.id },
      data: {
        status: "FAILED",
        failureReason: data.failureReason,
        ...(data.responsePayload === undefined ? {} : { responsePayload: data.responsePayload }),
      },
      select: paymentSelect,
    });
  }

  public async findHistory(
    page: number,
    limit: number,
    filters: PaymentListFilters = {},
  ): Promise<PaymentListResult> {
    const where: Prisma.PaymentWhereInput = {
      ...(filters.userId === undefined ? {} : { userId: filters.userId }),
      ...(filters.status === undefined ? {} : { status: filters.status }),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        select: paymentSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return { items, totalItems };
  }
}

export const paymentRepository = new PaymentRepository();
