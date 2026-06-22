import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { categoryService, type CategoryService } from "./service.js";
import type {
  CategoryParamsDTO,
  CreateCategoryRequestDTO,
  ListCategoriesQueryDTO,
  RestaurantCategoryParamsDTO,
  UpdateCategoryRequestDTO,
} from "./types.js";

const getId = (request: Request): string => {
  const { id } = request.params as Partial<CategoryParamsDTO>;

  if (id === undefined) {
    throw new AppError("Category id is required", 400);
  }

  return id;
};

const getRestaurantId = (request: Request): string => {
  const { restaurantId } = request.params as Partial<RestaurantCategoryParamsDTO>;

  if (restaurantId === undefined) {
    throw new AppError("Restaurant id is required", 400);
  }

  return restaurantId;
};

const getActor = (request: Request) => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }
  return request.user;
};

const getListQuery = (request: Request, restaurantId?: string): ListCategoriesQueryDTO => {
  const search = typeof request.query.search === "string" ? request.query.search.trim() : undefined;
  return {
    page: Number(request.query.page ?? 1),
    limit: Number(request.query.limit ?? 20),
    ...(search === undefined ? {} : { search }),
    ...(restaurantId === undefined ? {} : { restaurantId }),
  };
};

export class CategoryController {
  public constructor(private readonly service: CategoryService) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.create(
      request.body as CreateCategoryRequestDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Category created successfully", 201);
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(getListQuery(request));
    sendSuccess(response, result);
  };

  public listByRestaurant = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(getListQuery(request, getRestaurantId(request)));
    sendSuccess(response, result);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.getById(getId(request));
    sendSuccess(response, result);
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.update(
      getId(request),
      request.body as UpdateCategoryRequestDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Category updated successfully");
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.delete(getId(request), getActor(request));
    sendSuccess(response, result, "Category deleted successfully");
  };
}

export const categoryController = new CategoryController(categoryService);
