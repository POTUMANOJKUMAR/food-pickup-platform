import { Prisma } from "@prisma/client";
import { Role } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { reviewRepository, type ReviewRecord, type ReviewRepository } from "./repository.js";
import type {
  CreateReviewRequestDTO,
  DeleteReviewResponseDTO,
  ListReviewsQueryDTO,
  RatingSummaryDTO,
  ReviewActorDTO,
  ReviewListResponseDTO,
  ReviewResponseDTO,
  UpdateReviewRequestDTO,
} from "./types.js";

const toReviewResponse = (review: ReviewRecord): ReviewResponseDTO => ({
  id: review.id,
  userId: review.userId,
  restaurantId: review.restaurantId,
  orderId: review.orderId,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt.toISOString(),
  updatedAt: review.updatedAt.toISOString(),
});

const normalizeComment = (comment: string | null | undefined): string | null | undefined => {
  if (comment === undefined) {
    return undefined;
  }

  if (comment === null) {
    return null;
  }

  const trimmed = comment.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export class ReviewService {
  public constructor(private readonly repository: ReviewRepository) {}

  public async create(
    input: CreateReviewRequestDTO,
    actor: ReviewActorDTO,
  ): Promise<ReviewResponseDTO> {
    if (actor.role !== Role.USER) {
      throw new AppError("Only customers can create reviews", 403);
    }

    const order = await this.repository.findOrderForReview(input.orderId);

    if (order === null) {
      throw new AppError("Order not found", 404);
    }

    if (order.userId !== actor.id) {
      throw new AppError("You can only review your own orders", 403);
    }

    if (order.status !== "COMPLETED") {
      throw new AppError("Only completed orders can be reviewed", 400);
    }

    try {
      const comment = normalizeComment(input.comment);
      const review = await this.repository.create({
        userId: actor.id,
        restaurantId: order.restaurantId,
        orderId: order.id,
        rating: input.rating,
        ...(comment === undefined ? {} : { comment }),
      });
      return toReviewResponse(review);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Order has already been reviewed", 409);
      }
      throw error;
    }
  }

  public async list(
    query: ListReviewsQueryDTO,
    actor?: ReviewActorDTO,
  ): Promise<ReviewListResponseDTO> {
    const result = await this.repository.findList(query.page, query.limit, {
      ...(query.restaurantId === undefined ? {} : { restaurantId: query.restaurantId }),
      ...(query.userId === undefined ? {} : { userId: query.userId }),
      ...(query.orderId === undefined ? {} : { orderId: query.orderId }),
      ...(query.rating === undefined ? {} : { rating: query.rating }),
      ...(query.search === undefined ? {} : { search: query.search }),
      ...(actor?.role === Role.USER ? { userId: actor.id } : {}),
      ...(actor?.role === Role.RESTAURANT_OWNER ? { ownerId: actor.id } : {}),
    });
    const totalPages = Math.ceil(result.totalItems / query.limit);

    return {
      items: result.items.map(toReviewResponse),
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

  public async getById(id: string, actor?: ReviewActorDTO): Promise<ReviewResponseDTO> {
    const review = await this.repository.findById(id);

    if (review === null) {
      throw new AppError("Review not found", 404);
    }

    if (actor !== undefined && !this.canAccess(review, actor)) {
      throw new AppError("You are not authorized to access this review", 403);
    }

    return toReviewResponse(review);
  }

  public async update(
    id: string,
    input: UpdateReviewRequestDTO,
    actor: ReviewActorDTO,
  ): Promise<ReviewResponseDTO> {
    const review = await this.getReviewForMutation(id, actor);
    const comment = normalizeComment(input.comment);
    const updated = await this.repository.update(review.id, {
      ...(input.rating === undefined ? {} : { rating: input.rating }),
      ...(comment === undefined ? {} : { comment }),
    });
    return toReviewResponse(updated);
  }

  public async delete(id: string, actor: ReviewActorDTO): Promise<DeleteReviewResponseDTO> {
    const review = await this.getReviewForMutation(id, actor);
    await this.repository.delete(review.id);
    return { deleted: true };
  }

  public async ratingSummary(restaurantId: string): Promise<RatingSummaryDTO> {
    const summary = await this.repository.getRatingSummary(restaurantId);
    const ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const item of summary.breakdown) {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingBreakdown[item.rating as 1 | 2 | 3 | 4 | 5] = item.count;
      }
    }

    return {
      averageRating: Number(summary.averageRating.toFixed(2)),
      totalReviews: summary.totalReviews,
      ratingBreakdown,
    };
  }

  public async analytics(actor?: ReviewActorDTO): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: Record<string, number>;
  }> {
    const filters = actor?.role === Role.RESTAURANT_OWNER ? { ownerId: actor.id } : {};
    const summary = await this.repository.getOverallRatingSummary(filters);
    const distribution: Record<string, number> = {};
    for (const item of summary.breakdown) {
      distribution[String(item.rating)] = item.count;
    }

    return {
      averageRating: Number(summary.averageRating.toFixed(2)),
      totalReviews: summary.totalReviews,
      ratingBreakdown: distribution,
    };
  }

  public async recent(actor?: ReviewActorDTO): Promise<ReviewResponseDTO[]> {
    const filters = actor?.role === Role.RESTAURANT_OWNER ? { ownerId: actor.id } : {};
    const items = await this.repository.findRecentReviews(10, filters);
    return items.map(toReviewResponse);
  }

  private async getReviewForMutation(id: string, actor: ReviewActorDTO): Promise<ReviewRecord> {
    const review = await this.repository.findById(id);

    if (review === null) {
      throw new AppError("Review not found", 404);
    }

    if (review.userId !== actor.id) {
      throw new AppError("You can only modify your own review", 403);
    }

    return review;
  }

  private canAccess(review: ReviewRecord, actor: ReviewActorDTO): boolean {
    if (actor.role === Role.ADMIN) {
      return true;
    }

    if (actor.role === Role.RESTAURANT_OWNER) {
      return review.restaurant.ownerId === actor.id;
    }

    return review.userId === actor.id;
  }
}

export const reviewService = new ReviewService(reviewRepository);
