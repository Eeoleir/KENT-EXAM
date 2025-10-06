# EXAM App - Setup (5 minutes)

## Prerequisites

- Node 18+ (verify with `node -v`)
- npm 9+ (verify with `npm -v`)
- Stripe account (test mode)
- Stripe CLI (for local webhooks): https://stripe.com/docs/stripe-cli
- MySQL 8+ running locally (or adjust DATABASE_URL)

## 1) Backend setup

Create `backend/.env` (see examples below):

```
DATABASE_URL="mysql://root@127.0.0.1:3306/exam"
JWT_SECRET="your-strong-secret"
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Install & run:

```
cd backend
npm i
npx prisma generate
npx prisma db push
npm run dev
```

Seed admin user:

```
npm run seed   # admin@gmail.com / admin123
```

Start Stripe webhook (new terminal):

```
stripe login
stripe listen --forward-to http://localhost:4000/api/webhooks/stripe
```

## 2) Frontend setup

Create `frontend/.env.local` (optional if backend uses 4000):

```
NEXT_PUBLIC_API_BASE=http://localhost:4000/api
```

Install & run:

```
cd frontend
npm i
npm run dev
```

## Usage

- Register or log in.
- Home page acts as Dashboard.
- If not subscribed: click Subscribe → Stripe Checkout (test card 4242 4242 4242 4242).
- On success, webhook marks your account active; page shows “You are subscribed.”
- Video Library: add YouTube URL, list renders embedded players. Duplicates blocked.
- Admin: `/admin` (restricted to admin).

## Notes

- Auth: custom JWT (httpOnly cookie). Roles: USER/ADMIN.
- Security: Webhook signature verified; role checks server-side; secrets via env.
- DB: Prisma models `users` and `videos` with constraints.
- Dev caveat: Ensure Stripe envs are set and `stripe listen` is running during test checkout.

## Production build & run

Backend:

```
cd backend
npm run build
PORT=4000 npm start
```

Notes:

- Set `CORS_ORIGIN` to your frontend origin (e.g., https://app.example.com) or keep permissive dev CORS only for local.
- Ensure `JWT_SECRET` is set (the app will throw if missing in production).
- Use HTTPS in prod; set secure cookies if served over TLS.

Frontend:

```
cd frontend
npm run build
PORT=3000 npm start
```

Set `NEXT_PUBLIC_API_BASE` to your backend URL (e.g., https://api.example.com/api).

Stripe Webhooks in production:

- In Stripe Dashboard → Developers → Webhooks → Add endpoint.
- URL: `https://api.example.com/api/webhooks/stripe`; select `checkout.session.completed`.
- Copy the signing secret and set `STRIPE_WEBHOOK_SECRET` in backend `.env`.

## .env examples

`backend/.env.example`

```
DATABASE_URL="mysql://root@127.0.0.1:3306/exam"
JWT_SECRET="change-me"
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

`frontend/.env.local.example`

```
NEXT_PUBLIC_API_BASE=http://localhost:4000/api
```

## Troubleshooting

- Prisma generate EPERM on Windows: close node processes, delete `backend/node_modules/.prisma/client`, re-run `npx prisma generate`.
- Stripe webhook 400: verify `STRIPE_WEBHOOK_SECRET` matches your active forwarder or dashboard endpoint.
- CORS/credentials: ensure frontend uses `withCredentials: true` and backend CORS allows origin+credentials.
- Database auth: confirm `DATABASE_URL` credentials and that DB `exam` exists.

## Scripts

Backend:

- `npm run dev`: start dev server
- `npm run build`: compile TypeScript
- `npm start`: run built server
- `npm run seed`: seed admin user

Frontend:

- `npm run dev`: start Next.js dev server
- `npm run build`: build for production
- `npm start`: run production server
