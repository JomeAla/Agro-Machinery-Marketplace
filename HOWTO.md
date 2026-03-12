# How-To Guide: Agro Machinery Marketplace

This guide provides step-by-step instructions for common tasks in the Agro Machinery B2B SaaS Marketplace.

## Table of Contents

1. [Setting Up Development Environment](#setting-up-development-environment)
2. [Running the Application](#running-the-application)
3. [Using Docker](#using-docker)
4. [Database Management](#database-management)
5. [Admin Panel Usage](#admin-panel-usage)
6. [Testing the Application](#testing-the-application)

---

## Setting Up Development Environment

### Prerequisites

Ensure you have the following installed:
- Node.js 18 or higher
- Docker Desktop
- Git

### Clone the Repository

```bash
git clone https://github.com/JomeAla/Agro-Machinery-Marketplace.git
cd agro-market/agro-market
```

### Install Dependencies

```bash
# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configure Environment Variables

```bash
# Copy the example env file
cp apps/backend/.env.example apps/backend/.env

# Edit with your settings
# Required: DATABASE_URL, JWT_SECRET
```

---

## Running the Application

### Option 1: Using Docker (Recommended)

#### Production Mode
```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all containers
docker-compose down
```

#### Development Mode
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Option 2: Running Locally

#### Start Backend
```bash
cd apps/backend
npm run start:dev
```
The API will be available at http://localhost:4000

#### Start Frontend
```bash
cd apps/frontend
npm run dev
```
The app will be available at http://localhost:3000

---

## Using Docker

### Starting All Services

```bash
# From the agro-market directory
docker-compose up -d
```

### Checking Container Status

```bash
docker ps
```

### Viewing Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Restarting Services

```bash
# Restart a specific service
docker-compose restart backend

# Restart all services
docker-compose restart
```

### Rebuilding Images

```bash
# Rebuild with no cache
docker-compose build --no-cache

# Rebuild and start
docker-compose up -d --build
```

### Accessing Containers

```bash
# Access backend container
docker exec -it agro-market-backend-1 sh

# Access postgres container
docker exec -it agro-market-postgres psql -U postgres
```

---

## Database Management

### Running Migrations

```bash
# From host machine
cd apps/backend
npx prisma migrate deploy

# Or for development
npx prisma migrate dev
```

### Creating a New Migration

```bash
cd apps/backend
npx prisma migrate dev --name migration_name
```

### Seeding the Database

```bash
# Seed admin user
cd apps/backend
npx ts-node prisma/seed-admin.ts

# Seed sample data
npx ts-node prisma/seed.ts
```

### Resetting the Database

```bash
cd apps/backend
npx prisma migrate reset
```

### Viewing Database

```bash
# Using docker exec
docker exec -it agro-market-postgres psql -U postgres -d agro_market

# Or use a GUI tool like DBeaver, pgAdmin, or TablePlus
# Connection: localhost:5433
# Database: agro_market
# User: postgres
# Password: Mylordhelpme12
```

---

## Admin Panel Usage

### Accessing the Admin Panel

1. Start the application
2. Navigate to http://localhost:3000/admin
3. Login with an admin account

### Admin Dashboard Features

#### Dashboard Overview
- Total users (buyers/sellers)
- Total orders & revenue
- Active listings
- Platform growth charts

#### User Management
- View all users
- Filter by role (Buyer/Seller)
- Search by name or email
- Suspend/delete user accounts
- View user details & activity

#### Product Moderation
- View all products
- Filter by status (Pending/Approved/Rejected/Flagged)
- Search products
- Approve/Reject pending products
- Flag inappropriate listings

#### Order Management
- View all platform orders
- Filter by status
- Search by order number
- Resolve disputes
- Manual order interventions

### Creating an Admin User

The easiest way to create an admin user is through seeding:

```bash
cd apps/backend
npx ts-node prisma/seed-admin.ts
```

This will create an admin user with:
- Email: admin@agromarket.com
- Password: admin123

---

## Testing the Application

### Testing the API

```bash
# Test if the API is running
curl http://localhost:4000

# Test authentication
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agromarket.com","password":"admin123"}'
```

### Testing the Frontend

1. Open http://localhost:3000 in your browser
2. You should see the marketplace homepage

### Testing Admin Panel

1. Navigate to http://localhost:3000/admin
2. Login with admin credentials
3. You should see the admin dashboard

---

## Common Issues

### Database Connection Error

If you see "Can't reach database server":
1. Ensure PostgreSQL container is running: `docker ps`
2. Check the DATABASE_URL in .env
3. Try restarting the backend: `docker-compose restart backend`

### Port Already in Use

If you get "Port already in use":
```bash
# Find what's using the port
netstat -ano | findstr :3000
# or
lsof -i :3000

# Kill the process or use a different port
```

### Node Modules Issues

If you encounter issues with node_modules:
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker Build Fails

If Docker build fails:
```bash
# Clean Docker system
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

---

## Next Steps

After setting up, you can:

1. Explore the admin panel at `/admin`
2. Add payment gateway credentials (Paystack/Flutterwave)
3. Configure platform settings
4. Invite sellers and buyers to the platform
5. Set up CI/CD for production deployment

---

## Getting Help

- Check the main README.md for architecture details
- Review the plan.md for feature roadmap
- Check task-todo-list.md for implementation status
