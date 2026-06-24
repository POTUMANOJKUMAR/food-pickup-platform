import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { settlementService, type SettlementService } from "./service.js";
import type {
  ListSettlementsQueryDTO,
  MarkSettlementPaidDTO,
  RejectSettlementDTO,
  RequestSettlementDTO,
  SettlementParamsDTO,
} from "./types.js";

const getActor = (request: Request) => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }

  return request.user;
};

const getId = (request: Request): string => {
  const { id } = request.params as Partial<SettlementParamsDTO>;

  if (id === undefined) {
    throw new AppError("Settlement id is required", 400);
  }

  return id;
};

const toListQuery = (request: Request): ListSettlementsQueryDTO => {
  const restaurantId =
    typeof request.query.restaurantId === "string" ? request.query.restaurantId : undefined;
  const status =
    typeof request.query.status === "string"
      ? (request.query.status as ListSettlementsQueryDTO["status"])
      : undefined;
  const search = typeof request.query.search === "string" ? request.query.search.trim() : undefined;

  return {
    page: Number(request.query.page ?? 1),
    limit: Number(request.query.limit ?? 20),
    ...(restaurantId === undefined ? {} : { restaurantId }),
    ...(status === undefined ? {} : { status }),
    ...(search === undefined ? {} : { search }),
  };
};

export class SettlementController {
  public constructor(private readonly service: SettlementService) {}

  public request = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.request(
      request.body as RequestSettlementDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Settlement requested successfully", 201);
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(getActor(request), toListQuery(request));
    sendSuccess(response, result);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.getById(getId(request), getActor(request));
    sendSuccess(response, result);
  };

  public approve = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.approve(getId(request), getActor(request));
    sendSuccess(response, result, "Settlement approved successfully");
  };

  public reject = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.reject(
      getId(request),
      request.body as RejectSettlementDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Settlement rejected successfully");
  };

  public markPaid = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.markPaid(
      getId(request),
      request.body as MarkSettlementPaidDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Settlement marked paid successfully");
  };

  public summary = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.summary(getActor(request));
    sendSuccess(response, result);
  };
}

export const settlementController = new SettlementController(settlementService);
