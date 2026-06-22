import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();

export const addCartItemSchema = z.object({
  body: z
    .object({
      menuItemId: z.string().uuid(),
      quantity: z.coerce.number().int().min(1).max(99),
    })
    .strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const updateCartItemSchema = z.object({
  body: z
    .object({
      quantity: z.coerce.number().int().min(1).max(99),
    })
    .strict(),
  params: z.object({
    itemId: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});

export const cartItemIdSchema = z.object({
  body: z.unknown(),
  params: z.object({
    itemId: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});

export const getCartSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});
