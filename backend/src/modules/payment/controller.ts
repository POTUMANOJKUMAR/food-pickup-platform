import type { Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/api-response.js";
import { paymentService, type PaymentService } from "./service.js";
import type {
  CreatePaymentOrderRequestDTO,
  ListPaymentsQueryDTO,
  VerifyPaymentRequestDTO,
} from "./types.js";

const getActor = (request: Request) => {
  if (request.user === undefined) {
    throw new AppError("Authentication required", 401);
  }

  return request.user;
};

export class PaymentController {
  public constructor(private readonly service: PaymentService) {}

  public createOrder = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.createRazorpayOrder(
      request.body as CreatePaymentOrderRequestDTO,
      getActor(request),
    );
    sendSuccess(response, result, "Razorpay order created successfully", 201);
  };

  public verify = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.verify(request.body as VerifyPaymentRequestDTO, getActor(request));
    sendSuccess(response, result, "Payment verified successfully");
  };

  public history = async (request: Request, response: Response): Promise<void> => {
    const status =
      typeof request.query.status === "string"
        ? (request.query.status as ListPaymentsQueryDTO["status"])
        : undefined;
    const query: ListPaymentsQueryDTO = {
      page: Number(request.query.page ?? 1),
      limit: Number(request.query.limit ?? 20),
      ...(status === undefined ? {} : { status }),
    };
    const result = await this.service.history(getActor(request), query);
    sendSuccess(response, result);
  };
}

export const paymentController = new PaymentController(paymentService);
