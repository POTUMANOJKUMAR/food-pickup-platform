import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const walletTransactionTypeSchema = z.enum(["CREDIT", "DEBIT", "SETTLEMENT", "COMMISSION"]);

export const walletQuerySchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: z
    .object({
      restaurantId: z.string().uuid().optional(),
    })
    .strict(),
});

export const walletTransactionsSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      restaurantId: z.string().uuid().optional(),
      transactionType: walletTransactionTypeSchema.optional(),
      orderId: z.string().uuid().optional(),
      search: z.string().trim().min(1).max(100).optional(),
    })
    .strict(),
});
