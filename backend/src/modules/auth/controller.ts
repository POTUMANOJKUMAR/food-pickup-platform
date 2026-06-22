import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { authService, type AuthService } from "./service.js";
import type {
  LoginRequestDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
} from "./types.js";

export class AuthController {
  public constructor(private readonly service: AuthService) {}

  public register = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.register(request.body as RegisterRequestDTO);
    sendSuccess(response, result, "User registered successfully", 201);
  };

  public login = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.login(request.body as LoginRequestDTO);
    sendSuccess(response, result, "Login successful");
  };

  public refreshToken = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.refresh(request.body as RefreshTokenRequestDTO);
    sendSuccess(response, result, "Token refreshed successfully");
  };

  public logout = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.logout(request.body as LogoutRequestDTO);
    sendSuccess(response, result, "Logout successful");
  };

  public me = async (request: Request, response: Response): Promise<void> => {
    if (request.user === undefined) {
      throw new AppError("Authentication required", 401);
    }

    const result = await this.service.getCurrentUser(request.user.id);
    sendSuccess(response, result);
  };
}

export const authController = new AuthController(authService);
