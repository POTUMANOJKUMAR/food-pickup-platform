import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { orderService, type OrderService } from "./service.js";
import type { ListOrdersQueryDTO, OrderParamsDTO, UpdateOrderStatusRequestDTO } from "./types.js";

const getActor = (request: Request) => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }

  return request.user;
};

const getId = (request: Request): string => {
  const { id } = request.params as Partial<OrderParamsDTO>;

  if (id === undefined) {
    throw new AppError("Order id is required", 400);
  }

  return id;
};

export class OrderController {
  public constructor(private readonly service: OrderService) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.createFromCart(getActor(request));
    sendSuccess(response, result, "Order created successfully", 201);
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const status =
      typeof request.query.status === "string"
        ? (request.query.status as ListOrdersQueryDTO["status"])
        : undefined;
    const query: ListOrdersQueryDTO = {
      page: Number(request.query.page ?? 1),
      limit: Number(request.query.limit ?? 20),
      ...(status === undefined ? {} : { status }),
    };
    const result = await this.service.list(getActor(request), query);
    sendSuccess(response, result);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.getById(getId(request), getActor(request));
    sendSuccess(response, result);
  };

  public updateStatus = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.updateStatus(
      getId(request),
      request.body as UpdateOrderStatusRequestDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Order status updated successfully");
  };

  public cancel = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.cancel(getId(request), getActor(request));
    sendSuccess(response, result, "Order cancelled successfully");
  };
}

export const orderController = new OrderController(orderService);
