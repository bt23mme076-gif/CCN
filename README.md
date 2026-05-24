# CableEasy - Cable Operator Recharge Portal

A complete full-stack cable operator recharge portal built with Next.js 14, TypeScript, PostgreSQL, and Razorpay.

## Features

### Customer Portal
- User registration with mobile number and 4-digit PIN
- Secure login with JWT authentication
- Browse and select cable plans
- Online payment via Razorpay
- View recharge history
- Track active plan and expiry date

### Admin Panel
- Operator login
- Dashboard with key metrics (pending activations, revenue, customers)
- Activate paid recharges
- View all recharges with search and filters
- Manage customers
- Create and manage plans (show/hide)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT in httpOnly cookies, bcrypt for PIN hashing
- **Payments**: Razorpay
- **Fonts**: DM Sans (body), Syne (headings)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cableeasy
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
JWT_SECRET=your-super-secret-jwt-key-change-this
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Make sure PostgreSQL is running and create a database:

```sql
CREATE DATABASE cableeasy;
```

### 3. Run Migrations

Generate and run database migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Seed Database

Seed the database with initial plans and admin user:

```bash
npm run db:seed
```

This will create:
- 5 cable plans (Basic, ALL in ONE, Gold, Platinum, ALL in ONE 3M)
- Admin user with credentials:
  - Username: `admin`
  - Password: `admin123`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### customers
- id (text, primary key)
- name (text)
- mobile (text, unique)
- stb_number (text)
- area (text)
- pin_hash (text)
- created_at (timestamp)

### plans
- id (text, primary key)
- name (text)
- price (integer, in paise)
- duration_days (integer)
- channels (text array)
- is_popular (boolean)
- is_active (boolean)
- created_at (timestamp)

### recharges
- id (text, primary key)
- customer_id (text, foreign key)
- plan_id (text, foreign key)
- plan_name (text)
- amount (integer, in paise)
- status (text: 'pending' | 'paid' | 'activated' | 'failed')
- razorpay_order_id (text)
- razorpay_payment_id (text)
- razorpay_signature (text)
- paid_at (timestamp)
- activated_at (timestamp)
- activated_by (text)
- expires_at (timestamp)
- created_at (timestamp)

### admins
- id (text, primary key)
- username (text, unique)
- password_hash (text)
- created_at (timestamp)

## API Routes

### Customer Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Customer login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current customer

### Plans
- `GET /api/plans` - Get all active plans (public)

### Recharge
- `POST /api/recharge/create-order` - Create Razorpay order (auth required)
- `POST /api/recharge/verify-payment` - Verify payment (auth required)
- `GET /api/recharge/history` - Get recharge history (auth required)

### Admin Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout

### Admin Operations
- `GET /api/admin/stats` - Get dashboard stats
- `GET /api/admin/recharges` - Get all recharges (with filters)
- `POST /api/admin/recharges/[id]/activate` - Activate a recharge
- `GET /api/admin/customers` - Get all customers (with search)
- `GET /api/admin/plans` - Get all plans
- `POST /api/admin/plans` - Create new plan
- `PATCH /api/admin/plans/[id]` - Toggle plan active status

### Webhooks
- `POST /api/razorpay/webhook` - Razorpay webhook for payment updates

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Drizzle Studio

## Design System

### Colors
- Brand Navy: `#1a1a2e`
- Accent Red: `#e63946`
- Accent Blue: `#457b9d`
- Success Green: `#2d6a4f`
- Background: `#ffffff`
- Gray 1: `#f8f8f6`
- Gray 2: `#ededeb`

### Status Badges
- Pending: Amber background
- Paid: Blue background
- Activated: Green background
- Failed: Red background

## Payment Flow

1. Customer selects a plan
2. Frontend calls `/api/recharge/create-order` to create Razorpay order
3. Razorpay checkout modal opens
4. Customer completes payment
5. Frontend calls `/api/recharge/verify-payment` to verify signature
6. Recharge status updated to 'paid'
7. Admin activates the recharge from admin panel
8. Recharge status updated to 'activated' with expiry date

## Security Features

- JWT tokens stored in httpOnly cookies
- PIN hashing with bcrypt (10 rounds)
- Razorpay signature verification
- Protected routes with middleware
- Input validation with Zod
- SQL injection prevention with Drizzle ORM

## Production Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations: `npm run db:migrate`
4. Seed database: `npm run db:seed`
5. Build: `npm run build`
6. Start: `npm start`

## License

MIT
