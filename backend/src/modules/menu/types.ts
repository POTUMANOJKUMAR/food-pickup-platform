import type { Role } from "../../constants/roles.js";

export type PriceSortDTO = "asc" | "desc";

export interface CreateMenuItemRequestDTO {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
  preparationTime: number;
}

export interface UpdateMenuItemRequestDTO {
  restaurantId?: string;
  categoryId?: string;
  name?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
  preparationTime?: number;
}

export interface MenuItemParamsDTO {
  id: string;
}

export interface RestaurantMenuParamsDTO {
  restaurantId: string;
}

export interface CategoryMenuParamsDTO {
  categoryId: string;
}

export interface ListMenuItemsQueryDTO {
  page: number;
  limit: number;
  search?: string;
  restaurantId?: string;
  categoryId?: string;
  isAvailable?: boolean;
  sortByPrice?: PriceSortDTO;
}

export interface MenuItemResponseDTO {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number;
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

export interface MenuItemListResponseDTO {
  items: MenuItemResponseDTO[];
  pagination: PaginationDTO;
}

export interface DeleteMenuItemResponseDTO {
  deleted: true;
}

export interface MenuActorDTO {
  id: string;
  role: Role;
}
