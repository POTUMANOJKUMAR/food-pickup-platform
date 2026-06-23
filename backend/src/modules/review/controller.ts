import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { reviewService, type ReviewService } from "./service.js";
import type {
  CreateReviewRequestDTO,
  ListReviewsQueryDTO,
  RestaurantReviewsParamsDTO,
  ReviewParamsDTO,
  UpdateReviewRequestDTO,
} from "./types.js";

const getActor = (request: Request) => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }

  return request.user;
};

const getId = (request: Request): string => {
  const { id } = request.params as Partial<ReviewParamsDTO>;

  if (id === undefined) {
    throw new AppError("Review id is required", 400);
  }

  return id;
};

const toListQuery = (request: Request): ListReviewsQueryDTO => {
  const search = typeof request.query.search === "string" ? request.query.search.trim() : undefined;
  const restaurantId =
    typeof request.query.restaurantId === "string" ? request.query.restaurantId : undefined;
  const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
  const orderId = typeof request.query.orderId === "string" ? request.query.orderId : undefined;

  return {
    page: Number(request.query.page ?? 1),
    limit: Number(request.query.limit ?? 20),
    ...(restaurantId === undefined ? {} : { restaurantId }),
    ...(userId === undefined ? {} : { userId }),
    ...(orderId === undefined ? {} : { orderId }),
    ...(request.query.rating === undefined ? {} : { rating: Number(request.query.rating) }),
    ...(search === undefined ? {} : { search }),
  };
};

export class ReviewController {
  public constructor(private readonly service: ReviewService) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.create(
      request.body as CreateReviewRequestDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Review created successfully", 201);
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(toListQuery(request), getActor(request));
    sendSuccess(response, result);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.getById(getId(request), getActor(request));
    sendSuccess(response, result);
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.update(
      getId(request),
      request.body as UpdateReviewRequestDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Review updated successfully");
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.delete(getId(request), getActor(request));
    sendSuccess(response, result, "Review deleted successfully");
  };

  public listForRestaurant = async (request: Request, response: Response): Promise<void> => {
    const { restaurantId } = request.params as Partial<RestaurantReviewsParamsDTO>;

    if (restaurantId === undefined) {
      throw new AppError("Restaurant id is required", 400);
    }

    const result = await this.service.list({
      ...toListQuery(request),
      restaurantId,
    });
    sendSuccess(response, result);
  };

  public ratingSummary = async (request: Request, response: Response): Promise<void> => {
    const { restaurantId } = request.params as Partial<RestaurantReviewsParamsDTO>;

    if (restaurantId === undefined) {
      throw new AppError("Restaurant id is required", 400);
    }

    const result = await this.service.ratingSummary(restaurantId);
    sendSuccess(response, result);
  };
}

export const reviewController = new ReviewController(reviewService);
