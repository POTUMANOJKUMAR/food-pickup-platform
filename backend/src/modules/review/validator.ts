import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    restaurantId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const createReviewSchema = z.object({
  body: z
    .object({
      orderId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().trim().max(2000).nullable().optional(),
    })
    .strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const listReviewsSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: listQuerySchema,
});

export const reviewIdSchema = z.object({
  body: z.unknown(),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});

export const updateReviewSchema = z.object({
  body: z
    .object({
      rating: z.number().int().min(1).max(5).optional(),
      comment: z.string().trim().max(2000).nullable().optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, "At least one field is required"),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});

export const restaurantReviewsSchema = z.object({
  body: z.unknown(),
  params: z.object({
    restaurantId: z.string().uuid(),
  }),
  query: listQuerySchema.omit({ restaurantId: true }),
});

export const ratingSummarySchema = z.object({
  body: z.unknown(),
  params: z.object({
    restaurantId: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});
