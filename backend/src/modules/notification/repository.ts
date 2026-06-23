import { Prisma, type NotificationType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const notificationSelect = {
  id: true,
  userId: true,
  title: true,
  message: true,
  type: true,
  isRead: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

interface NotificationListFilters {
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
}

interface NotificationListResult {
  items: NotificationRecord[];
  totalItems: number;
  unreadCount: number;
}

export class NotificationRepository {
  public userExists(userId: string): Promise<{ id: string } | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
  }

  public create(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Prisma.InputJsonValue;
  }): Promise<NotificationRecord> {
    return prisma.notification.create({
      data,
      select: notificationSelect,
    });
  }

  public async findList(
    page: number,
    limit: number,
    filters: NotificationListFilters,
    sortOrder: Prisma.SortOrder,
  ): Promise<NotificationListResult> {
    const where: Prisma.NotificationWhereInput = {
      ...(filters.userId === undefined ? {} : { userId: filters.userId }),
      ...(filters.type === undefined ? {} : { type: filters.type }),
      ...(filters.isRead === undefined ? {} : { isRead: filters.isRead }),
    };

    const unreadWhere: Prisma.NotificationWhereInput = {
      ...(filters.userId === undefined ? {} : { userId: filters.userId }),
      isRead: false,
    };

    const [items, totalItems, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        select: notificationSelect,
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: unreadWhere }),
    ]);

    return { items, totalItems, unreadCount };
  }

  public findById(id: string): Promise<NotificationRecord | null> {
    return prisma.notification.findUnique({
      where: { id },
      select: notificationSelect,
    });
  }

  public markAsRead(id: string): Promise<NotificationRecord> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
      select: notificationSelect,
    });
  }

  public markAllAsRead(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  public delete(id: string): Promise<NotificationRecord> {
    return prisma.notification.delete({
      where: { id },
      select: notificationSelect,
    });
  }
}

export const notificationRepository = new NotificationRepository();
