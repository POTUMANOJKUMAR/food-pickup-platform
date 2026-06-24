import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const reviewSelect = {
  id: true,
  userId: true,
  restaurantId: true,
  orderId: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  restaurant: {
    select: {
      ownerId: true,
    },
  },
} satisfies Prisma.ReviewSelect;

const reviewOrderSelect = {
  id: true,
  userId: true,
  restaurantId: true,
  status: true,
} satisfies Prisma.OrderSelect;

export type ReviewRecord = Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>;
export type ReviewOrderRecord = Prisma.OrderGetPayload<{ select: typeof reviewOrderSelect }>;

interface ReviewListFilters {
  restaurantId?: string;
  userId?: string;
  ownerId?: string;
  orderId?: string;
  rating?: number;
  search?: string;
}

interface ReviewListResult {
  items: ReviewRecord[];
  totalItems: number;
}

export class ReviewRepository {
  public findOrderForReview(orderId: string): Promise<ReviewOrderRecord | null> {
    return prisma.order.findUnique({
      where: { id: orderId },
      select: reviewOrderSelect,
    });
  }

  public create(data: {
    userId: string;
    restaurantId: string;
    orderId: string;
    rating: number;
    comment?: string | null;
  }): Promise<ReviewRecord> {
    return prisma.review.create({
      data,
      select: reviewSelect,
    });
  }

  public async findList(
    page: number,
    limit: number,
    filters: ReviewListFilters = {},
  ): Promise<ReviewListResult> {
    const where: Prisma.ReviewWhereInput = {
      ...(filters.restaurantId === undefined ? {} : { restaurantId: filters.restaurantId }),
      ...(filters.userId === undefined ? {} : { userId: filters.userId }),
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
      ...(filters.orderId === undefined ? {} : { orderId: filters.orderId }),
      ...(filters.rating === undefined ? {} : { rating: filters.rating }),
      ...(filters.search === undefined
        ? {}
        : { comment: { contains: filters.search, mode: "insensitive" } }),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        select: reviewSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return { items, totalItems };
  }

  public findById(id: string): Promise<ReviewRecord | null> {
    return prisma.review.findUnique({
      where: { id },
      select: reviewSelect,
    });
  }

  public findByOrderId(orderId: string): Promise<ReviewRecord | null> {
    return prisma.review.findUnique({
      where: { orderId },
      select: reviewSelect,
    });
  }

  public update(
    id: string,
    data: { rating?: number; comment?: string | null },
  ): Promise<ReviewRecord> {
    return prisma.review.update({
      where: { id },
      data,
      select: reviewSelect,
    });
  }

  public delete(id: string): Promise<void> {
    return prisma.review.delete({ where: { id } }).then(() => undefined);
  }

  public async getRatingSummary(restaurantId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    breakdown: Array<{ rating: number; count: number }>;
  }> {
    const [aggregate, groups] = await prisma.$transaction([
      prisma.review.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { restaurantId },
        orderBy: { rating: "asc" },
        _count: { _all: true },
      }),
    ]);

    return {
      averageRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count.id,
      breakdown: groups.map((group) => {
        const count = typeof group._count === "object" ? group._count._all ?? 0 : 0;

        return {
          rating: group.rating,
          count,
        };
      }),
    };
  }

  public async getOverallRatingSummary(filters: { ownerId?: string } = {}): Promise<{
    averageRating: number;
    totalReviews: number;
    breakdown: Array<{ rating: number; count: number }>;
  }> {
    const where: Prisma.ReviewWhereInput = {
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
    };

    const [aggregate, groups] = await prisma.$transaction([
      prisma.review.aggregate({ where, _avg: { rating: true }, _count: { id: true } }),
      prisma.review.groupBy({ by: ["rating"], where, orderBy: { rating: "asc" }, _count: { _all: true } }),
    ]);

    return {
      averageRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count.id,
      breakdown: groups.map((group) => {
        const count = typeof group._count === "object" ? group._count._all ?? 0 : 0;
        return { rating: group.rating, count };
      }),
    };
  }

  public async findRecentReviews(limit = 10, filters: { ownerId?: string } = {}): Promise<ReviewRecord[]> {
    const where: Prisma.ReviewWhereInput = {
      ...(filters.ownerId === undefined ? {} : { restaurant: { ownerId: filters.ownerId } }),
    };

    return prisma.review.findMany({ where, select: reviewSelect, orderBy: { createdAt: "desc" }, take: limit });
  }
}

export const reviewRepository = new ReviewRepository();
