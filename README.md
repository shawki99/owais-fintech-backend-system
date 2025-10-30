# Owais Fintech Backend



## Requirements
- Node 20+
- Docker & docker-compose

## Setup
1. Install dependencies
```bash
npm install
```
2. Build
```bash
npm run build
```
3. Run services (Docker)
```bash
docker-compose up -d db redis
```
4a. Start API (host dev)
```bash
npm run start:dev
```

4b. Or start API in Docker
```bash
docker-compose up -d --build api
```

The API listens on http://localhost:3000

## Environment
Create a local `.env` (see keys below) or rely on docker-compose defaults.

- DATABASE_URL=postgres://postgres:postgres@localhost:5432/oasis
- JWT_SECRET=your_secret
- JWT_EXPIRES_IN=3600s
- REDIS_HOST=localhost
- REDIS_PORT=6379
- STRIPE_SECRET_KEY=sk_test_xxx
- STRIPE_WEBHOOK_SECRET=whsec_xxx

Notes:
- Stripe keys are optional for gateway flow; wallet flow works without them. If set, expose a webhook endpoint at `/payments/stripe/webhook` and configure your Stripe CLI or dashboard accordingly.
- Do not commit `.env` (excluded via `.gitignore`).

## Endpoints (summary)
- Auth: `POST /auth/signup`, `POST /auth/login`
- Wallet: `POST /wallet/deposit`, `POST /wallet/withdraw`, `GET /wallet`, `GET /wallet/transactions`
- Products: `POST /products` (merchant), `GET /products`
- Orders: `POST /orders` (wallet|gateway)
- Payments: `POST /payments/stripe/webhook` (webhook)

## Testing
```bash
npm test
```

## Notes
- Uses PostgreSQL, Redis, Stripe (test mode)
- TypeORM transactions for atomicity and `FOR UPDATE` locks for concurrency
- Redis cache for product listing and wallet balance; invalidated on updates
- Structured logging via winston
 - Uses `bcryptjs` for compatibility inside Docker (no native binaries required)

## Quick E2E (PowerShell)
```powershell
$base='http://localhost:3000'
$mt=(Invoke-RestMethod -Method Post -Uri "$base/auth/signup" -ContentType 'application/json' -Body (@{email='m1@example.com'; password='secret12'; role='merchant'}|ConvertTo-Json)).accessToken
$ut=(Invoke-RestMethod -Method Post -Uri "$base/auth/signup" -ContentType 'application/json' -Body (@{email='u1@example.com'; password='secret12'; role='user'}|ConvertTo-Json)).accessToken
$pid=(Invoke-RestMethod -Method Post -Uri "$base/products" -Headers @{Authorization="Bearer $mt"} -ContentType 'application/json' -Body (@{name='Gift Card $50'; price=50; availableUnits=2}|ConvertTo-Json)).id
Invoke-RestMethod -Method Post -Uri "$base/wallet/deposit" -Headers @{Authorization="Bearer $ut"} -ContentType 'application/json' -Body (@{amount=100}|ConvertTo-Json)
Invoke-RestMethod -Method Post -Uri "$base/orders" -Headers @{Authorization="Bearer $ut"} -ContentType 'application/json' -Body (@{productId=$pid; paymentMethod='wallet'}|ConvertTo-Json)
```

## Troubleshooting
- If Docker build fails with an I/O error, restart Docker Desktop and rerun `docker-compose build api && docker-compose up -d api`.
- If running on host, ensure Postgres and Redis are reachable on localhost and `.env` points to them.
