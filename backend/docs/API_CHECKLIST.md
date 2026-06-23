# API Checklist

Use this checklist while validating the backend API surface in Postman, Swagger UI, or automated integration tests.

Status columns:

| Marker | Meaning |
| --- | --- |
| `[ ] Tested` | Request has been executed against a target environment. |
| `[ ] Passed` | Request produced the expected success or expected handled error response. |
| `[ ] Failed` | Request needs investigation or a code/test data fix. |

## Auth

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | [ ] Tested | [ ] Passed | [ ] Failed |
| POST | `/api/v1/auth/login` | [ ] Tested | [ ] Passed | [ ] Failed |
| POST | `/api/v1/auth/refresh-token` | [ ] Tested | [ ] Passed | [ ] Failed |
| POST | `/api/v1/auth/logout` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/auth/me` | [ ] Tested | [ ] Passed | [ ] Failed |

## Restaurant

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/restaurants` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/restaurants` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/restaurants/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/restaurants/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| DELETE | `/api/v1/restaurants/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/restaurants/:id/approve` | [ ] Tested | [ ] Passed | [ ] Failed |

## Category

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/categories` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/categories` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/categories/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/categories/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| DELETE | `/api/v1/categories/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/restaurants/:restaurantId/categories` | [ ] Tested | [ ] Passed | [ ] Failed |

## Menu

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/menu-items` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/menu-items` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/menu-items/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/menu-items/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| DELETE | `/api/v1/menu-items/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/restaurants/:restaurantId/menu` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/categories/:categoryId/menu` | [ ] Tested | [ ] Passed | [ ] Failed |

## Cart

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/cart` | [ ] Tested | [ ] Passed | [ ] Failed |
| POST | `/api/v1/cart/items` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/cart/items/:itemId` | [ ] Tested | [ ] Passed | [ ] Failed |
| DELETE | `/api/v1/cart/items/:itemId` | [ ] Tested | [ ] Passed | [ ] Failed |
| DELETE | `/api/v1/cart/clear` | [ ] Tested | [ ] Passed | [ ] Failed |

## Order

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/orders` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/orders` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/orders/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/orders/:id/status` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/orders/:id/cancel` | [ ] Tested | [ ] Passed | [ ] Failed |

## Payment

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/payments/create-order` | [ ] Tested | [ ] Passed | [ ] Failed |
| POST | `/api/v1/payments/verify` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/payments/history` | [ ] Tested | [ ] Passed | [ ] Failed |

## Notification

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/notifications` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/notifications` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/notifications/read-all` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/notifications/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| DELETE | `/api/v1/notifications/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/notifications/:id/read` | [ ] Tested | [ ] Passed | [ ] Failed |

## Review

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/reviews` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/reviews` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/reviews/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/reviews/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| DELETE | `/api/v1/reviews/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/restaurants/:restaurantId/reviews` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/restaurants/:restaurantId/rating-summary` | [ ] Tested | [ ] Passed | [ ] Failed |

## Wallet

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/wallet` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/wallet/transactions` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/wallet/summary` | [ ] Tested | [ ] Passed | [ ] Failed |

## Settlement

| Method | Endpoint | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/settlements/request` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/settlements` | [ ] Tested | [ ] Passed | [ ] Failed |
| GET | `/api/v1/settlements/:id` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/settlements/:id/approve` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/settlements/:id/reject` | [ ] Tested | [ ] Passed | [ ] Failed |
| PUT | `/api/v1/settlements/:id/mark-paid` | [ ] Tested | [ ] Passed | [ ] Failed |
