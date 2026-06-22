import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { categoryRepository } from "../category/repository.js";
import { restaurantRepository } from "../restaurant/repository.js";
import { menuRepository, type MenuItemRecord, type MenuRepository } from "./repository.js";
import type {
  CreateMenuItemRequestDTO,
  DeleteMenuItemResponseDTO,
  ListMenuItemsQueryDTO,
  MenuActorDTO,
  MenuItemListResponseDTO,
  MenuItemResponseDTO,
  UpdateMenuItemRequestDTO,
} from "./types.js";

const toMenuItemResponse = (item: MenuItemRecord): MenuItemResponseDTO => ({
  id: item.id,
  restaurantId: item.restaurantId,
  categoryId: item.categoryId,
  name: item.name,
  description: item.description,
  price: item.price.toNumber(),
  imageUrl: item.imageUrl,
  isAvailable: item.isAvailable,
  preparationTime: item.preparationTime,
  isActive: item.isActive,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export class MenuService {
  public constructor(private readonly repository: MenuRepository) {}

  public async create(
    input: CreateMenuItemRequestDTO,
    actor: MenuActorDTO,
  ): Promise<MenuItemResponseDTO> {
    await this.ensureCanManageRestaurant(input.restaurantId, actor);
    await this.ensureCategoryBelongsToRestaurant(input.categoryId, input.restaurantId);

    const item = await this.repository.create({
      restaurantId: input.restaurantId,
      categoryId: input.categoryId,
      name: input.name.trim(),
      ...(input.description === undefined ? {} : { description: input.description }),
      price: input.price,
      ...(input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl }),
      ...(input.isAvailable === undefined ? {} : { isAvailable: input.isAvailable }),
      preparationTime: input.preparationTime,
    });

    return toMenuItemResponse(item);
  }

  public async list(query: ListMenuItemsQueryDTO): Promise<MenuItemListResponseDTO> {
    const result = await this.repository.findList(query.page, query.limit, {
      ...(query.search === undefined ? {} : { search: query.search }),
      ...(query.restaurantId === undefined ? {} : { restaurantId: query.restaurantId }),
      ...(query.categoryId === undefined ? {} : { categoryId: query.categoryId }),
      ...(query.isAvailable === undefined ? {} : { isAvailable: query.isAvailable }),
      ...(query.sortByPrice === undefined ? {} : { sortByPrice: query.sortByPrice }),
    });
    const totalPages = Math.ceil(result.totalItems / query.limit);

    return {
      items: result.items.map(toMenuItemResponse),
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

  public async getById(id: string): Promise<MenuItemResponseDTO> {
    const item = await this.repository.findActiveById(id);

    if (item === null) {
      throw new AppError("Menu item not found", 404);
    }

    return toMenuItemResponse(item);
  }

  public async update(
    id: string,
    input: UpdateMenuItemRequestDTO,
    actor: MenuActorDTO,
  ): Promise<MenuItemResponseDTO> {
    const existing = await this.getActiveForMutation(id);
    this.ensureCanManageMenuItem(existing, actor);

    const nextRestaurantId = input.restaurantId ?? existing.restaurantId;
    const nextCategoryId = input.categoryId ?? existing.categoryId;

    if (input.restaurantId !== undefined && input.restaurantId !== existing.restaurantId) {
      await this.ensureCanManageRestaurant(input.restaurantId, actor);
    }
    await this.ensureCategoryBelongsToRestaurant(nextCategoryId, nextRestaurantId);

    const item = await this.repository.update(id, {
      ...(input.restaurantId === undefined ? {} : { restaurantId: input.restaurantId }),
      ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
      ...(input.name === undefined ? {} : { name: input.name.trim() }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.price === undefined ? {} : { price: input.price }),
      ...(input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl }),
      ...(input.isAvailable === undefined ? {} : { isAvailable: input.isAvailable }),
      ...(input.preparationTime === undefined ? {} : { preparationTime: input.preparationTime }),
    });

    return toMenuItemResponse(item);
  }

  public async delete(id: string, actor: MenuActorDTO): Promise<DeleteMenuItemResponseDTO> {
    const existing = await this.getActiveForMutation(id);
    this.ensureCanManageMenuItem(existing, actor);
    await this.repository.softDelete(id);
    return { deleted: true };
  }

  private async getActiveForMutation(id: string): Promise<MenuItemRecord> {
    const item = await this.repository.findActiveById(id);

    if (item === null) {
      throw new AppError("Menu item not found", 404);
    }

    return item;
  }

  private async ensureCanManageRestaurant(restaurantId: string, actor: MenuActorDTO): Promise<void> {
    const restaurant = await restaurantRepository.findActiveById(restaurantId);

    if (restaurant === null) {
      throw new AppError("Restaurant not found", 404);
    }

    if (actor.role !== Role.ADMIN && restaurant.ownerId !== actor.id) {
      throw new AppError("You are not authorized to manage this restaurant", 403);
    }
  }

  private async ensureCategoryBelongsToRestaurant(
    categoryId: string,
    restaurantId: string,
  ): Promise<void> {
    const category = await categoryRepository.findActiveById(categoryId);

    if (category === null) {
      throw new AppError("Category not found", 404);
    }

    if (category.restaurantId !== restaurantId) {
      throw new AppError("Category does not belong to the selected restaurant", 400);
    }
  }

  private ensureCanManageMenuItem(item: MenuItemRecord, actor: MenuActorDTO): void {
    if (actor.role !== Role.ADMIN && item.restaurant.ownerId !== actor.id) {
      throw new AppError("You are not authorized to manage this menu item", 403);
    }
  }
}

export const menuService = new MenuService(menuRepository);
