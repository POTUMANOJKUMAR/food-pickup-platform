import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler = (request: Request, response: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (handler: AsyncRequestHandler): RequestHandler =>
  (request, response, next): void => {
    void handler(request, response, next).catch(next);
  };
