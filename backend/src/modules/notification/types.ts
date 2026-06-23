import type { NotificationType } from "@prisma/client";
import type { Role } from "../../constants/roles.js";

export interface NotificationParamsDTO {
  id: string;
}

export interface CreateNotificationRequestDTO {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: unknown;
  pushToken?: string;
  sendPush?: boolean;
}

export interface ListNotificationsQueryDTO {
  page: number;
  limit: number;
  type?: NotificationType;
  isRead?: boolean;
  userId?: string;
  sortOrder: "asc" | "desc";
}

export interface NotificationResponseDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata: unknown;
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

export interface NotificationListResponseDTO {
  items: NotificationResponseDTO[];
  unreadCount: number;
  pagination: PaginationDTO;
}

export interface PushNotificationResultDTO {
  attempted: boolean;
  delivered: boolean;
  reason?: string;
}

export interface NotificationActorDTO {
  id: string;
  role: Role;
}

export interface NotificationHelperPayloadDTO {
  userId: string;
  orderId?: string;
  orderNumber?: string;
  paymentId?: string;
  pickupCode?: string;
  pushToken?: string;
  metadata?: Record<string, unknown>;
}
