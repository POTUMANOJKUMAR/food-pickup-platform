import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../../types/auth.js";
import { sendSuccess } from "../../utils/api-response.js";
import { dashboardService } from "./service.js";

const getActor = (request: Request): AuthenticatedUser | undefined => request.user;

export class DashboardController {
  public async summary(request: Request, response: Response): Promise<void> {
    const result = await dashboardService.summary(getActor(request));
    sendSuccess(response, result);
  }

  public async charts(request: Request, response: Response): Promise<void> {
    const result = await dashboardService.charts(getActor(request));
    sendSuccess(response, result);
  }
}

export const dashboardController = new DashboardController();
