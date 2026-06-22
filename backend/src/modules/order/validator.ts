import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
]);

export const createOrderSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const listOrdersSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      status: orderStatusSchema.optional(),
    })
    .strict(),
});

export const orderIdSchema = z.object({
  body: z.unknown(),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});

export const updateOrderStatusSchema = z.object({
  body: z
    .object({
      status: orderStatusSchema,
    })
    .strict(),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});
