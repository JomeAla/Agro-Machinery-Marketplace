# How-To Guide: Agro Machinery Marketplace

This guide provides step-by-step instructions for common tasks in the Agro Machinery B2B SaaS Marketplace, including UI workflows and feature usage.

## Table of Contents

1. [Setting Up Development Environment](#setting-up-development-environment)
2. [Running the Application](#running-the-application)
3. [Using Docker](#using-docker)
4. [User Registration and Roles](#user-registration-and-roles)
5. [Buyer Features and Workflows](#buyer-features-and-workflows)
6. [Seller Features and Workflows](#seller-features-and-workflows)
7. [Admin Panel Usage](#admin-panel-usage)
8. [Support Tickets](#support-tickets)
9. [FAQ Management](#faq-management)
10. [Promotions Management](#promotions-management)
11. [Maintenance Features](#maintenance-features)
12. [Financing System](#financing-system)
13. [Freight and Logistics](#freight-and-logistics)
14. [Database Management](#database-management)
15. [Testing the Application](#testing-the-application)
16. [Docker Troubleshooting](#docker-troubleshooting)

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
cd agro-market
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
docker exec -it agro-market-backend sh

# Access postgres container
docker exec -it agro-market-postgres psql -U postgres
```

---

## User Registration and Roles

### User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| BUYER | Farmers, cooperatives, agribusinesses | Browse, RFQ, Order, Pay |
| SELLER | Dealers, manufacturers, importers | List products, quotes, fulfill orders |
| ADMIN | Platform administrators | Full platform control |

### Registration Flow

1. Navigate to http://localhost:3000/register
2. Choose account type (Buyer or Seller)
3. Fill in:
   - Email address
   - Password (min 8 chars, uppercase, lowercase, number)
   - First name and Last name
   - Phone number (Nigerian format: +234...)
4. Click "Create Account"
5. Verify email (if email verification enabled)

### Login Flow

1. Navigate to http://localhost:3000/login
2. Enter email and password
3. Click "Sign In"
4. Redirected to appropriate dashboard based on role

---

## Buyer Features and Workflows

### Product Search and Browse

1. **Homepage Search**
   - Use the search bar on the homepage
   - Enter keywords (e.g., "tractor", "harvester")
   - Press Enter or click Search

2. **Category Navigation**
   - Click categories on homepage (Tractors, Harvesters, Implements, etc.)
   - Use sidebar filters on products page

3. **Filters**
   - Condition: New, Used, Refurbished
   - Price Range: Min/Max
   - Seller Location: State
   - Sort by: Price, Date, Popularity

### Product Details Page

1. View product images in gallery
2. Read product description and specifications
3. Check seller information (company, rating)
4. Click "Request Quote" or "Buy Now"

### RFQ (Request for Quote) Flow

For heavy machinery, buyers should use RFQ:

1. Navigate to http://localhost:3000/rfq
2. Click "Create RFQ"
3. Fill in details:
   - Product category needed
   - Specific requirements (brand, model, year, condition)
   - Quantity needed
   - Preferred delivery state
   - Budget range
   - Additional notes
4. Submit RFQ
5. Wait for seller quotes
6. Compare quotes (price, delivery time, warranty)
7. Accept preferred quote
8. Convert to order

### Order Placement

1. From product page, click "Buy Now"
2. Or from accepted RFQ quote
3. Review order summary:
   - Product details
   - Quantity
   - Subtotal
   - Freight cost (calculated automatically)
   - Total
4. Apply discount code (if available)
5. Select payment method (Paystack/Flutterwave)
6. Complete payment
7. Order created with PENDING status

### Order Tracking

1. Go to http://localhost:3000/orders
2. View all orders with status
3. Click an order to see:
   - Order timeline
   - Current status
   - Shipping updates
   - Payment status
4. Message seller directly from order page

### Messaging Sellers

1. From product page, click "Message Seller"
2. Or from order page
3. Type message and send
4. View conversation at http://localhost:3000/messages

---

## Seller Features and Workflows

### Seller Dashboard

Navigate to http://localhost:3000/seller

The dashboard shows:
- Total sales (this month/all time)
- Active orders
- Product views
- RFQs to respond to

### Product Management

#### Adding Products

1. Go to http://localhost:3000/seller/products
2. Click "Add Product"
3. Fill in:
   - Product name
   - Category selection
   - Description
   - Price (in Naira)
   - Condition (New/Used)
   - Quantity available
   - Specifications (various fields)
   - Upload images (up to 8)
4. Set delivery info (states served, freight)
5. Submit for approval
6. Status: PENDING → APPROVED/REJECTED by admin

#### Managing Products

1. View all products at http://localhost:3000/seller/products
2. Edit: Click product → Edit button
3. Delete: Click product → Delete button (if no orders)
4. Featured: Request to feature products (costs apply)

### Order Fulfillment

1. Go to http://localhost:3000/seller/orders
2. View orders requiring action
3. Update status:
   - CONFIRMED: Order received
   - PROCESSING: Preparing for shipping
   - SHIPPED: Added tracking info
   - DELIVERED: Confirmed delivery
4. Respond to buyer messages

### RFQ Response

1. Go to http://localhost:3000/seller/rfqs
2. View open RFQs matching your products
3. Click "Submit Quote"
4. Enter:
   - Price quote
   - Delivery timeline
   - Warranty terms
   - Additional notes
5. Submit quote
6. Wait for buyer to accept

### Company Profile

1. Go to http://localhost:3000/seller/company
2. Update:
   - Company name
   - Description
   - Contact information
   - Business address
   - Upload logo
3. Verification: Submit for admin verification

---

## Admin Panel Usage

### Accessing the Admin Panel

1. Start the application
2. Navigate to http://localhost:3000/admin
3. Login with admin credentials:
   - Email: admin@agromarket.com
   - Password: Admin@123

### Dashboard Overview

The admin dashboard shows:
- Total users (buyers/sellers)
- Total orders & revenue
- Active listings
- Platform growth charts
- Recent activities

### User Management

1. Go to Users section
2. View all users with filters:
   - Role: All, Buyers, Sellers
   - Status: Active, Suspended
   - Search by name/email
3. Actions:
   - View user details and activity
   - Suspend user account
   - Delete user (with confirmation)
   - Create new user manually

### Product Moderation

1. Go to Products section
2. View products with filters:
   - Status: Pending, Approved, Rejected, Flagged
   - Category
   - Search by name/seller
3. Actions on pending products:
   - Approve: Product goes live
   - Reject: Product removed, seller notified
   - Flag: Mark for review

### Order Management

1. Go to Orders section
2. View all platform orders
3. Filter by:
   - Status
   - Date range
   - Seller/Buyer
4. Actions:
   - View order details
   - Resolve disputes
   - Manual intervention if needed

### Transaction Monitoring

1. Go to Transactions section
2. View all payments and orders
3. Filter by:
   - Payment status
   - Date range
   - Amount
4. Actions:
   - View transaction details
   - Process refunds
   - Export reports

### Settings Management

1. Go to Settings section
2. Configure:
   - Platform name and contact
   - Payment gateway keys (Paystack/Flutterwave)
   - Tax rates
   - Commission percentages
   - Email templates

---

## Support Tickets

### Creating a Support Ticket

1. Navigate to http://localhost:3000/support or click "Help" in header
2. Click "Create Ticket"
3. Select category:
   - ACCOUNT: Login, password, profile issues
   - ORDER: Order status, problems
   - PAYMENT: Payment failures, refunds
   - PRODUCT: Product issues, listing problems
   - SHIPPING: Delivery concerns
   - REFUND: Refund requests
   - VERIFICATION: Seller/company verification
   - TECHNICAL: Website bugs, errors
   - IMPORT_PRODUCTS: Bulk import issues
   - OTHER: Miscellaneous
4. Enter:
   - Subject (brief description)
   - Detailed description
   - Attach screenshots if needed
5. Submit ticket
6. Receive ticket number for tracking

### Tracking Tickets

1. Go to http://localhost:3000/support
2. View all your tickets with status:
   - OPEN: Awaiting response
   - IN_PROGRESS: Being worked on
   - RESOLVED: Solution provided
   - CLOSED: Ticket closed
3. Click ticket to view:
   - All messages
   - Add replies
   - See resolution

### Admin Support Management

1. Go to http://localhost:3000/admin/support
2. View all tickets with filters:
   - Status
   - Priority (Low, Medium, High, Urgent)
   - Category
   - Assignee
3. Actions:
   - View ticket details
   - Change status
   - Assign to staff
   - Add responses
   - View statistics

---

## FAQ Management

### Viewing FAQ (Public)

1. Navigate to http://localhost:3000/faq
2. Browse categories
3. Click articles to read
4. Use search to find specific topics
5. Vote on helpful articles (thumbs up/down)

### Admin FAQ Management

1. Go to http://localhost:3000/admin/faq
2. **Categories Tab**:
   - Create new categories
   - Edit category names
   - Reorder categories
   - Delete categories (if no articles)
3. **Articles Tab**:
   - Create new FAQ articles
   - Edit existing articles
   - Set article category
   - Toggle visibility
   - Delete articles

### Creating FAQ Articles

1. In Admin FAQ, click "Add Article"
2. Enter:
   - Title (question)
   - Category selection
   - Content (answer with rich text)
   - Order (display position)
3. Save article

---

## Promotions Management

### Promotional Banners (Public)

Banners appear on the homepage to promote products/campaigns.

### Discount Codes (Public)

Buyers can apply codes at checkout:

1. At checkout, enter code in "Discount Code" field
2. Click "Apply"
3. Discount shows in order summary
4. Code validates:
   - Expiry date
   - Usage limit
   - Minimum order amount
   - Applicable categories

### Admin Promotions Management

1. Go to http://localhost:3000/admin/promotions

#### Banners Section
- View active banners
- Create new banner:
  - Title and subtitle
  - Image URL
  - Link URL and text
  - Position (Home, Category, Product)
  - Start/End dates
  - Active toggle
- Edit/Delete banners

#### Discount Codes Section
- View all codes
- Create code:
  - Unique code (e.g., SAVE10)
  - Type: Percentage or Fixed
  - Value (e.g., 10% or ₦5000)
  - Min order amount
  - Usage limit (total uses)
  - Start/End dates
  - Active toggle
- Edit/Delete codes

#### Featured Products Section
- Create featured slots (Daily, Weekly, Monthly)
- View purchased slots
- Feature products for selected period

#### Category Promotions
- Set time-based discounts on entire categories
- Automatically applies to all products in category

---

## Maintenance Features

### Equipment Manuals

Sellers can upload manuals for their equipment:

1. Go to product management
2. Add manual (PDF/document)
3. Buyers can download from product page

### Maintenance Schedules

Track maintenance schedules for purchased equipment:

1. Create schedule for equipment
2. Set recurring tasks (oil change, filter replacement, etc.)
3. Get reminders

### Warranty Claims

1. Go to http://localhost:3000/maintenance/warranty
2. Submit claim:
   - Product purchased
   - Issue description
   - Purchase date
   - Upload proof
3. Track claim status

### Admin Warranty Management

1. View all warranty claims
2. Update claim status
3. Resolve claims

---

## Financing System

### Applying for Financing

1. Browse financing providers at http://localhost:3000/financing
2. Use calculator to estimate monthly payments
3. Submit request:
   - Select provider
   - Enter amount needed
   - Select tenure
   - Select purpose
   - Link to product
4. Wait for approval
5. If approved, amount disbursed to seller

### Admin Financing Management

1. View all financing requests
2. Approve/Reject requests
3. View provider performance

---

## Freight and Logistics

### Freight Calculation

1. At product page, select delivery state
2. System calculates freight based on:
   - Origin state (seller location)
   - Destination state (buyer location)
   - Product weight/dimensions
3. Freight added to order total

### Requesting Freight Quotes

1. For large orders, request custom quote
2. Provide:
   - Product details
   - Quantity
   - Pickup address
   - Delivery address
3. Get quotes from logistics providers

### Admin Freight Management

1. Configure Nigerian states and zones
2. Set freight rates
3. View freight quotes
4. Manage logistics providers

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

## Testing the Application

### Testing the API

```bash
# Test if the API is running
curl http://localhost:4000

# Test authentication
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agromarket.com","password":"Admin@123"}'
```

### Testing the Frontend

1. Open http://localhost:3000 in your browser
2. You should see the marketplace homepage

### Testing Admin Panel

1. Navigate to http://localhost:3000/admin
2. Login with admin credentials
3. You should see the admin dashboard

---

## Docker Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

**Error:** `Port already in use` or `bind: Only one usage of each socket address`

**Solution:**
```bash
# Find what's using the port
netstat -ano | findstr :4000

# Kill the process
taskkill /PID <PID> /F

# Or restart Docker Desktop
```

#### 2. Prisma Generate Fails

**Error:** `Prisma failed to detect the libssl/openssl version`

**Solution:**
- Ensure the binaryTargets in schema.prisma include multiple platforms:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x", "debian-openssl-1.1.x", "debian-openssl-3.0.x"]
}
```

#### 3. Docker Build Fails - Module Not Found

**Error:** `Cannot find module '@nestjs/core'`

**Solution:**
- Ensure Dockerfile uses `npm install --include=dev` not `npm ci --only=production`

#### 4. Docker Build Fails - Dist Folder Missing

**Error:** `Cannot find module '/app/dist/main.js'`

**Solution:**
- Ensure .dockerignore does NOT exclude the `dist` folder:
```
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
# NOT: dist
```

#### 5. Container Won't Start - Database Connection

**Error:** `Can't reach database server at localhost:5432`

**Solution:**
- Ensure PostgreSQL container is running: `docker ps`
- Check DATABASE_URL in container environment
- Wait for database health check to pass
- Restart backend: `docker-compose restart backend`

#### 6. Frontend Can't Reach Backend

**Error:** `Network error` or `Failed to fetch`

**Solution:**
- Check NEXT_PUBLIC_API_URL in frontend
- Ensure backend is running and accessible
- Check Docker network configuration

#### 7. Redis Connection Error

**Error:** `ECONNREFUSED` to Redis

**Solution:**
- Ensure Redis container is running
- Check REDIS_URL environment variable

#### 8. Build is Very Slow

**Solution:**
- Increase Docker Desktop resources (CPU, Memory)
- Use build cache: `docker-compose build` (without --no-cache)
- Exclude unnecessary files in .dockerignore

#### 9. Cleaning Up Docker

```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Full system cleanup
docker system prune -a

# Remove volumes (will lose data)
docker volume prune
```

---

## Next Steps

After setting up, you can:

1. Explore the admin panel at `/admin`
2. Add payment gateway credentials (Paystack/Flutterwave)
3. Configure platform settings
4. Add FAQ articles for help
5. Set up promotions and discounts
6. Invite sellers and buyers to the platform
7. Set up CI/CD for production deployment

---

## Getting Help

- Check the main README.md for architecture details
- Review API.md for complete endpoint documentation
- Check the main plan.md for feature roadmap