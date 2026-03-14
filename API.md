# API Documentation - Agro Machinery B2B Marketplace

This document provides comprehensive API endpoint documentation for all modules.

## Base URL
```
Development: http://localhost:4000
Production: https://api.agromarket.com
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login user |
| POST | /auth/refresh | Refresh JWT token |
| POST | /auth/logout | Logout user |

### Request/Response Examples

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "BUYER", // or "SELLER"
  "phone": "+2348012345678"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "BUYER"
  }
}
```

---

## Users

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /users/me | Get current user profile | Yes |
| PATCH | /users/me | Update current user | Yes |
| PATCH | /users/me/password | Change password | Yes |

### Response Types
- User profile returns: id, email, firstName, lastName, role, phone, companyId, avatar, verified, createdAt

---

## Companies

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /companies | Create company profile | Yes (Seller) |
| GET | /companies/me | Get my company | Yes |
| PATCH | /companies/me | Update company | Yes |
| GET | /companies | List all companies | No |
| GET | /companies/:id | Get company details | No |
| PATCH | /companies/:id/verify | Verify company | Yes (Admin) |

### Company Fields
- name, description, address, city, state, phone, email, website, logo, verified, verificationStatus

---

## Products

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /products | List products (with filters) | No |
| GET | /products/my-products | Seller's products | Yes (Seller) |
| GET | /products/:id | Get product details | No |
| GET | /products/slug/:slug | Get by slug | No |
| POST | /products | Create product | Yes (Seller) |
| PATCH | /products/:id | Update product | Yes (Seller) |
| DELETE | /products/:id | Delete product | Yes (Seller) |

### Query Parameters
- `category`: Filter by category
- `condition`: NEW, USED, REFURBISHED
- `minPrice`, `maxPrice`: Price range
- `sellerId`: Filter by seller
- `search`: Search in name/description
- `status`: PENDING, APPROVED, REJECTED, FLAGGED (admin)
- `page`, `limit`: Pagination

---

## Categories

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /categories | List all categories | No |
| GET | /categories/flat | Flat category list | No |
| GET | /categories/:id | Get category | No |
| GET | /categories/slug/:slug | Get by slug | No |
| POST | /categories | Create category | Yes (Admin) |
| PATCH | /categories/:id | Update category | Yes (Admin) |
| DELETE | /categories/:id | Delete category | Yes (Admin) |

---

## Orders

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /orders | List all orders | Yes |
| GET | /orders/my-orders | Buyer's orders | Yes (Buyer) |
| GET | /orders/seller-orders | Seller's orders | Yes (Seller) |
| GET | /orders/:id | Get order details | Yes |
| POST | /orders | Create order | Yes (Buyer) |
| PATCH | /orders/:id/status | Update status | Yes |
| PATCH | /orders/:id/freight | Update freight | Yes |

### Order Status Flow
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
or: PENDING → CANCELLED

---

## RFQ (Request for Quote)

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /rfqs | List all RFQs | No |
| GET | /rfqs/open | Open RFQs for sellers | No |
| GET | /rfqs/my-rfqs | My RFQs | Yes |
| GET | /rfqs/:id | Get RFQ details | No |
| POST | /rfqs | Create RFQ | Yes (Buyer) |
| PATCH | /rfqs/:id | Update RFQ | Yes |
| DELETE | /rfqs/:id | Delete RFQ | Yes |
| POST | /rfqs/quotes | Submit quote | Yes (Seller) |
| POST | /rfqs/quotes/:quoteId/accept | Accept quote | Yes (Buyer) |

---

## Payments

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /payments/initialize | Initialize payment | Yes |
| POST | /payments/verify | Verify payment | Yes |
| POST | /payments/webhook/paystack | Paystack webhook | No |
| POST | /payments/webhook/flutterwave | Flutterwave webhook | No |
| GET | /payments/order/:orderId | Order payments | Yes |
| GET | /payments/escrow/:orderId | Escrow status | Yes |
| POST | /payments/escrow/:id/release | Release escrow | Yes (Admin) |

---

## Messaging

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /conversations | List conversations | Yes |
| POST | /conversations | Start conversation | Yes |
| GET | /conversations/:id | Get conversation | Yes |
| GET | /conversations/:id/messages | Get messages | Yes |
| POST | /conversations/:id/messages | Send message | Yes |

---

## Financing

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /financing/request | Submit financing request | Yes |
| POST | /financing/calculate | Calculate loan | No |
| GET | /financing/providers | List financing providers | No |
| GET | /financing | List all requests | Yes (Admin) |
| GET | /financing/my-requests | My requests | Yes |
| GET | /financing/:id | Get request details | Yes |
| PATCH | /financing/:id/status | Update status | Yes (Admin) |

### Financing Fields
- amount, tenure, purpose, providerId, productId, status (PENDING, APPROVED, REJECTED, DISBURSED)

---

## Freight

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /freight/states | List Nigerian states | No |
| POST | /freight/calculate | Calculate freight | No |
| POST | /freight/quotes | Request freight quote | Yes |
| GET | /freight/quotes/order/:orderId | Order quotes | Yes |
| PATCH | /freight/quotes/:id/status | Update quote status | Yes |

---

## Maintenance

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /maintenance/manuals | Upload manual | Yes (Seller) |
| GET | /maintenance/manuals/:productId | Get product manuals | No |
| DELETE | /maintenance/manuals/:id | Delete manual | Yes (Seller) |
| POST | /maintenance/schedules | Create schedule | Yes |
| GET | /maintenance/schedules/:productId | Get schedules | Yes |
| DELETE | /maintenance/schedules/:id | Delete schedule | Yes |
| POST | /maintenance/records | Record maintenance | Yes |
| GET | /maintenance/records/:productId | Get records | Yes |
| POST | /maintenance/warranty | Submit warranty claim | Yes |
| GET | /maintenance/warranty/my-claims | My warranty claims | Yes |
| GET | /maintenance/warranty/all | All claims | Yes (Admin) |
| PATCH | /maintenance/warranty/:id | Update claim | Yes (Admin) |
| GET | /maintenance/warranty/status/:productId | Check warranty status | No |

---

## Promotions

### Public Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /promotions/banners | Active banners | No |
| GET | /promotions/featured | Featured products | No |
| GET | /promotions/featured-slots | Available slots | No |
| GET | /promotions/validate-code | Validate discount code | No |
| GET | /promotions/category-promotions | Active category promos | No |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /promotions/admin/discount-codes | List discount codes | Yes (Admin) |
| POST | /promotions/admin/discount-codes | Create discount code | Yes (Admin) |
| PATCH | /promotions/admin/discount-codes/:id | Update code | Yes (Admin) |
| DELETE | /promotions/admin/discount-codes/:id | Delete code | Yes (Admin) |
| GET | /promotions/admin/featured-slots | List slots | Yes (Admin) |
| POST | /promotions/admin/featured-slots | Create slot | Yes (Admin) |
| PATCH | /promotions/admin/featured-slots/:id | Update slot | Yes (Admin) |
| DELETE | /promotions/admin/featured-slots/:id | Delete slot | Yes (Admin) |
| POST | /promotions/admin/featured | Feature a product | Yes (Admin) |
| GET | /promotions/admin/banners | List banners | Yes (Admin) |
| POST | /promotions/admin/banners | Create banner | Yes (Admin) |
| PATCH | /promotions/admin/banners/:id | Update banner | Yes (Admin) |
| DELETE | /promotions/admin/banners/:id | Delete banner | Yes (Admin) |
| GET | /promotions/admin/category-promotions | List category promos | Yes (Admin) |
| POST | /promotions/admin/category-promotions | Create category promo | Yes (Admin) |
| PATCH | /promotions/admin/category-promotions/:id | Update | Yes (Admin) |
| DELETE | /promotions/admin/category-promotions/:id | Delete | Yes (Admin) |

---

## FAQ

### Public Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /faq/categories | List categories | No |
| GET | /faq/articles | List articles | No |
| GET | /faq/articles/search | Search articles | No |
| GET | /faq/articles/:id | Get article | No |
| POST | /faq/articles/:id/vote | Vote on article | Yes |
| GET | /faq/articles/:id/vote | Get votes | Yes |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /faq/admin/categories | List categories | Yes (Admin) |
| POST | /faq/admin/categories | Create category | Yes (Admin) |
| PATCH | /faq/admin/categories/:id | Update category | Yes (Admin) |
| DELETE | /faq/admin/categories/:id | Delete category | Yes (Admin) |
| GET | /faq/admin/articles | List articles | Yes (Admin) |
| POST | /faq/admin/articles | Create article | Yes (Admin) |
| PATCH | /faq/admin/articles/:id | Update article | Yes (Admin) |
| DELETE | /faq/admin/articles/:id | Delete article | Yes (Admin) |

---

## Support

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /support/tickets | Create ticket | Yes |
| GET | /support/tickets | List my tickets | Yes |
| GET | /support/tickets/:id | Get ticket details | Yes |
| POST | /support/tickets/:id/replies | Add reply | Yes |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /support/admin/tickets | List all tickets | Yes (Admin) |
| GET | /support/admin/tickets/:id | Get ticket | Yes (Admin) |
| PATCH | /support/admin/tickets/:id/status | Update status | Yes (Admin) |
| PATCH | /support/admin/tickets/:id/assign | Assign ticket | Yes (Admin) |
| POST | /support/admin/tickets/:id/replies | Admin reply | Yes (Admin) |
| GET | /support/admin/stats | Ticket statistics | Yes (Admin) |

---

## Settings

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /settings | Get platform settings | Yes (Admin) |
| PATCH | /settings | Update settings | Yes (Admin) |

### Settings Fields
- platformName, contactEmail, contactPhone, address, paystackPublicKey, paystackSecretKey, flutterwavePublicKey, flutterwaveSecretKey, defaultCurrency, taxRate, etc.

---

## Admin

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /admin/analytics | Platform analytics | Yes (Admin) |
| GET | /admin/dashboard-stats | Dashboard stats | Yes (Admin) |
| GET | /admin/users | List users | Yes (Admin) |
| POST | /admin/users | Create user | Yes (Admin) |
| GET | /admin/users/:id | Get user | Yes (Admin) |
| PATCH | /admin/users/:id/status | Update status | Yes (Admin) |
| DELETE | /admin/users/:id | Delete user | Yes (Admin) |
| GET | /admin/products | List products | Yes (Admin) |
| POST | /admin/products/:id/approve | Approve product | Yes (Admin) |
| POST | /admin/products/:id/reject | Reject product | Yes (Admin) |
| POST | /admin/products/:id/flag | Flag product | Yes (Admin) |
| GET | /admin/orders | List orders | Yes (Admin) |
| GET | /admin/orders/:id | Get order | Yes (Admin) |
| POST | /admin/orders/:id/resolve-dispute | Resolve dispute | Yes (Admin) |
| GET | /admin/transactions | List transactions | Yes (Admin) |
| GET | /admin/transactions/:id | Get transaction | Yes (Admin) |
| POST | /admin/transactions/:id/refund | Process refund | Yes (Admin) |
| GET | /admin/refunds | List refunds | Yes (Admin) |
| GET | /admin/transactions/export | Export transactions | Yes (Admin) |

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

---

## Rate Limiting

API requests are rate-limited to 100 requests per minute per IP address.

---

## Versioning

The API uses URL versioning: `/api/v1/...`

Current version: v1