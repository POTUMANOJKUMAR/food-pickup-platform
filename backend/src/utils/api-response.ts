import type { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export const sendSuccess = <T>(
  response: Response<ApiSuccessResponse<T>>,
  data: T,
  message = "Success",
  statusCode = 200,
): Response<ApiSuccessResponse<T>> =>
  response.status(statusCode).json({
    success: true,
    message,
    data,
  });

export const sendError = (
  response: Response<ApiErrorResponse>,
  message: string,
  statusCode: number,
): Response<ApiErrorResponse> =>
  response.status(statusCode).json({
    success: false,
    message,
  });
