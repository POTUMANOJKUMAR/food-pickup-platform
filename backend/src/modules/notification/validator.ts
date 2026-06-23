import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const notificationTypeSchema = z.enum([
  "ORDER_CREATED",
  "ORDER_CONFIRMED",
  "ORDER_PREPARING",
  "ORDER_READY_FOR_PICKUP",
  "ORDER_COMPLETED",
  "ORDER_CANCELLED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "NEW_ORDER_RECEIVED",
  "RESTAURANT_APPROVED",
  "SYSTEM_NOTIFICATION",
]);

const jsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonSchema), z.record(jsonSchema)]),
);

export const createNotificationSchema = z.object({
  body: z
    .object({
      userId: z.string().uuid(),
      title: z.string().trim().min(1).max(150),
      message: z.string().trim().min(1).max(2000),
      type: notificationTypeSchema,
      metadata: jsonSchema.optional(),
      pushToken: z.string().trim().min(1).max(4096).optional(),
      sendPush: z.boolean().optional(),
    })
    .strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const listNotificationsSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      type: notificationTypeSchema.optional(),
      isRead: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
      userId: z.string().uuid().optional(),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict(),
});

export const notificationIdSchema = z.object({
  body: z.unknown(),
  params: z.object({
    id: z.string().uuid(),
  }),
  query: emptyObjectSchema,
});

export const markAllNotificationsReadSchema = z.object({
  body: z.unknown(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});
