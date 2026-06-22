import { Prisma } from "@prisma/client";
import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { restaurantRepository } from "../restaurant/repository.js";
import { categoryRepository, type CategoryRecord, type CategoryRepository } from "./repository.js";
import type {
  CategoryActorDTO,
  CategoryListResponseDTO,
  CategoryResponseDTO,
  CreateCategoryRequestDTO,
  DeleteCategoryResponseDTO,
  ListCategoriesQueryDTO,
  UpdateCategoryRequestDTO,
} from "./types.js";

const toCategoryResponse = (category: CategoryRecord): CategoryResponseDTO => ({
  id: category.id,
  restaurantId: category.restaurantId,
  name: category.name,
  description: category.description,
  isActive: category.isActive,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
});

export class CategoryService {
  public constructor(private readonly repository: CategoryRepository) {}

  public async create(
    input: CreateCategoryRequestDTO,
    actor: CategoryActorDTO,
  ): Promise<CategoryResponseDTO> {
    await this.ensureCanManageRestaurant(input.restaurantId, actor);

    try {
      const category = await this.repository.create({
        restaurantId: input.restaurantId,
        name: input.name.trim(),
        ...(input.description === undefined ? {} : { description: input.description }),
      });
      return toCategoryResponse(category);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Category name already exists for this restaurant", 409);
      }
      throw error;
    }
  }

  public async list(query: ListCategoriesQueryDTO): Promise<CategoryListResponseDTO> {
    const result = await this.repository.findList(query.page, query.limit, {
      ...(query.search === undefined ? {} : { search: query.search }),
      ...(query.restaurantId === undefined ? {} : { restaurantId: query.restaurantId }),
    });
    const totalPages = Math.ceil(result.totalItems / query.limit);

    return {
      items: result.items.map(toCategoryResponse),
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

  public async getById(id: string): Promise<CategoryResponseDTO> {
    const category = await this.repository.findActiveById(id);

    if (category === null) {
      throw new AppError("Category not found", 404);
    }

    return toCategoryResponse(category);
  }

  public async update(
    id: string,
    input: UpdateCategoryRequestDTO,
    actor: CategoryActorDTO,
  ): Promise<CategoryResponseDTO> {
    const existing = await this.getActiveForMutation(id);
    this.ensureCanManageCategory(existing, actor);

    if (input.restaurantId !== undefined && input.restaurantId !== existing.restaurantId) {
      await this.ensureCanManageRestaurant(input.restaurantId, actor);
    }

    try {
      const category = await this.repository.update(id, {
        ...(input.restaurantId === undefined ? {} : { restaurantId: input.restaurantId }),
        ...(input.name === undefined ? {} : { name: input.name.trim() }),
        ...(input.description === undefined ? {} : { description: input.description }),
      });
      return toCategoryResponse(category);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Category name already exists for this restaurant", 409);
      }
      throw error;
    }
  }

  public async delete(id: string, actor: CategoryActorDTO): Promise<DeleteCategoryResponseDTO> {
    const existing = await this.getActiveForMutation(id);
    this.ensureCanManageCategory(existing, actor);
    await this.repository.softDelete(id);
    return { deleted: true };
  }

  private async getActiveForMutation(id: string): Promise<CategoryRecord> {
    const category = await this.repository.findActiveById(id);

    if (category === null) {
      throw new AppError("Category not found", 404);
    }

    return category;
  }

  private async ensureCanManageRestaurant(
    restaurantId: string,
    actor: CategoryActorDTO,
  ): Promise<void> {
    const restaurant = await restaurantRepository.findActiveById(restaurantId);

    if (restaurant === null) {
      throw new AppError("Restaurant not found", 404);
    }

    if (actor.role !== Role.ADMIN && restaurant.ownerId !== actor.id) {
      throw new AppError("You are not authorized to manage this restaurant", 403);
    }
  }

  private ensureCanManageCategory(category: CategoryRecord, actor: CategoryActorDTO): void {
    if (actor.role !== Role.ADMIN && category.restaurant.ownerId !== actor.id) {
      throw new AppError("You are not authorized to manage this category", 403);
    }
  }
}

export const categoryService = new CategoryService(categoryRepository);
