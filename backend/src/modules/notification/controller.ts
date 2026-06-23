import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { notificationService, type NotificationService } from "./service.js";
import type {
  CreateNotificationRequestDTO,
  ListNotificationsQueryDTO,
  NotificationParamsDTO,
} from "./types.js";

const getActor = (request: Request) => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }

  return request.user;
};

const getId = (request: Request): string => {
  const { id } = request.params as Partial<NotificationParamsDTO>;

  if (id === undefined) {
    throw new AppError("Notification id is required", 400);
  }

  return id;
};

const parseIsRead = (value: unknown): boolean | undefined => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
};

export class NotificationController {
  public constructor(private readonly service: NotificationService) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.create(
      request.body as CreateNotificationRequestDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Notification created successfully", 201);
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    const type =
      typeof request.query.type === "string"
        ? (request.query.type as ListNotificationsQueryDTO["type"])
        : undefined;
    const userId = typeof request.query.userId === "string" ? request.query.userId : undefined;
    const sortOrder = request.query.sortOrder === "asc" ? "asc" : "desc";
    const query: ListNotificationsQueryDTO = {
      page: Number(request.query.page ?? 1),
      limit: Number(request.query.limit ?? 20),
      sortOrder,
      ...(type === undefined ? {} : { type }),
      ...(userId === undefined ? {} : { userId }),
      ...(parseIsRead(request.query.isRead) === undefined
        ? {}
        : { isRead: parseIsRead(request.query.isRead) }),
    };
    const result = await this.service.list(getActor(request), query);
    sendSuccess(response, result);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.getById(getId(request), getActor(request));
    sendSuccess(response, result);
  };

  public markAsRead = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.markAsRead(getId(request), getActor(request));
    sendSuccess(response, result, "Notification marked as read");
  };

  public markAllAsRead = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.markAllAsRead(getActor(request));
    sendSuccess(response, result, "Notifications marked as read");
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.delete(getId(request), getActor(request));
    sendSuccess(response, result, "Notification deleted successfully");
  };
}

export const notificationController = new NotificationController(notificationService);
