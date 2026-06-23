# Deployment

This guide covers production deployment for the backend API.

## Runtime

- Node.js `>=20.0.0`
- PostgreSQL
- Prisma ORM
- Express
- TypeScript compiled to `dist`

## Required Environment Variables

Configure these in the deployment platform:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
JWT_ACCESS_SECRET=replace-with-strong-secret
JWT_REFRESH_SECRET=replace-with-strong-secret
RAZORPAY_KEY_ID=replace-with-key-id
RAZORPAY_KEY_SECRET=replace-with-key-secret
```

Use the exact variable names already expected by `backend/src/config/env.ts`.

## Build

From `backend`:

```bash
npm install
npm run prisma:generate
npm run build
```

## Database Migration

Apply migrations before starting the API:

```bash
npm run prisma:deploy
```

For development migration creation:

```bash
npm run prisma:migrate
```

## Start

```bash
npm run start
```

The compiled entry point is:

```bash
dist/server.js
```

## Health Check

Use:

```text
GET /api/v1/health
```

## Swagger

Runtime Swagger UI is served by the Express app at:

```text
/api-docs
```

The raw runtime Swagger JSON is served at:

```text
/api-docs.json
```

Static generated exports are stored in:

```text
backend/swagger/swagger.json
backend/swagger/swagger.yaml
```

## Postman

Import:

```text
backend/postman/Food-Pickup-Platform.postman_collection.json
backend/postman/Food-Pickup-Local.postman_environment.json
```

The local environment uses:

```text
http://localhost:3000/api/v1
```

## Production Checklist

- [ ] `NODE_ENV=production` is set.
- [ ] Database migrations have been deployed.
- [ ] Prisma client has been generated.
- [ ] JWT secrets are strong and private.
- [ ] Razorpay credentials are production credentials.
- [ ] CORS settings match the deployed client domains.
- [ ] Logs are collected by the hosting platform.
- [ ] Health endpoint is monitored.
- [ ] Backups are configured for PostgreSQL.
- [ ] Postman smoke tests pass against the deployed base URL.
