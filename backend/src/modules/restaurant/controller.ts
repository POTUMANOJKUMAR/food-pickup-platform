import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { restaurantService, type RestaurantService } from "./service.js";
import type {
  CreateRestaurantRequestDTO,
  ListRestaurantsQueryDTO,
  RestaurantParamsDTO,
  UpdateRestaurantRequestDTO,
} from "./types.js";

const getId = (request: Request): string => {
  const { id } = request.params as Partial<RestaurantParamsDTO>;

  if (id === undefined) {
    throw new AppError("Restaurant id is required", 400);
  }

  return id;
};

const getActor = (request: Request) => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }
  return request.user;
};

export class RestaurantController {
  public constructor(private readonly service: RestaurantService) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.create(
      request.body as CreateRestaurantRequestDTO,
      getActor(request).id,
    );
    sendSuccess(response, result, "Restaurant created successfully", 201);
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const search = typeof request.query.search === "string" ? request.query.search.trim() : undefined;
    const query: ListRestaurantsQueryDTO = {
      page: Number(request.query.page ?? 1),
      limit: Number(request.query.limit ?? 20),
      ...(search === undefined ? {} : { search }),
    };
    const result = await this.service.list(query);
    sendSuccess(response, result);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.getById(getId(request));
    sendSuccess(response, result);
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.update(
      getId(request),
      request.body as UpdateRestaurantRequestDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Restaurant updated successfully");
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.delete(getId(request), getActor(request));
    sendSuccess(response, result, "Restaurant deleted successfully");
  };

  public approve = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.approve(getId(request), getActor(request).id);
    sendSuccess(response, result, "Restaurant approved successfully");
  };

  public getProfile = async (request: Request, response: Response): Promise<void> => {
    const actor = getActor(request);
    const restaurantId = typeof request.query.restaurantId === "string" ? request.query.restaurantId : undefined;
    const result = await this.service.getProfile(actor, restaurantId);
    sendSuccess(response, result);
  };

  public updateProfile = async (request: Request, response: Response): Promise<void> => {
    const actor = getActor(request);
    const result = await this.service.updateProfile(actor, request.body as any);
    sendSuccess(response, result, "Profile updated successfully");
  };

  public getBusinessHours = async (request: Request, response: Response): Promise<void> => {
    const actor = getActor(request);
    const restaurantId = typeof request.query.restaurantId === "string" ? request.query.restaurantId : undefined;
    const result = await this.service.getBusinessHours(actor, restaurantId);
    sendSuccess(response, result);
  };

  public updateBusinessHours = async (request: Request, response: Response): Promise<void> => {
    const actor = getActor(request);
    const result = await this.service.updateBusinessHours(actor, undefined, request.body as any);
    sendSuccess(response, result, "Business hours updated successfully");
  };

  public createBusinessHours = async (request: Request, response: Response): Promise<void> => {
    const actor = getActor(request);
    const result = await this.service.createBusinessHours(actor, undefined, request.body as any);
    sendSuccess(response, result, "Business hours created successfully", 201);
  };

  public uploadLogo = async (request: Request, response: Response): Promise<void> => {
    const actor = getActor(request);
    if (!request.file) {
      throw new AppError("File is required", 400);
    }
    // Basic validation
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(request.file.mimetype)) {
      throw new AppError("Invalid image type", 400);
    }
    const url = `/uploads/${request.file.filename}`;
    const media = await this.service.uploadMedia(actor, undefined, "logo", url);
    sendSuccess(response, { logoUrl: media.url }, "Logo uploaded successfully");
  };

  public uploadBanner = async (request: Request, response: Response): Promise<void> => {
    const actor = getActor(request);
    if (!request.file) {
      throw new AppError("File is required", 400);
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(request.file.mimetype)) {
      throw new AppError("Invalid image type", 400);
    }
    const url = `/uploads/${request.file.filename}`;
    const media = await this.service.uploadMedia(actor, undefined, "banner", url);
    sendSuccess(response, { bannerUrl: media.url }, "Banner uploaded successfully");
  };
}

export const restaurantController = new RestaurantController(restaurantService);
