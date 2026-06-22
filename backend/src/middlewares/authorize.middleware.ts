import type { RequestHandler } from "express";
import type { Role } from "../constants/roles.js";
import { AppError } from "../utils/app-error.js";

export const authorize = (...allowedRoles: readonly Role[]): RequestHandler =>
  (request, _response, next): void => {
    if (request.user === undefined) {
      next(new AppError("Authentication required", 401));
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      console.log(`User with role ${request.user.role} is not authorized to access this resource`);
      next(new AppError("You are not authorized to access this resource", 403));
      return;
    }

    next();
  };
