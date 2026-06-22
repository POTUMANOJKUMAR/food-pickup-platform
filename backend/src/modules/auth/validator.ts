import { z } from "zod";

const emptyObjectSchema = z.object({}).strict();
const emailSchema = z.string().trim().email().max(255).transform((email) => email.toLowerCase());
const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/\d/, "Password must contain a number");

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: emailSchema,
      password: passwordSchema,
    })
    .strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const loginSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: z.string().min(1).max(72),
    })
    .strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().min(1),
    })
    .strict(),
  params: emptyObjectSchema,
  query: emptyObjectSchema,
});

export const logoutSchema = refreshTokenSchema;
