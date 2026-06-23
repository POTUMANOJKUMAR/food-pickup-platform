import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { notificationEventService } from "../notification/event-service.js";
import { restaurantRepository, type RestaurantRecord, type RestaurantRepository } from "./repository.js";
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
