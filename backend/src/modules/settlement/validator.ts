import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const settlementStatusSchema = z.enum(["PENDING", "APPROVED", "PROCESSING", "PAID", "REJECTED"]);

export const requestSettlementSchema = z.object({
  body: z
    .object({
      restaurantId: z.string().uuid().optional(),
      amount: z.number().positive(),
      remarks: z.string().trim().max(2000).nullable().optional(),
    })
    .strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const listSettlementsSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      restaurantId: z.string().uuid().optional(),
      status: settlementStatusSchema.optional(),
      search: z.string().trim().min(1).max(100).optional(),
    })
    .strict(),
});

export const settlementIdSchema = z.object({
  body: z.unknown(),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});

export const rejectSettlementSchema = z.object({
  body: z
    .object({
      remarks: z.string().trim().max(2000).nullable().optional(),
    })
    .strict(),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});

export const markSettlementPaidSchema = z.object({
  body: z
    .object({
      referenceNumber: z.string().trim().min(1).max(100),
      remarks: z.string().trim().max(2000).nullable().optional(),
    })
    .strict(),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});
