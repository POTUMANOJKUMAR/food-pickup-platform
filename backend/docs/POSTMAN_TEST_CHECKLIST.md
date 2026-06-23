# Postman Test Checklist

Use this checklist with `backend/postman/Food-Pickup-Platform.postman_collection.json` and `backend/postman/Food-Pickup-Local.postman_environment.json`.

## Authentication Tests

| Scenario | Expected Result | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| Register user with valid payload | `201/200`, user and token data returned | [ ] Tested | [ ] Passed | [ ] Failed |
| Login with valid credentials | Access token and refresh token returned | [ ] Tested | [ ] Passed | [ ] Failed |
| Refresh token with valid refresh token | New access token returned | [ ] Tested | [ ] Passed | [ ] Failed |
| Logout with valid refresh token | Token revoked or success response returned | [ ] Tested | [ ] Passed | [ ] Failed |
| Fetch `/auth/me` with bearer token | Current authenticated user returned | [ ] Tested | [ ] Passed | [ ] Failed |
| Fetch protected API without token | `401` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Fetch protected API with invalid token | `401` response | [ ] Tested | [ ] Passed | [ ] Failed |

## Authorization Tests

| Scenario | Expected Result | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| User accesses user-only cart APIs | Request succeeds for owned cart | [ ] Tested | [ ] Passed | [ ] Failed |
| Restaurant owner creates restaurant-owned resources | Request succeeds only for owned restaurant | [ ] Tested | [ ] Passed | [ ] Failed |
| Restaurant owner modifies another owner's resource | `403` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Admin approves restaurant | Request succeeds for admin | [ ] Tested | [ ] Passed | [ ] Failed |
| Non-admin approves restaurant | `403` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Customer updates order status | `403` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Restaurant owner reads wallet | Request succeeds only for owned restaurant | [ ] Tested | [ ] Passed | [ ] Failed |
| Non-admin approves/rejects/marks settlement paid | `403` response | [ ] Tested | [ ] Passed | [ ] Failed |

## Validation Tests

| Scenario | Expected Result | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| Invalid UUID path param | `400 Validation failed` | [ ] Tested | [ ] Passed | [ ] Failed |
| Missing required request body field | `400 Validation failed` | [ ] Tested | [ ] Passed | [ ] Failed |
| Extra unexpected request body field | `400 Validation failed` | [ ] Tested | [ ] Passed | [ ] Failed |
| Invalid pagination query | `400 Validation failed` | [ ] Tested | [ ] Passed | [ ] Failed |
| Rating outside 1-5 | `400 Validation failed` | [ ] Tested | [ ] Passed | [ ] Failed |
| Invalid enum value | `400 Validation failed` | [ ] Tested | [ ] Passed | [ ] Failed |
| Invalid email/password/auth payload | `400 Validation failed` or handled auth error | [ ] Tested | [ ] Passed | [ ] Failed |

## Success Cases

| Flow | Expected Result | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| Auth: register, login, me, refresh, logout | Full auth lifecycle succeeds | [ ] Tested | [ ] Passed | [ ] Failed |
| Restaurant: create, approve, list, get, update, delete | Restaurant lifecycle succeeds | [ ] Tested | [ ] Passed | [ ] Failed |
| Category: create, list, get, update, delete | Category lifecycle succeeds | [ ] Tested | [ ] Passed | [ ] Failed |
| Menu: create, list, get, update, delete | Menu lifecycle succeeds | [ ] Tested | [ ] Passed | [ ] Failed |
| Cart: add, update, remove, clear | Cart lifecycle succeeds | [ ] Tested | [ ] Passed | [ ] Failed |
| Order: create from cart, list, get, update status, cancel | Order lifecycle succeeds | [ ] Tested | [ ] Passed | [ ] Failed |
| Payment: create Razorpay order, verify, history | Payment lifecycle succeeds | [ ] Tested | [ ] Passed | [ ] Failed |
| Notification: create, list, read, read-all, delete | Notification lifecycle succeeds | [ ] Tested | [ ] Passed | [ ] Failed |
| Review: create after completed order, list, summary, update, delete | Review lifecycle succeeds | [ ] Tested | [ ] Passed | [ ] Failed |
| Wallet: get wallet, list transactions, summary | Wallet APIs return balances and ledger data | [ ] Tested | [ ] Passed | [ ] Failed |
| Settlement: request, approve, reject, mark paid | Settlement lifecycle succeeds with correct role | [ ] Tested | [ ] Passed | [ ] Failed |

## Failure Cases

| Flow | Expected Result | Tested | Passed | Failed |
| --- | --- | --- | --- | --- |
| Login with wrong password | Handled auth failure | [ ] Tested | [ ] Passed | [ ] Failed |
| Duplicate unique resource where applicable | `409` or handled domain error | [ ] Tested | [ ] Passed | [ ] Failed |
| Create order from empty cart | `400` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Pay cancelled order | `400` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Verify payment with bad signature outside development | `400` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Review non-completed order | `400` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Review same order twice | `409` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Edit/delete another user's review | `403` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Request settlement above available balance | `400` response | [ ] Tested | [ ] Passed | [ ] Failed |
| Mark non-approved settlement as paid | `400` response | [ ] Tested | [ ] Passed | [ ] Failed |
