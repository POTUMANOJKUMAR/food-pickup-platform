# Backend Architecture

The backend is a modular Express API built with TypeScript, Prisma ORM, PostgreSQL, Zod validation, and Swagger documentation.

## Module Layout

Each feature module follows the same production-friendly structure:

| File | Responsibility |
| --- | --- |
| `routes.ts` | Express route registration, middleware ordering, Swagger route docs |
| `validator.ts` | Zod schemas for body, params, and query validation |
| `controller.ts` | HTTP request parsing and response formatting |
| `service.ts` | Business rules, authorization-sensitive decisions, workflow orchestration |
| `repository.ts` | Prisma queries and persistence concerns |
| `types.ts` | Request, response, actor, and pagination DTOs |

Current modules:

- Auth
- Restaurant
- Category
- Menu
- Cart
- Order
- Payment
- Notification
- Review
- Wallet
- Settlement

## Repository Layer

Repositories are the only module files that should directly use Prisma models for normal data access.

Responsibilities:

- Build Prisma `where`, `select`, `orderBy`, `skip`, and `take` queries.
- Encapsulate transactions with `prisma.$transaction`.
- Return typed records shaped for the service layer.
- Keep pagination counts close to paginated queries.
- Avoid HTTP-specific concerns.

## Service Layer

Services contain business rules and cross-module workflows.

Responsibilities:

- Enforce domain rules such as completed-order review eligibility, one review per order, wallet balance movement, and settlement status transitions.
- Enforce ownership checks and role-sensitive access decisions.
- Coordinate related modules, such as payment success creating wallet transactions and order completion releasing pending wallet balance.
- Convert repository records to response DTOs.
- Throw `AppError` for expected business failures.

## Controller Layer

Controllers keep HTTP handling thin.

Responsibilities:

- Read validated `body`, `params`, and `query` values.
- Resolve authenticated actors from `request.user`.
- Call one service method per operation.
- Return responses through the shared `sendSuccess` helper.
- Avoid direct Prisma queries and avoid business logic.

## Database Flow

Request flow:

1. Express route receives request under `/api/v1`.
2. Authentication and authorization middleware run where required.
3. `validateRequest` validates body, params, and query with Zod.
4. Controller maps HTTP input to DTOs.
5. Service applies business rules.
6. Repository executes Prisma queries against PostgreSQL.
7. Response returns in the common envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Error responses use:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

## Notification Flow

Notification events are centralized through `notification/event-service.ts`.

Key event triggers:

- Order created
- Order status updated
- Order cancelled
- Payment succeeded
- Payment failed
- New paid order received by restaurant
- Restaurant approved

The event service creates notification records and can carry metadata for downstream mobile or panel clients.

## Payment Flow

Payment flow:

1. Customer creates an order from the active cart.
2. Customer calls `/payments/create-order`.
3. Backend creates a pending payment and Razorpay order.
4. Customer submits verification payload to `/payments/verify`.
5. Service validates the Razorpay signature outside development mode.
6. Payment is marked `SUCCESS`.
7. Order payment status is marked `SUCCESS`.
8. Notifications are generated.
9. Wallet service credits the restaurant share to pending balance.

## Wallet Flow

Wallet flow:

1. Successful payment calculates platform commission and restaurant share.
2. Restaurant share is credited to `RestaurantWallet.pendingBalance`.
3. A `CREDIT` wallet transaction records the restaurant share.
4. A `COMMISSION` wallet transaction records platform commission.
5. When the order becomes `COMPLETED`, the credited amount moves from `pendingBalance` to `availableBalance`.
6. A `SETTLEMENT` wallet transaction records the release from pending to available.

Wallet APIs expose:

- Current wallet balances
- Paginated transaction ledger
- Summary totals

## Settlement Flow

Settlement flow:

1. Restaurant owner requests settlement from available wallet balance.
2. Requested amount is reserved by decrementing `availableBalance`.
3. A `DEBIT` wallet transaction records the reservation.
4. Admin reviews pending settlements.
5. Admin approves or rejects.
6. Rejection refunds the reserved balance.
7. Admin marks approved settlement as paid with a reference number.
8. A `SETTLEMENT` wallet transaction records the payout.

Settlement statuses:

- `PENDING`
- `APPROVED`
- `PROCESSING`
- `PAID`
- `REJECTED`
