import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const restaurantSelect = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  openingTime: true,
  closingTime: true,
  isActive: true,
  isApproved: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RestaurantSelect;

export type RestaurantRecord = Prisma.RestaurantGetPayload<{ select: typeof restaurantSelect }>;

interface CreateRestaurantData {
  ownerId: string;
  name: string;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  openingTime: Date;
  closingTime: Date;
}

interface UpdateRestaurantData {
  name?: string;
  description?: string | null;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingTime?: Date;
  closingTime?: Date;
  isApproved?: boolean;
  approvedAt?: Date | null;
  approvedById?: string | null;
}

interface RestaurantListResult {
  items: RestaurantRecord[];
  totalItems: number;
}

export class RestaurantRepository {
  public create(data: CreateRestaurantData): Promise<RestaurantRecord> {
    return prisma.restaurant.create({ data, select: restaurantSelect });
  }

  public async findPublicList(
    page: number,
    limit: number,
    search?: string,
  ): Promise<RestaurantListResult> {
    const where: Prisma.RestaurantWhereInput = {
      isActive: true,
      isApproved: true,
      ...(search === undefined
        ? {}
        : { name: { contains: search, mode: "insensitive" } }),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.restaurant.findMany({
        where,
        select: restaurantSelect,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.restaurant.count({ where }),
    ]);

    return { items, totalItems };
  }

  public findPublicById(id: string): Promise<RestaurantRecord | null> {
    return prisma.restaurant.findFirst({
      where: { id, isActive: true, isApproved: true },
      select: restaurantSelect,
    });
  }

  public findActiveById(id: string): Promise<RestaurantRecord | null> {
    return prisma.restaurant.findFirst({
      where: { id, isActive: true },
      select: restaurantSelect,
    });
  }

  public update(id: string, data: UpdateRestaurantData): Promise<RestaurantRecord> {
    return prisma.restaurant.update({
      where: { id },
      data,
      select: restaurantSelect,
    });
  }

  public softDelete(id: string): Promise<void> {
    return prisma.restaurant
      .update({
        where: { id },
        data: { isActive: false, isApproved: false, approvedAt: null, approvedById: null },
      })
      .then(() => undefined);
  }

  public approve(id: string, adminId: string): Promise<RestaurantRecord> {
    return prisma.restaurant.update({
      where: { id },
      data: { isApproved: true, approvedAt: new Date(), approvedById: adminId },
      select: restaurantSelect,
    });
  }
}

export const restaurantRepository = new RestaurantRepository();
