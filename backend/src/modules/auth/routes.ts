import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { authController } from "./controller.js";
import { loginSchema, logoutSchema, refreshTokenSchema, registerSchema } from "./validator.js";

export const authRouter = Router();

authRouter.post("/register", validateRequest(registerSchema), asyncHandler(authController.register));
authRouter.post("/login", validateRequest(loginSchema), asyncHandler(authController.login));
authRouter.post(
  "/refresh-token",
  validateRequest(refreshTokenSchema),
  asyncHandler(authController.refreshToken),
);
authRouter.post("/logout", validateRequest(logoutSchema), asyncHandler(authController.logout));
authRouter.get("/me", authenticate, asyncHandler(authController.me));
