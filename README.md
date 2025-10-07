# Kent Exam - Subscription Video Platform

A full-stack subscription-based video platform built with Next.js, TypeScript, Prisma, and Stripe.

## Features

- **Authentication**: Email/password sign up & sign in with role-based access (USER/ADMIN)
- **Stripe Subscriptions**: Test mode subscription handling with webhook verification
- **Protected Dashboard**: Subscriber-only access to video library
- **Admin Panel**: User management and subscription status overview
- **Video Library**: YouTube URL validation, storage, and embedded playback
- **Security**: Webhook signature verification, route protection, and secret management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL (production) / SQLite (development)
- **Payments**: Stripe (test mode)
- **Authentication**: JWT with httpOnly cookies
- **Deployment**: Render (backend), Vercel/Netlify (frontend)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (for production)
- Stripe account (test mode)

### 1. Clone and Install

```bash
git clone <repository-url>
cd kent-exam
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Setup

#### Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kent_exam"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PRICE_ID="price_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Server
PORT=4000
NODE_ENV="development"
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

### 3. Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 4. Run Development Servers

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **Admin Login**: admin@gmail.com / admin123

## Stripe Setup

### 1. Create Stripe Account

- Sign up at [stripe.com](https://stripe.com)
- Enable test mode

### 2. Create Product & Price

- Go to Products → Add Product
- Create a subscription product
- Copy the Price ID to `STRIPE_PRICE_ID`

### 3. Configure Webhook

- Go to Developers → Webhooks
- Add endpoint: `https://your-domain.com/api/webhooks/stripe`
- Select event: `checkout.session.completed`
- Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Test Cards

- Use `4242 4242 4242 4242` for successful payments
- Use `4000 0000 0000 0002` for declined payments

## Project Structure

```
kent-exam/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth middleware
│   │   ├── lib/            # Database connection
│   │   └── server.ts       # Express server
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Admin user seed
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   │   ├── dashboard/  # Protected dashboard
│   │   │   ├── admin/      # Admin panel
│   │   │   ├── login/      # Auth pages
│   │   │   └── register/
│   │   └── lib/            # API client
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Billing

- `POST /api/billing/create-checkout-session` - Create Stripe checkout
- `GET /api/billing/status` - Check subscription status

### Videos

- `GET /api/videos` - List user's videos (subscribers only)
- `POST /api/videos` - Add YouTube URL (subscribers only)

### Admin

- `GET /api/admin` - List all users (admin only)

### Webhooks

- `POST /api/webhooks/stripe` - Stripe webhook handler

## Security Features

- **JWT Authentication**: Secure token-based auth with httpOnly cookies
- **Role-Based Access**: USER/ADMIN roles with proper middleware
- **Route Protection**: All sensitive routes require authentication
- **Webhook Verification**: Stripe signature verification
- **Input Validation**: Zod schemas for all API inputs
- **Secret Management**: Environment variables for all secrets
- **Error Sanitization**: No sensitive data in error responses

## Deployment

### Backend (Render)

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Frontend (Vercel/Netlify)

1. Connect GitHub repository
2. Set `NEXT_PUBLIC_API_URL` to production backend URL
3. Deploy automatically on push

## Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Admin user access
- [ ] Stripe subscription flow
- [ ] Webhook activation
- [ ] Video library access (subscribers only)
- [ ] YouTube URL validation
- [ ] Route protection
- [ ] Error handling

### Test Accounts

- **Admin**: admin@gmail.com / admin123
- **Test User**: Register new account via UI

## Troubleshooting

### Common Issues

1. **Webhook not working**

   - Check webhook URL in Stripe dashboard
   - Verify `STRIPE_WEBHOOK_SECRET` matches
   - Ensure webhook endpoint is accessible

2. **Database connection issues**

   - Verify `DATABASE_URL` format
   - Run `npx prisma migrate dev`
   - Check database server status

3. **Authentication issues**
   - Verify `JWT_SECRET` is set
   - Check cookie settings for production
   - Ensure CORS is configured correctly

## Development Notes

- All Stripe operations are in test mode
- Database uses PostgreSQL in production, SQLite in development
- Frontend polls for subscription status after Stripe redirect
- Video validation supports youtube.com and youtu.be URLs
- Admin user is seeded automatically on database setup

## License

This project is for educational purposes only.
