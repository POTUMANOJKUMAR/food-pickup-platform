import { join } from "node:path";
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.OAS3Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Food Pickup Platform API",
      version: "1.0.0",
      description: "REST API documentation for the Food Pickup Ordering Platform.",
    },
    servers: [{ url: "/api/v1", description: "API version 1" }],
    tags: [
      { name: "Restaurants", description: "Restaurant discovery and management" },
      { name: "Categories", description: "Restaurant category management" },
      { name: "Menu", description: "Restaurant menu item management" },
      { name: "Cart", description: "Customer cart management" },
      { name: "Orders", description: "Order lifecycle management" },
      { name: "Payments", description: "Razorpay payment management" },
      { name: "Notifications", description: "Notification history and push delivery" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiError: {
          type: "object",
          required: ["success", "message"],
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Something went wrong" },
          },
        },
        RestaurantInput: {
          type: "object",
          required: ["name", "address", "latitude", "longitude", "phone", "openingTime", "closingTime"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 150, example: "Spice Garden" },
            description: { type: "string", nullable: true, maxLength: 2000 },
            address: { type: "string", minLength: 5, maxLength: 500 },
            latitude: { type: "number", minimum: -90, maximum: 90, example: 19.076 },
            longitude: { type: "number", minimum: -180, maximum: 180, example: 72.8777 },
            phone: { type: "string", example: "+919876543210" },
            openingTime: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "09:00" },
            closingTime: { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "22:00" },
          },
        },
        Restaurant: {
          allOf: [
            { $ref: "#/components/schemas/RestaurantInput" },
            {
              type: "object",
              required: ["id", "ownerId", "isActive", "isApproved", "createdAt", "updatedAt"],
              properties: {
                id: { type: "string", format: "uuid" },
                ownerId: { type: "string", format: "uuid" },
                isActive: { type: "boolean" },
                isApproved: { type: "boolean" },
                approvedAt: { type: "string", format: "date-time", nullable: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          ],
        },
        RestaurantResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: { $ref: "#/components/schemas/Restaurant" },
          },
        },
        RestaurantListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Restaurant" } },
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 20 },
                    totalItems: { type: "integer", example: 42 },
                    totalPages: { type: "integer", example: 3 },
                    hasNextPage: { type: "boolean", example: true },
                    hasPreviousPage: { type: "boolean", example: false },
                  },
                },
              },
            },
          },
        },
        CategoryInput: {
          type: "object",
          required: ["restaurantId", "name"],
          properties: {
            restaurantId: { type: "string", format: "uuid" },
            name: { type: "string", minLength: 2, maxLength: 100, example: "Biryani" },
            description: { type: "string", nullable: true, maxLength: 1000 },
          },
        },
        CategoryUpdateInput: {
          type: "object",
          minProperties: 1,
          properties: {
            restaurantId: { type: "string", format: "uuid" },
            name: { type: "string", minLength: 2, maxLength: 100, example: "Starters" },
            description: { type: "string", nullable: true, maxLength: 1000 },
          },
        },
        Category: {
          allOf: [
            { $ref: "#/components/schemas/CategoryInput" },
            {
              type: "object",
              required: ["id", "isActive", "createdAt", "updatedAt"],
              properties: {
                id: { type: "string", format: "uuid" },
                isActive: { type: "boolean", example: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          ],
        },
        CategoryResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Category created successfully" },
            data: { $ref: "#/components/schemas/Category" },
          },
        },
        CategoryListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                pagination: { $ref: "#/components/schemas/Pagination" },
              },
            },
          },
        },
        MenuItemInput: {
          type: "object",
          required: ["restaurantId", "categoryId", "name", "price", "preparationTime"],
          properties: {
            restaurantId: { type: "string", format: "uuid" },
            categoryId: { type: "string", format: "uuid" },
            name: { type: "string", minLength: 2, maxLength: 150, example: "Chicken Biryani" },
            description: { type: "string", nullable: true, maxLength: 2000 },
            price: { type: "number", minimum: 0, example: 249 },
            imageUrl: { type: "string", format: "uri", nullable: true },
            isAvailable: { type: "boolean", example: true },
            preparationTime: { type: "integer", minimum: 1, maximum: 240, example: 25 },
          },
        },
        MenuItemUpdateInput: {
          type: "object",
          minProperties: 1,
          properties: {
            restaurantId: { type: "string", format: "uuid" },
            categoryId: { type: "string", format: "uuid" },
            name: { type: "string", minLength: 2, maxLength: 150 },
            description: { type: "string", nullable: true, maxLength: 2000 },
            price: { type: "number", minimum: 0 },
            imageUrl: { type: "string", format: "uri", nullable: true },
            isAvailable: { type: "boolean" },
            preparationTime: { type: "integer", minimum: 1, maximum: 240 },
          },
        },
        MenuItem: {
          allOf: [
            { $ref: "#/components/schemas/MenuItemInput" },
            {
              type: "object",
              required: ["id", "isActive", "createdAt", "updatedAt"],
              properties: {
                id: { type: "string", format: "uuid" },
                isActive: { type: "boolean", example: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          ],
        },
        MenuItemResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Menu item created successfully" },
            data: { $ref: "#/components/schemas/MenuItem" },
          },
        },
        MenuItemListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/MenuItem" } },
                pagination: { $ref: "#/components/schemas/Pagination" },
              },
            },
          },
        },
        AddCartItemInput: {
          type: "object",
          required: ["menuItemId", "quantity"],
          properties: {
            menuItemId: { type: "string", format: "uuid" },
            quantity: { type: "integer", minimum: 1, maximum: 99, example: 2 },
          },
        },
        UpdateCartItemInput: {
          type: "object",
          required: ["quantity"],
          properties: {
            quantity: { type: "integer", minimum: 1, maximum: 99, example: 3 },
          },
        },
        CartItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            menuItemId: { type: "string", format: "uuid" },
            quantity: { type: "integer", example: 2 },
            unitPrice: { type: "number", example: 249 },
            subtotal: { type: "number", example: 498 },
            menuItem: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", example: "Chicken Biryani" },
                imageUrl: { type: "string", nullable: true },
                isAvailable: { type: "boolean", example: true },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Cart: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            restaurantId: { type: "string", format: "uuid", nullable: true },
            subtotal: { type: "number", example: 498 },
            totalAmount: { type: "number", example: 498 },
            isActive: { type: "boolean", example: true },
            items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CartResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: { $ref: "#/components/schemas/Cart" },
          },
        },
        UpdateOrderStatusInput: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED"],
              example: "CONFIRMED",
            },
          },
        },
        OrderItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            menuItemId: { type: "string", format: "uuid" },
            name: { type: "string", example: "Chicken Biryani" },
            quantity: { type: "integer", example: 2 },
            unitPrice: { type: "number", example: 249 },
            subtotal: { type: "number", example: 498 },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orderNumber: { type: "string", example: "FP1234" },
            userId: { type: "string", format: "uuid" },
            restaurantId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"],
            },
            paymentStatus: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] },
            pickupCode: { type: "string", example: "482913" },
            subtotal: { type: "number", example: 498 },
            taxAmount: { type: "number", example: 24.9 },
            totalAmount: { type: "number", example: 522.9 },
            cancelledAt: { type: "string", format: "date-time", nullable: true },
            paidAt: { type: "string", format: "date-time", nullable: true },
            items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        OrderResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Order created successfully" },
            data: { $ref: "#/components/schemas/Order" },
          },
        },
        OrderListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Order" } },
                pagination: { $ref: "#/components/schemas/Pagination" },
              },
            },
          },
        },
        CreatePaymentOrderInput: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", format: "uuid" },
          },
        },
        VerifyPaymentInput: {
          type: "object",
          required: ["razorpayOrderId", "razorpayPaymentId", "razorpaySignature"],
          properties: {
            razorpayOrderId: { type: "string", example: "order_Nabc123" },
            razorpayPaymentId: { type: "string", example: "pay_Nabc123" },
            razorpaySignature: { type: "string", example: "generated_hmac_signature" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orderId: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            amount: { type: "number", example: 522.9 },
            status: { type: "string", enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] },
            razorpayOrderId: { type: "string", nullable: true },
            razorpayPaymentId: { type: "string", nullable: true },
            transactionReference: { type: "string", nullable: true },
            failureReason: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PaymentResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Payment verified successfully" },
            data: { $ref: "#/components/schemas/Payment" },
          },
        },
        RazorpayOrderResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Razorpay order created successfully" },
            data: {
              type: "object",
              properties: {
                payment: { $ref: "#/components/schemas/Payment" },
                razorpayOrder: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "order_Nabc123" },
                    amount: { type: "integer", example: 52290 },
                    currency: { type: "string", example: "INR" },
                    receipt: { type: "string", nullable: true, example: "FP1234" },
                  },
                },
              },
            },
          },
        },
        PaymentListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Payment" } },
                pagination: { $ref: "#/components/schemas/Pagination" },
              },
            },
          },
        },
        NotificationType: {
          type: "string",
          enum: [
            "ORDER_CREATED",
            "ORDER_CONFIRMED",
            "ORDER_PREPARING",
            "ORDER_READY_FOR_PICKUP",
            "ORDER_COMPLETED",
            "ORDER_CANCELLED",
            "PAYMENT_SUCCESS",
            "PAYMENT_FAILED",
            "NEW_ORDER_RECEIVED",
            "RESTAURANT_APPROVED",
            "SYSTEM_NOTIFICATION",
          ],
        },
        CreateNotificationInput: {
          type: "object",
          required: ["userId", "title", "message", "type"],
          properties: {
            userId: { type: "string", format: "uuid" },
            title: { type: "string", minLength: 1, maxLength: 150, example: "Order confirmed" },
            message: {
              type: "string",
              minLength: 1,
              maxLength: 2000,
              example: "Your order FP1234 has been confirmed.",
            },
            type: { $ref: "#/components/schemas/NotificationType" },
            metadata: {
              type: "object",
              nullable: true,
              additionalProperties: true,
              example: { orderId: "3d4e8f11-3333-4444-8888-123456789000" },
            },
            pushToken: { type: "string", nullable: true, description: "Optional FCM device token" },
            sendPush: { type: "boolean", default: false },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            title: { type: "string", example: "Order confirmed" },
            message: { type: "string", example: "Your order FP1234 has been confirmed." },
            type: { $ref: "#/components/schemas/NotificationType" },
            isRead: { type: "boolean", example: false },
            metadata: { type: "object", nullable: true, additionalProperties: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        NotificationResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Notification created successfully" },
            data: { $ref: "#/components/schemas/Notification" },
          },
        },
        NotificationListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Notification" } },
                unreadCount: { type: "integer", example: 5 },
                pagination: { $ref: "#/components/schemas/Pagination" },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            totalItems: { type: "integer", example: 42 },
            totalPages: { type: "integer", example: 3 },
            hasNextPage: { type: "boolean", example: true },
            hasPreviousPage: { type: "boolean", example: false },
          },
        },
      },
    },
  },
  apis: [
    join(process.cwd(), "src/modules/**/routes.ts"),
    join(process.cwd(), "dist/modules/**/routes.js"),
  ],
};

export const swaggerDocument = swaggerJsdoc(options);
