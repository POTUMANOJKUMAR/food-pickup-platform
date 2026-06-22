import type { Role } from "../../constants/roles.js";

export interface CreateRestaurantRequestDTO {
  name: string;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  openingTime: string;
  closingTime: string;
}

export interface UpdateRestaurantRequestDTO {
  name?: string;
  description?: string | null;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface RestaurantParamsDTO {
  id: string;
}

export interface ListRestaurantsQueryDTO {
  page: number;
  limit: number;
  search?: string;
}

export interface RestaurantResponseDTO {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  isApproved: boolean;
  approvedAt: string | null;
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

export interface RestaurantListResponseDTO {
  items: RestaurantResponseDTO[];
  pagination: PaginationDTO;
}

export interface DeleteRestaurantResponseDTO {
  deleted: true;
}

export interface RestaurantActorDTO {
  id: string;
  role: Role;
}
