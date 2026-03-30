# Agro Machinery B2B SaaS Marketplace

A B2B SaaS Marketplace for Agricultural Machinery in Nigeria, connecting buyers (farmers, cooperatives, agribusinesses) with verified sellers (manufacturers, authorized dealers, and importers of heavy machinery and farm implements).

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Payments:** Paystack / Flutterwave APIs (B2B Escrow support)

## Project Structure

```
agro-market/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   └── backend/           # NestJS backend API
├── start-backend.bat      # Windows script to start backend
├── start-frontend.bat     # Windows script to start frontend
└── README.md              # Main documentation
```

## Features

### Core Features
- User Authentication (JWT) with role-based access
- Role-based Access Control (Buyer, Seller, Admin)
- Product Catalog with categories (Tractors, Harvesters, Implements, Spare Parts)
- RFQ (Request For Quote) System for heavy machinery
- Order Management with status tracking
- Payment Integration (Paystack, Flutterwave)
- B2B Escrow Support for secure transactions
- Messaging System between buyers and sellers

### Admin Features
- Dashboard with analytics and platform statistics
- User Management (view, suspend, delete, create)
- Product Moderation (approve, reject, flag)
- Order Management and dispute resolution
- Transaction monitoring and refunds
- Settings Management (payment gateways, platform config)
- FAQ Management (categories and articles)
- Support Ticket Management
- Promotions Management (banners, discount codes)

### Seller Features
- Seller Dashboard with sales analytics
- Product Management (create, edit, delete, list)
- Order Management (view orders, update status)
- RFQ Response (submit quotes to buyer requests)
- Company Profile Management
- Featured Products placement

### Buyer Features
- Product Search and Filtering
- RFQ Creation (Request for Quote)
- Order Tracking
- Messaging with sellers
- Payment Processing
- Support Ticket creation

### Additional Features
- Financing/Leasing Options with loan calculations
- Freight/Logistics Tracking for Nigeria
- Equipment Maintenance records and schedules
- Warranty Claims management
- FAQ Knowledge Base
- Promotions (banners, discount codes, featured products)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (running locally on port 5432)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JomeAla/Agro-Machinery-Marketplace.git
cd agro-market
```

2. Install dependencies:
```bash
# Backend
cd apps/backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Configure environment variables:
```bash
# Backend .env is already configured for local PostgreSQL
# Edit apps/backend/.env if your PostgreSQL credentials differ
```

### Running the Application

#### Quick Start (Windows)

Double-click the batch files in the project root:
- `start-backend.bat` — starts the backend on port 4000
- `start-frontend.bat` — starts the frontend on port 3000

#### Manual Start

**Backend:**
```bash
cd apps/backend
npx ts-node src/main.ts
```

**Frontend:**
```bash
cd apps/frontend
npm run dev
```

### Database Setup

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed admin user
npx ts-node prisma/seed-admin.ts
```

## Admin Panel

Access the admin panel at `/admin` with an admin account.

### Default Admin Credentials
- Email: `admin@agromarket.com`
- Password: `Admin@123`

### Admin Features

- Dashboard with analytics
- User Management (view, suspend, delete, create)
- Product Moderation (approve, reject, flag)
- Order Management
- Payment Configuration
- Settings Management
- Support Ticket Management
- FAQ Management
- Promotions Management

## Ports

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432

## API Documentation

For comprehensive API documentation, see [API.md](API.md).
Swagger docs available at http://localhost:4000/api/docs when backend is running.

## Environment Variables

### Backend (apps/backend/.env)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/agro_market
JWT_SECRET=agro-market-dev-secret-key-2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Frontend (apps/frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## License

MIT
