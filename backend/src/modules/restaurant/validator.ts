import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const idParamsSchema = z.object({
  id: z.string().uuid(),
});
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");
const phoneSchema = z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, "Phone must be a valid international number");

const restaurantFields = {
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2_000).nullable().optional(),
  address: z.string().trim().min(5).max(500),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  phone: phoneSchema,
  openingTime: timeSchema,
  closingTime: timeSchema,
} as const;

export const createRestaurantSchema = z.object({
  body: z.object({
    ...restaurantFields,
    settings: z
      .object({
        tagline: z.string().trim().max(255).optional(),
        cuisine: z.string().trim().max(255).optional(),
        city: z.string().trim().max(100).optional(),
        state: z.string().trim().max(100).optional(),
        pincode: z.string().trim().max(20).optional(),
        email: z.string().email().optional(),
      })
      .optional(),
  }).strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const listRestaurantsSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      search: z.string().trim().min(1).max(100).optional(),
    })
    .strict(),
});

export const restaurantIdSchema = z.object({
  body: z.unknown(),
  params: idParamsSchema,
  query: emptyObjectSchema,
});

export const updateRestaurantSchema = z.object({
  body: z
    .object({
      name: restaurantFields.name.optional(),
      description: restaurantFields.description,
      address: restaurantFields.address.optional(),
      latitude: restaurantFields.latitude.optional(),
      longitude: restaurantFields.longitude.optional(),
      phone: restaurantFields.phone.optional(),
      openingTime: restaurantFields.openingTime.optional(),
      closingTime: restaurantFields.closingTime.optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, "At least one field is required"),
  params: idParamsSchema,
  query: emptyObjectSchema,
});

export const restaurantProfileQuerySchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: z.object({ restaurantId: z.string().uuid().optional() }).strict(),
});

export const updateRestaurantProfileSchema = z.object({
  body: z
    .object({
      name: restaurantFields.name.optional(),
      tagline: z.string().trim().max(255).optional(),
      description: restaurantFields.description,
      cuisine: z.string().trim().max(255).optional(),
      address: restaurantFields.address.optional(),
      city: z.string().trim().max(100).optional(),
      state: z.string().trim().max(100).optional(),
      pincode: z.string().trim().max(20).optional(),
      phone: restaurantFields.phone.optional(),
      email: z.string().email().optional(),
    })
    .strict()
    .refine((b) => Object.keys(b).length > 0, "At least one field is required"),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});
const validDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export const businessHoursSchema = z.object({
   body: z
    .array(
      z.object({
        day: z.enum(validDays),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        isOpen: z.boolean(),
      }),
    )
    .min(1, "At least one business day is required")
    .max(7, "Maximum 7 business days allowed")
    .refine(
      (arr) => {
        const days = arr.map((item) => item.day);
        return new Set(days).size === days.length;
      },
      {
        message: "Duplicate days are not allowed",
      },
    ),
  params: z.object({}),
  query: z.object({}),

});
