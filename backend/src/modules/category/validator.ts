import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const idParamsSchema = z.object({
  id: z.string().uuid(),
});
const restaurantIdParamsSchema = z.object({
  restaurantId: z.string().uuid(),
});

const categoryFields = {
  restaurantId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1_000).nullable().optional(),
} as const;

const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const createCategorySchema = z.object({
  body: z.object(categoryFields).strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const listCategoriesSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: paginationQuerySchema,
});

export const listRestaurantCategoriesSchema = z.object({
  body: z.unknown(),
  params: restaurantIdParamsSchema,
  query: paginationQuerySchema,
});

export const categoryIdSchema = z.object({
  body: z.unknown(),
  params: idParamsSchema,
  query: emptyObjectSchema,
});

export const updateCategorySchema = z.object({
  body: z
    .object({
      restaurantId: categoryFields.restaurantId.optional(),
      name: categoryFields.name.optional(),
      description: categoryFields.description,
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, "At least one field is required"),
  params: idParamsSchema,
  query: emptyObjectSchema,
});
