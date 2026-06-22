import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { menuService, type MenuService } from "./service.js";
import type {
  CategoryMenuParamsDTO,
  CreateMenuItemRequestDTO,
  ListMenuItemsQueryDTO,
  MenuItemParamsDTO,
  RestaurantMenuParamsDTO,
  UpdateMenuItemRequestDTO,
} from "./types.js";

const getId = (request: Request): string => {
  const { id } = request.params as Partial<MenuItemParamsDTO>;

  if (id === undefined) {
    throw new AppError("Menu item id is required", 400);
  }

  return id;
};

const getRestaurantId = (request: Request): string => {
  const { restaurantId } = request.params as Partial<RestaurantMenuParamsDTO>;

  if (restaurantId === undefined) {
    throw new AppError("Restaurant id is required", 400);
  }

  return restaurantId;
};

const getCategoryId = (request: Request): string => {
  const { categoryId } = request.params as Partial<CategoryMenuParamsDTO>;

  if (categoryId === undefined) {
    throw new AppError("Category id is required", 400);
  }

  return categoryId;
};

const getActor = (request: Request) => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }
  return request.user;
};

const getListQuery = (
  request: Request,
  scopedFilters: Pick<ListMenuItemsQueryDTO, "restaurantId" | "categoryId"> = {},
): ListMenuItemsQueryDTO => {
  const search = typeof request.query.search === "string" ? request.query.search.trim() : undefined;
  const categoryId =
    typeof request.query.categoryId === "string" ? request.query.categoryId : undefined;
  const sortByPrice =
    request.query.sortByPrice === "asc" || request.query.sortByPrice === "desc"
      ? request.query.sortByPrice
      : undefined;

  return {
    page: Number(request.query.page ?? 1),
    limit: Number(request.query.limit ?? 20),
    ...(search === undefined ? {} : { search }),
    ...(categoryId === undefined ? {} : { categoryId }),
    ...(typeof request.query.isAvailable === "string"
      ? { isAvailable: request.query.isAvailable === "true" }
      : {}),
    ...(sortByPrice === undefined ? {} : { sortByPrice }),
    ...scopedFilters,
  };
};

export class MenuController {
  public constructor(private readonly service: MenuService) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.create(request.body as CreateMenuItemRequestDTO, getActor(request));
    sendSuccess(response, result, "Menu item created successfully", 201);
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(getListQuery(request));
    sendSuccess(response, result);
  };

  public listByRestaurant = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(
      getListQuery(request, { restaurantId: getRestaurantId(request) }),
    );
    sendSuccess(response, result);
  };

  public listByCategory = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(getListQuery(request, { categoryId: getCategoryId(request) }));
    sendSuccess(response, result);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.getById(getId(request));
    sendSuccess(response, result);
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.update(
      getId(request),
      request.body as UpdateMenuItemRequestDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Menu item updated successfully");
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.delete(getId(request), getActor(request));
    sendSuccess(response, result, "Menu item deleted successfully");
  };
}

export const menuController = new MenuController(menuService);
