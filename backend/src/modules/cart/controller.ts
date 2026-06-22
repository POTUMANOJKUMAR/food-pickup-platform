import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { cartService, type CartService } from "./service.js";
import type { AddCartItemRequestDTO, CartItemParamsDTO, UpdateCartItemRequestDTO } from "./types.js";

const getUserId = (request: Request): string => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }

  return request.user.id;
};

const getItemId = (request: Request): string => {
  const { itemId } = request.params as Partial<CartItemParamsDTO>;

  if (itemId === undefined) {
    throw new AppError("Cart item id is required", 400);
  }

  return itemId;
};

export class CartController {
  public constructor(private readonly service: CartService) {}

  public get = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.get(getUserId(request));
    sendSuccess(response, result);
  };

  public addItem = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.addItem(
      getUserId(request),
      request.body as AddCartItemRequestDTO,
    );
    sendSuccess(response, result, "Cart item added successfully", 201);
  };

  public updateItem = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.updateItem(
      getUserId(request),
      getItemId(request),
      request.body as UpdateCartItemRequestDTO,
    );
    sendSuccess(response, result, "Cart item updated successfully");
  };

  public removeItem = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.removeItem(getUserId(request), getItemId(request));
    sendSuccess(response, result, "Cart item removed successfully");
  };

  public clear = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.clear(getUserId(request));
    sendSuccess(response, result, "Cart cleared successfully");
  };
}

export const cartController = new CartController(cartService);
