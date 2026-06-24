import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { walletService, type WalletService } from "./service.js";
import type { ListWalletTransactionsQueryDTO, WalletQueryDTO } from "./types.js";

const getActor = (request: Request) => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }

  return request.user;
};

const toWalletQuery = (request: Request): WalletQueryDTO => {
  const restaurantId =
    typeof request.query.restaurantId === "string" ? request.query.restaurantId : undefined;

  return {
    ...(restaurantId === undefined ? {} : { restaurantId }),
  };
};

const toTransactionsQuery = (request: Request): ListWalletTransactionsQueryDTO => {
  const restaurantId =
    typeof request.query.restaurantId === "string" ? request.query.restaurantId : undefined;
  const transactionType =
    typeof request.query.transactionType === "string"
      ? (request.query.transactionType as ListWalletTransactionsQueryDTO["transactionType"])
      : undefined;
  const orderId = typeof request.query.orderId === "string" ? request.query.orderId : undefined;
  const search = typeof request.query.search === "string" ? request.query.search.trim() : undefined;

  return {
    page: Number(request.query.page ?? 1),
    limit: Number(request.query.limit ?? 20),
    ...(restaurantId === undefined ? {} : { restaurantId }),
    ...(transactionType === undefined ? {} : { transactionType }),
    ...(orderId === undefined ? {} : { orderId }),
    ...(search === undefined ? {} : { search }),
  };
};

export class WalletController {
  public constructor(private readonly service: WalletService) {}

  public get = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.getWallet(getActor(request), toWalletQuery(request));
    sendSuccess(response, result);
  };

  public transactions = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.transactions(getActor(request), toTransactionsQuery(request));
    sendSuccess(response, result);
  };

  public summary = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.summary(getActor(request), toWalletQuery(request));
    sendSuccess(response, result);
  };

  public analytics = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.analytics(getActor(request), toWalletQuery(request));
    sendSuccess(response, result);
  };

  public revenueChart = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.revenueChart(getActor(request), toWalletQuery(request));
    sendSuccess(response, result);
  };
}

export const walletController = new WalletController(walletService);
