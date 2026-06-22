import type { Role } from "../constants/roles.js";

export interface AuthenticatedUser {
  id: string;
  role: Role;
}
