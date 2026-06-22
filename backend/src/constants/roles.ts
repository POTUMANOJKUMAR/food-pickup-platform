export const Role = {
  USER: "USER",
  RESTAURANT_OWNER: "RESTAURANT_OWNER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

const roles: readonly string[] = Object.values(Role);

export const isRole = (value: unknown): value is Role =>
  typeof value === "string" && roles.includes(value);
