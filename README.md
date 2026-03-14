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
│   └── backend/           # NestJS backend API
├── docker-compose.yml     # Production Docker configuration
├── docker-compose.dev.yml # Development Docker configuration
├── prisma/
│   └── schema.prisma      # Database schema
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

### Default Admin Credentials
- Email: admin@agromarket.com
- Password: Admin@123

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
- PostgreSQL: localhost:5433
- Redis: localhost:6380

## Docker Configuration

### Build Issues and Troubleshooting

If you encounter Docker build issues, here's what was fixed:

#### 1. .dockerignore
The `dist` folder must NOT be excluded from Docker build context:
```
# CORRECT - dist is NOT excluded
node_modules
.git
.env*.local
coverage
.vscode
.idea
*.log
__tests__
*.spec.ts
*.test.ts
```

#### 2. Prisma Binary Targets
Updated in `prisma/schema.prisma` to support multiple platforms:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x", "debian-openssl-1.1.x", "debian-openssl-3.0.x"]
}
```

#### 3. Dockerfile
Must include dev dependencies:
```dockerfile
RUN npm install --include=dev
```

#### 4. Common Issues
- **Port already in use**: Stop any local processes using ports 3000, 4000, 5433, 6380
- **Prisma generate fails**: Ensure network connectivity for downloading Prisma engines
- **Module not found**: Verify `npm install --include=dev` is used in Dockerfile
- **Build timeout**: Increase Docker Desktop resources (CPU, Memory)

## API Documentation

For comprehensive API documentation, see [API.md](API.md)

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

## License

MIT