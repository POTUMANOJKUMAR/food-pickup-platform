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
    tags: [{ name: "Restaurants", description: "Restaurant discovery and management" }],
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
      },
    },
  },
  apis: [
    join(process.cwd(), "src/modules/**/routes.ts"),
    join(process.cwd(), "dist/modules/**/routes.js"),
  ],
};

export const swaggerDocument = swaggerJsdoc(options);
