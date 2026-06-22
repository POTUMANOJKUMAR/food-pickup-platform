import type { Role } from "../../constants/roles.js";

export interface CreateCategoryRequestDTO {
  restaurantId: string;
  name: string;
  description?: string | null;
}

export interface UpdateCategoryRequestDTO {
  restaurantId?: string;
  name?: string;
  description?: string | null;
}

export interface CategoryParamsDTO {
  id: string;
}

export interface RestaurantCategoryParamsDTO {
  restaurantId: string;
}

export interface ListCategoriesQueryDTO {
  page: number;
  limit: number;
  search?: string;
  restaurantId?: string;
}

export interface CategoryResponseDTO {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CategoryListResponseDTO {
  items: CategoryResponseDTO[];
  pagination: PaginationDTO;
}

export interface DeleteCategoryResponseDTO {
  deleted: true;
}

export interface CategoryActorDTO {
  id: string;
  role: Role;
}
