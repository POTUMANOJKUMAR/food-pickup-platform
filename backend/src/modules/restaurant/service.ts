import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { notificationEventService } from "../notification/event-service.js";
import { restaurantRepository, type RestaurantRecord, type RestaurantRepository } from "./repository.js";
import { prisma } from "../../config/prisma.js";
import type {
  CreateRestaurantRequestDTO,
  DeleteRestaurantResponseDTO,
  ListRestaurantsQueryDTO,
  RestaurantActorDTO,
  RestaurantListResponseDTO,
  RestaurantResponseDTO,
  UpdateRestaurantRequestDTO,
} from "./types.js";

const timeToDate = (time: string): Date => new Date(`1970-01-01T${time}:00.000Z`);

const dateToTime = (date: Date): string => date.toISOString().slice(11, 16);

const toRestaurantResponse = (restaurant: RestaurantRecord): RestaurantResponseDTO => ({
  id: restaurant.id,
  ownerId: restaurant.ownerId,
  name: restaurant.name,
  description: restaurant.description,
  address: restaurant.address,
  latitude: restaurant.latitude.toNumber(),
  longitude: restaurant.longitude.toNumber(),
  phone: restaurant.phone,
  openingTime: dateToTime(restaurant.openingTime),
  closingTime: dateToTime(restaurant.closingTime),
  isActive: restaurant.isActive,
  isApproved: restaurant.isApproved,
  approvedAt: restaurant.approvedAt?.toISOString() ?? null,
  createdAt: restaurant.createdAt.toISOString(),
  updatedAt: restaurant.updatedAt.toISOString(),
});

export class RestaurantService {
  public constructor(private readonly repository: RestaurantRepository) {}

  public async create(
    input: CreateRestaurantRequestDTO,
    ownerId: string,
  ): Promise<RestaurantResponseDTO> {
    const restaurant = await this.repository.create({
      ownerId,
      name: input.name.trim(),
      ...(input.description === undefined ? {} : { description: input.description }),
      address: input.address.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone.trim(),
      openingTime: timeToDate(input.openingTime),
      closingTime: timeToDate(input.closingTime),
    });
    // if settings provided, save them
    if (input.settings && Object.keys(input.settings).length > 0) {
      await this.repository.upsertSettings(restaurant.id, {
        tagline: input.settings.tagline ?? null,
        cuisine: input.settings.cuisine ?? null,
        city: input.settings.city ?? null,
        state: input.settings.state ?? null,
        pincode: input.settings.pincode ?? null,
        email: input.settings.email ?? null,
      });
    }
    return toRestaurantResponse(restaurant);
  }

  public async list(query: ListRestaurantsQueryDTO): Promise<RestaurantListResponseDTO> {
    const result = await this.repository.findPublicList(query.page, query.limit, query.search);
    const totalPages = Math.ceil(result.totalItems / query.limit);

    return {
      items: result.items.map(toRestaurantResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems: result.totalItems,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  public async getById(id: string): Promise<RestaurantResponseDTO> {
    const restaurant = await this.repository.findPublicById(id);

    if (restaurant === null) {
      throw new AppError("Restaurant not found", 404);
    }

    return toRestaurantResponse(restaurant);
  }

  public async update(
    id: string,
    input: UpdateRestaurantRequestDTO,
    actor: RestaurantActorDTO,
  ): Promise<RestaurantResponseDTO> {
    const existing = await this.getActiveForMutation(id);
    this.ensureCanManage(existing, actor);

    const restaurant = await this.repository.update(id, {
      ...(input.name === undefined ? {} : { name: input.name.trim() }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.address === undefined ? {} : { address: input.address.trim() }),
      ...(input.latitude === undefined ? {} : { latitude: input.latitude }),
      ...(input.longitude === undefined ? {} : { longitude: input.longitude }),
      ...(input.phone === undefined ? {} : { phone: input.phone.trim() }),
      ...(input.openingTime === undefined ? {} : { openingTime: timeToDate(input.openingTime) }),
      ...(input.closingTime === undefined ? {} : { closingTime: timeToDate(input.closingTime) }),
      ...(actor.role === Role.RESTAURANT_OWNER
        ? { isApproved: false, approvedAt: null, approvedById: null }
        : {}),
    });

    return toRestaurantResponse(restaurant);
  }

  public async delete(id: string, actor: RestaurantActorDTO): Promise<DeleteRestaurantResponseDTO> {
    const existing = await this.getActiveForMutation(id);
    this.ensureCanManage(existing, actor);
    await this.repository.softDelete(id);
    return { deleted: true };
  }

  public async approve(id: string, adminId: string): Promise<RestaurantResponseDTO> {
    await this.getActiveForMutation(id);
    const restaurant = await this.repository.approve(id, adminId);
    await notificationEventService.restaurantApproved(restaurant);
    return toRestaurantResponse(restaurant);
  }

  public async getProfile(actor: RestaurantActorDTO, restaurantId?: string) {
    const resolvedId = await this.resolveRestaurantIdForActor(actor, restaurantId);
    const restaurant = await this.repository.findActiveById(resolvedId);
    if (restaurant === null) {
      throw new AppError("Restaurant not found", 404);
    }
    const settings = await this.repository.getSettings(resolvedId);
    return { ...toRestaurantResponse(restaurant), settings };
  }

  public async updateProfile(actor: RestaurantActorDTO, input: any) {
    const resolvedId = await this.resolveRestaurantIdForActor(actor, input.restaurantId);
    const existing = await this.getActiveForMutation(resolvedId);
    this.ensureCanManage(existing, actor);

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined) updateData.description = input.description;
    if (input.address !== undefined) updateData.address = input.address.trim();
    if (input.phone !== undefined) updateData.phone = input.phone.trim();
    if (input.latitude !== undefined) updateData.latitude = input.latitude;
    if (input.longitude !== undefined) updateData.longitude = input.longitude;

    let restaurantResp = undefined;
    if (Object.keys(updateData).length > 0) {
      restaurantResp = await this.repository.update(resolvedId, updateData);
    }

    const settingsData: any = {};
    if (input.tagline !== undefined) settingsData.tagline = input.tagline;
    if (input.cuisine !== undefined) settingsData.cuisine = input.cuisine;
    if (input.city !== undefined) settingsData.city = input.city;
    if (input.state !== undefined) settingsData.state = input.state;
    if (input.pincode !== undefined) settingsData.pincode = input.pincode;
    if (input.email !== undefined) settingsData.email = input.email;

    let settingsResp = undefined;
    if (Object.keys(settingsData).length > 0) {
      settingsResp = await this.repository.upsertSettings(resolvedId, settingsData);
    }

    const restaurantFinal = restaurantResp ?? (await this.repository.findActiveById(resolvedId));
    return { ...toRestaurantResponse(restaurantFinal as RestaurantRecord), settings: settingsResp ?? (await this.repository.getSettings(resolvedId)) };
  }

  public async getBusinessHours(actor: RestaurantActorDTO, restaurantId?: string) {
    const resolvedId = await this.resolveRestaurantIdForActor(actor, restaurantId);
    return this.repository.getBusinessHours(resolvedId);
  }

  public async updateBusinessHours(actor: RestaurantActorDTO, restaurantId: string | undefined, rows: Array<{ day: string; openTime: string; closeTime: string; isOpen: boolean }>) {
    const resolvedId = await this.resolveRestaurantIdForActor(actor, restaurantId);
    const existing = await this.getActiveForMutation(resolvedId);
    this.ensureCanManage(existing, actor);
    return this.repository.replaceBusinessHours(resolvedId, rows);
  }

  public async createBusinessHours(actor: RestaurantActorDTO, restaurantId: string | undefined, rows: Array<{ day: string; openTime: string; closeTime: string; isOpen: boolean }>) {
    // Creating business hours behaves same as replacing: remove existing and add provided rows
    const resolvedId = await this.resolveRestaurantIdForActor(actor, restaurantId);
    const existing = await this.getActiveForMutation(resolvedId);
    this.ensureCanManage(existing, actor);
    return this.repository.replaceBusinessHours(resolvedId, rows);
  }

  public async uploadMedia(actor: RestaurantActorDTO, restaurantId: string | undefined, type: string, url: string) {
    const resolvedId = await this.resolveRestaurantIdForActor(actor, restaurantId);
    const existing = await this.getActiveForMutation(resolvedId);
    this.ensureCanManage(existing, actor);
    const media = await this.repository.createMedia(resolvedId, type, url);
    return media;
  }

  private async resolveRestaurantIdForActor(actor: RestaurantActorDTO, restaurantId?: string): Promise<string> {
    if (actor.role === Role.ADMIN) {
      if (restaurantId === undefined) {
        throw new AppError("Restaurant id is required", 400);
      }
      return restaurantId;
    }

    if (actor.role !== Role.RESTAURANT_OWNER) {
      throw new AppError("Only restaurant owners can manage profiles", 403);
    }
    if (restaurantId !== undefined) {
      const found = await this.repository.findActiveById(restaurantId);
      if (found === null || found.ownerId !== actor.id) {
        throw new AppError("Restaurant not found or not owned by you", 404);
      }
      return restaurantId;
    }

    // find first restaurant for owner
    const restaurant = await prisma.restaurant.findFirst({ where: { ownerId: actor.id, isActive: true }, select: { id: true } });
    if (restaurant === null) {
      throw new AppError("Restaurant not found", 404);
    }
    return restaurant.id;
  }

  private async getActiveForMutation(id: string): Promise<RestaurantRecord> {
    const restaurant = await this.repository.findActiveById(id);

    if (restaurant === null) {
      throw new AppError("Restaurant not found", 404);
    }

    return restaurant;
  }

  private ensureCanManage(restaurant: RestaurantRecord, actor: RestaurantActorDTO): void {
    if (actor.role !== Role.ADMIN && restaurant.ownerId !== actor.id) {
      throw new AppError("You are not authorized to manage this restaurant", 403);
    }
  }
}

export const restaurantService = new RestaurantService(restaurantRepository);
