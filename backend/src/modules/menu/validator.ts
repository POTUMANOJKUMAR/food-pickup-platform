import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const idParamsSchema = z.object({
  id: z.string().uuid(),
});
const restaurantIdParamsSchema = z.object({
  restaurantId: z.string().uuid(),
});
const categoryIdParamsSchema = z.object({
  categoryId: z.string().uuid(),
});

const menuItemFields = {
  restaurantId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2_000).nullable().optional(),
  price: z.coerce.number().positive().max(999_999.99),
  imageUrl: z.string().trim().url().max(500).nullable().optional(),
  isAvailable: z.boolean().optional(),
  preparationTime: z.coerce.number().int().positive().max(240),
} as const;

const menuListQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
    categoryId: z.string().uuid().optional(),
    isAvailable: z.coerce.boolean().optional(),
    sortByPrice: z.enum(["asc", "desc"]).optional(),
  })
  .strict();

export const createMenuItemSchema = z.object({
  body: z.object(menuItemFields).strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const listMenuItemsSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: menuListQuerySchema,
});

export const listRestaurantMenuSchema = z.object({
  body: z.unknown(),
  params: restaurantIdParamsSchema,
  query: menuListQuerySchema,
});

export const listCategoryMenuSchema = z.object({
  body: z.unknown(),
  params: categoryIdParamsSchema,
  query: menuListQuerySchema.omit({ categoryId: true }),
});

export const menuItemIdSchema = z.object({
  body: z.unknown(),
  params: idParamsSchema,
  query: emptyObjectSchema,
});

export const updateMenuItemSchema = z.object({
  body: z
    .object({
      restaurantId: menuItemFields.restaurantId.optional(),
      categoryId: menuItemFields.categoryId.optional(),
      name: menuItemFields.name.optional(),
      description: menuItemFields.description,
      price: menuItemFields.price.optional(),
      imageUrl: menuItemFields.imageUrl,
      isAvailable: z.boolean().optional(),
      preparationTime: menuItemFields.preparationTime.optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, "At least one field is required"),
  params: idParamsSchema,
  query: emptyObjectSchema,
});
