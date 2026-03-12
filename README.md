# Agro Machinery B2B SaaS Marketplace

A B2B SaaS Marketplace for Agricultural Machinery in Nigeria, connecting buyers (farmers, cooperatives, agribusinesses) with verified sellers (manufacturers, authorized dealers, and importers of heavy machinery and farm implements).

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL 16, Prisma ORM
- **Caching:** Redis
- **Payments:** Paystack / Flutterwave APIs (B2B Escrow support)
- **Infrastructure:** Docker, Docker Compose, Nginx

## Project Structure

```
agro-market/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   └── backend/          # NestJS backend API
├── docker-compose.yml    # Production Docker configuration
├── docker-compose.dev.yml # Development Docker configuration
└── prisma/
    └── schema.prisma     # Database schema
```

## Features

- User Authentication (JWT)
- Role-based Access Control (Buyer, Seller, Admin)
- Product Catalog with categories (Tractors, Harvesters, Implements, Spare Parts)
- RFQ (Request For Quote) System for heavy machinery
- Order Management
- Payment Integration (Paystack, Flutterwave)
- B2B Escrow Support
- Messaging System
- Admin Dashboard
- Seller Dashboard
- Buyer Dashboard
- Financing/Leasing Options
- Freight/Logistics Tracking

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis (or use Docker)

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
cd apps/frontend
npm install
```

3. Configure environment variables:
```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your database URL and other configs
```

### Running with Docker

#### Production Mode
```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

#### Development Mode
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Running without Docker

#### Backend
```bash
cd apps/backend
npm run start:dev
```

#### Frontend
```bash
cd apps/frontend
npm run dev
```

### Database Migrations

```bash
cd apps/backend
npx prisma migrate deploy
# or for development
npx prisma migrate dev
```

### Database Seeding

```bash
# Seed admin user
npx ts-node prisma/seed-admin.ts

# Seed sample data
npx ts-node prisma/seed.ts
```

## Admin Panel

Access the admin panel at `/admin` with an admin account.

### Admin Features

- Dashboard with analytics
- User Management (view, suspend, delete)
- Product Moderation (approve, reject, flag)
- Order Management
- Payment Configuration
- Settings Management

## API Documentation

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout user

### Products

- `GET /products` - List products
- `GET /products/:id` - Get product details
- `POST /products` - Create product (seller)
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Orders

- `GET /orders` - List orders
- `POST /orders` - Create order
- `PATCH /orders/:id/status` - Update order status

### RFQ

- `GET /rfqs` - List RFQs
- `POST /rfqs` - Create RFQ
- `POST /rfqs/quotes` - Submit quote

### Admin

- `GET /admin/analytics` - Platform analytics
- `GET /admin/users` - List users
- `PATCH /admin/users/:id/status` - Update user status
- `GET /admin/products` - List products for moderation
- `POST /admin/products/:id/approve` - Approve product
- `POST /admin/products/:id/reject` - Reject product

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5433/agro_market
REDIS_HOST=localhost
REDIS_PORT=6380
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Deployment

### Docker Production Build

```bash
# Build images
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Ports

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5433
- Redis: localhost:6380

## License

MIT
