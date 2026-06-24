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
  settings?: {
    tagline?: string | null;
    cuisine?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    email?: string | null;
  };
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

export interface RestaurantProfileDTO {
  name?: string;
  tagline?: string | null;
  description?: string | null;
  cuisine?: string | null;
  address?: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string;
  email?: string | null;
}

export interface BusinessHourDTO {
  day: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface MediaResponseDTO {
  id: string;
  restaurantId: string;
  type: string;
  url: string;
  createdAt: string;
}
