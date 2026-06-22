import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const categorySelect = {
  id: true,
  restaurantId: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  restaurant: {
    select: {
      ownerId: true,
      isActive: true,
    },
  },
} satisfies Prisma.CategorySelect;

export type CategoryRecord = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

interface CreateCategoryData {
  restaurantId: string;
  name: string;
  description?: string | null;
}

interface UpdateCategoryData {
  restaurantId?: string;
  name?: string;
  description?: string | null;
}

interface CategoryListFilters {
  search?: string;
  restaurantId?: string;
}

interface CategoryListResult {
  items: CategoryRecord[];
  totalItems: number;
}

export class CategoryRepository {
  public create(data: CreateCategoryData): Promise<CategoryRecord> {
    return prisma.category.create({ data, select: categorySelect });
  }

  public async findList(
    page: number,
    limit: number,
    filters: CategoryListFilters = {},
  ): Promise<CategoryListResult> {
    const where: Prisma.CategoryWhereInput = {
      isActive: true,
      restaurant: { isActive: true },
      ...(filters.restaurantId === undefined ? {} : { restaurantId: filters.restaurantId }),
      ...(filters.search === undefined
        ? {}
        : { name: { contains: filters.search, mode: "insensitive" } }),
    };

    const [items, totalItems] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        select: categorySelect,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);

    return { items, totalItems };
  }

  public findActiveById(id: string): Promise<CategoryRecord | null> {
    return prisma.category.findFirst({
      where: { id, isActive: true, restaurant: { isActive: true } },
      select: categorySelect,
    });
  }

  public update(id: string, data: UpdateCategoryData): Promise<CategoryRecord> {
    return prisma.category.update({
      where: { id },
      data,
      select: categorySelect,
    });
  }

  public softDelete(id: string): Promise<void> {
    return prisma.category
      .update({
        where: { id },
        data: {
          isActive: false,
          menuItems: {
            updateMany: {
              where: { isActive: true },
              data: { isActive: false, isAvailable: false },
            },
          },
        },
      })
      .then(() => undefined);
  }
}

export const categoryRepository = new CategoryRepository();
