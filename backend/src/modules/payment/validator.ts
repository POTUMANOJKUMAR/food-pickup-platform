import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const paymentStatusSchema = z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]);

export const createPaymentOrderSchema = z.object({
  body: z
    .object({
      orderId: z.string().uuid(),
    })
    .strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const verifyPaymentSchema = z.object({
  body: z
    .object({
      razorpayOrderId: z.string().trim().min(1).max(100),
      razorpayPaymentId: z.string().trim().min(1).max(100),
      razorpaySignature: z.string().trim().min(1).max(256),
    })
    .strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const paymentHistorySchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      status: paymentStatusSchema.optional(),
    })
    .strict(),
});
