import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { isRole, type Role } from "../constants/roles.js";
import { AppError } from "../utils/app-error.js";

interface AccessTokenPayload extends JwtPayload {
  sub: string;
  role: Role;
}

const isAccessTokenPayload = (payload: string | JwtPayload): payload is AccessTokenPayload =>
  typeof payload !== "string" && typeof payload.sub === "string" && isRole(payload.role);

export const authenticate: RequestHandler = (request, _response, next): void => {
  const authorizationHeader = request.headers.authorization;

  if (authorizationHeader === undefined || !authorizationHeader.startsWith("Bearer ")) {
    next(new AppError("Authentication required", 401));
    return;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  if (token.length === 0) {
    next(new AppError("Authentication required", 401));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (!isAccessTokenPayload(payload)) {
      next(new AppError("Invalid access token", 401));
      return;
    }

    request.user = {
      id: payload.sub,
      role: payload.role,
    };
    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401));
  }
};
