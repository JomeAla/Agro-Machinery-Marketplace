Agro Machinery B2B SaaS Marketplace
A B2B SaaS Marketplace for Agricultural Machinery in Nigeria, connecting buyers (farmers, cooperatives, agribusinesses) with verified sellers (manufacturers, authorized dealers, and importers of heavy machinery and farm implements).

Tech Stack
Frontend: Next.js 14, React, TypeScript, TailwindCSS
Backend: NestJS, TypeScript
Database: PostgreSQL 16, Prisma ORM
Caching: Redis
Payments: Paystack / Flutterwave APIs (B2B Escrow support)
Infrastructure: Docker, Docker Compose, Nginx

Project Structure
agro-market/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   └── backend/           # NestJS backend API
├── docker-compose.yml     # Production Docker configuration
├── docker-compose.dev.yml # Development Docker configuration
├── prisma/
│   └── schema.prisma      # Database schema
└── README.md              # Main documentation

Features
Core Features
User Authentication (JWT) with role-based access
Role-based Access Control (Buyer, Seller, Admin)
Product Catalog with categories (Tractors, Harvesters, Implements, Spare Parts)
RFQ (Request For Quote) System for heavy machinery
Order Management with status tracking
Payment Integration (Paystack, Flutterwave)
B2B Escrow Support for secure transactions
Messaging System between buyers and sellers

Admin Features
Dashboard with analytics and platform statistics
User Management (view, suspend, delete, create)
Product Moderation (approve, reject, flag)
Order Management and dispute resolution
Transaction monitoring and refunds
Settings Management (payment gateways, platform config)
FAQ Management (categories and articles)
Support Ticket Management
Promotions Management (banners, discount codes)

Seller Features
Seller Dashboard with sales analytics
Product Management (create, edit, delete, list)
Order Management (view orders, update status)
RFQ Response (submit quotes to buyer requests)
Company Profile Management
Featured Products placement

Buyer Features
Product Search and Filtering
RFQ Creation (Request for Quote)
Order Tracking
Messaging with sellers
Payment Processing
Support Ticket creation

Additional Features
Financing/Leasing Options with loan calculations
Freight/Logistics Tracking for Nigeria
Equipment Maintenance records and schedules
Warranty Claims management
FAQ Knowledge Base
Promotions (banners, discount codes, featured products)
Getting Started
Prerequisites
Node.js 18+
Docker & Docker Compose
PostgreSQL 16 (or use Docker)
Redis (or use Docker)
docker-compose logs -f backend
License
MIT
