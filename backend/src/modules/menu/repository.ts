import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import type { PriceSortDTO } from "./types.js";

const menuItemSelect = {
  id: true,
  restaurantId: true,
  categoryId: true,
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  isAvailable: true,
  preparationTime: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  restaurant: {
    select: {
      ownerId: true,
      isActive: true,
    },
  },
  category: {
    select: {
      restaurantId: true,
      isActive: true,
    },
  },
} satisfies Prisma.MenuItemSelect;

export type MenuItemRecord = Prisma.MenuItemGetPayload<{ select: typeof menuItemSelect }>;

interface CreateMenuItemData {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
  preparationTime: number;
}

interface UpdateMenuItemData {
  restaurantId?: string;
  categoryId?: string;
  name?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
  preparationTime?: number;
}

interface MenuItemListFilters {
  search?: string;
  restaurantId?: string;
  categoryId?: string;
  isAvailable?: boolean;
  sortByPrice?: PriceSortDTO;
}

interface MenuItemListResult {
  items: MenuItemRecord[];
  totalItems: number;
}

export class MenuRepository {
  public create(data: CreateMenuItemData): Promise<MenuItemRecord> {
    return prisma.menuItem.create({ data, select: menuItemSelect });
  }

  public async findList(
    page: number,
    limit: number,
    filters: MenuItemListFilters = {},
  ): Promise<MenuItemListResult> {
    const where: Prisma.MenuItemWhereInput = {
      isActive: true,
      restaurant: { isActive: true },
      category: { isActive: true },
      ...(filters.restaurantId === undefined ? {} : { restaurantId: filters.restaurantId }),
      ...(filters.categoryId === undefined ? {} : { categoryId: filters.categoryId }),
      ...(filters.isAvailable === undefined ? {} : { isAvailable: filters.isAvailable }),
      ...(filters.search === undefined
        ? {}
        : { name: { contains: filters.search, mode: "insensitive" } }),
    };
    const orderBy: Prisma.MenuItemOrderByWithRelationInput[] =
      filters.sortByPrice === undefined
        ? [{ name: "asc" }, { id: "asc" }]
        : [{ price: filters.sortByPrice }, { name: "asc" }, { id: "asc" }];

    const [items, totalItems] = await prisma.$transaction([
      prisma.menuItem.findMany({
        where,
        select: menuItemSelect,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.menuItem.count({ where }),
    ]);

    return { items, totalItems };
  }

  public findActiveById(id: string): Promise<MenuItemRecord | null> {
    return prisma.menuItem.findFirst({
      where: {
        id,
        isActive: true,
        restaurant: { isActive: true },
        category: { isActive: true },
      },
      select: menuItemSelect,
    });
  }

  public update(id: string, data: UpdateMenuItemData): Promise<MenuItemRecord> {
    return prisma.menuItem.update({
      where: { id },
      data,
      select: menuItemSelect,
    });
  }

  public softDelete(id: string): Promise<void> {
    return prisma.menuItem
      .update({
        where: { id },
        data: { isActive: false, isAvailable: false },
      })
      .then(() => undefined);
  }
}

export const menuRepository = new MenuRepository();
