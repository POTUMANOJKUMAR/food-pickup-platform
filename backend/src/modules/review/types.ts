import type { Role } from "../../constants/roles.js";

export interface ReviewParamsDTO {
  id: string;
}

export interface RestaurantReviewsParamsDTO {
  restaurantId: string;
}

export interface CreateReviewRequestDTO {
  orderId: string;
  rating: number;
  comment?: string | null;
}

export interface UpdateReviewRequestDTO {
  rating?: number;
  comment?: string | null;
}

export interface ListReviewsQueryDTO {
  page: number;
  limit: number;
  restaurantId?: string;
  userId?: string;
  orderId?: string;
  rating?: number;
  search?: string;
}

export interface ReviewResponseDTO {
  id: string;
  userId: string;
  restaurantId: string;
  orderId: string;
  rating: number;
  comment: string | null;
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

export interface ReviewListResponseDTO {
  items: ReviewResponseDTO[];
  pagination: PaginationDTO;
}

export interface RatingSummaryDTO {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface DeleteReviewResponseDTO {
  deleted: true;
}

export interface ReviewActorDTO {
  id: string;
  role: Role;
}
