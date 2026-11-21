# pickNorder — Product Service API Documentation

**Service:** Product Service  
**Purpose:** Product catalog, product details, product availability, and inventory management  
**Technology:** Express.js · TypeScript · Prisma · PostgreSQL  
**API Version:** v1 (initial)

---

## 1. Overview

The Product Service is responsible for managing the product catalog and providing product-related information to the pickNorder frontend and other backend services.

It supports:

- Listing products
- Pagination
- Category filtering
- Searching products by name
- Sorting products
- Retrieving product details
- Checking product stock availability
- Increasing or decreasing product inventory

### Base URL

Local development:

```text
http://localhost:PORT/api/products
```

Replace `PORT` with the port configured for the Product Service.

For frontend integration, configure the base URL using an environment variable rather than hardcoding it.

Example Next.js environment variable:

```env
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:PORT/api/products
```

---

## 2. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Retrieve product catalog |
| GET | `/api/products/:id` | Retrieve a product by ID |
| GET | `/api/products/:id/availability` | Check product stock availability |
| PATCH | `/api/products/:id/stock` | Adjust product stock |

---

# 3. List Products

Retrieve products from the catalog with optional pagination, filtering, searching, and sorting.

### Endpoint

```http
GET /api/products
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | number | No | `1` | Page number (must be positive) |
| `limit` | number | No | `10` | Products per page (1–100) |
| `category` | string | No | — | Filter by category |
| `search` | string | No | — | Search product name |
| `sortBy` | string | No | `createdAt` | Field to sort by |
| `sortOrder` | string | No | `desc` | Sort direction |

### Supported Sorting Fields

| Field | Description |
|---|---|
| `name` | Product name |
| `price` | Product price |
| `createdAt` | Product creation date |

### Supported Sort Orders

- `asc` — Ascending
- `desc` — Descending

### Example Requests

Retrieve the first page:

```http
GET /api/products
```

Retrieve the second page with 12 products:

```http
GET /api/products?page=2&limit=12
```

Filter by category:

```http
GET /api/products?category=electronics
```

Search products by name:

```http
GET /api/products?search=headphones
```

Sort by price from low to high:

```http
GET /api/products?sortBy=price&sortOrder=asc
```

Combine filters:

```http
GET /api/products?page=1&limit=12&category=electronics&search=wireless&sortBy=price&sortOrder=asc
```

### Successful Response

**Status:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "prod-123",
      "name": "Wireless Headphones",
      "description": "Bluetooth headphones",
      "price": "99.99",
      "category": "electronics",
      "imageUrl": "https://example.com/headphones.jpg",
      "stock": 15,
      "isActive": true,
      "createdAt": "2026-11-20T10:30:00.000Z",
      "updatedAt": "2026-11-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5
  }
}
```

### Pagination Object

| Field | Type | Description |
|---|---|---|
| `page` | number | Current page |
| `limit` | number | Number of items per page |
| `totalItems` | number | Total matching products |
| `totalPages` | number | Total pages available |

### Frontend Usage

The frontend should use the `pagination` object to render pagination controls.

- Disable Previous on page 1.
- Disable Next when the current page reaches `totalPages`.
- Reset the page to 1 when the search term or category changes.
- Preserve selected filters when changing pages.

---

# 4. Get Product Details

Retrieve detailed information about a specific product.

### Endpoint

```http
GET /api/products/:id
```

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique product identifier |

### Example Request

```http
GET /api/products/prod-123
```

### Successful Response

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "prod-123",
    "name": "Wireless Headphones",
    "description": "Bluetooth headphones",
    "price": "99.99",
    "category": "electronics",
    "imageUrl": "https://example.com/headphones.jpg",
    "stock": 15,
    "isActive": true,
    "createdAt": "2026-11-20T10:30:00.000Z",
    "updatedAt": "2026-11-20T10:30:00.000Z"
  }
}
```

### Possible Errors

| Status | Error Code | Description |
|---|---|---|
| `404` | `PRODUCT_NOT_FOUND` | Product doesn't exist or is inactive |

### Frontend Usage

This endpoint can be used for a product detail page.

Example route in Next.js:

```text
/products/[id]
```

The frontend should handle the product-not-found response by displaying an appropriate not-found state.

---

# 5. Check Product Availability

Check whether a product currently has stock available.

### Endpoint

```http
GET /api/products/:id/availability
```

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique product identifier |

### Example Request

```http
GET /api/products/prod-123/availability
```

### Successful Response

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "productId": "prod-123",
    "available": true,
    "stock": 15
  }
}
```

### Response Fields

| Field | Type | Description |
|---|---|---|
| `productId` | string | Product identifier |
| `available` | boolean | Whether stock is greater than zero |
| `stock` | number | Current stock quantity |

### Example — Out of Stock

```json
{
  "success": true,
  "data": {
    "productId": "prod-123",
    "available": false,
    "stock": 0
  }
}
```

### Possible Errors

| Status | Error Code | Description |
|---|---|---|
| `404` | `PRODUCT_NOT_FOUND` | Product doesn't exist or is inactive |

### Frontend Usage

- Display an **In Stock** state when `available` is `true`.
- Display an **Out of Stock** state when `available` is `false`.
- Disable the Add to Cart button if stock is zero.
- Do not treat this check as a stock reservation. Inventory can change after this API call.

---

# 6. Adjust Product Stock

Increase or decrease inventory for a product.

> **Internal API:** This endpoint is intended for backend/internal operations. It should not be called directly from the public frontend until authentication and authorization are implemented.

### Endpoint

```http
PATCH /api/products/:id/stock
```

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique product identifier |

### Request Body

Stock increase:

```json
{
  "operation": "INCREASE",
  "quantity": 10
}
```

Stock decrease:

```json
{
  "operation": "DECREASE",
  "quantity": 3
}
```

### Request Fields

| Field | Type | Required | Validation |
|---|---|---|---|
| `operation` | string | Yes | `INCREASE` or `DECREASE` |
| `quantity` | number | Yes | Positive integer |

### Successful Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "id": "prod-123",
    "name": "Wireless Headphones",
    "description": "Bluetooth headphones",
    "price": "99.99",
    "category": "electronics",
    "imageUrl": null,
    "stock": 25,
    "isActive": true,
    "createdAt": "2026-11-20T10:30:00.000Z",
    "updatedAt": "2026-11-21T10:30:00.000Z"
  }
}
```

### Possible Errors

| Status | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Invalid request body |
| `404` | `PRODUCT_NOT_FOUND` | Product doesn't exist or is inactive |
| `409` | `INSUFFICIENT_STOCK` | Cannot decrease stock below available quantity |

### Validation Rules

- Quantity must be a positive integer.
- Operation must be either `INCREASE` or `DECREASE`.
- Stock cannot become negative.

---

# 7. Product Data Model

The Product object returned by the APIs.

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | string | No | Unique product ID |
| `name` | string | No | Product name |
| `description` | string | Yes | Product description |
| `price` | string | No | Product price (decimal serialized as string) |
| `category` | string | No | Product category |
| `imageUrl` | string | Yes | Product image URL |
| `stock` | number | No | Available inventory quantity |
| `isActive` | boolean | No | Whether product is active |
| `createdAt` | string | No | ISO 8601 timestamp |
| `updatedAt` | string | No | ISO 8601 timestamp |

### Important: Price Handling

The `price` field is returned as a string because Prisma Decimal values are serialized this way.

Frontend applications should not assume that `price` is an integer.

Example:

```json
{
  "price": "1299.50"
}
```

When displaying prices, format them using the appropriate currency formatter. Avoid using floating-point arithmetic for financial calculations.

---

# 8. Standard Error Response

All API errors follow the centralized error response format.

### Structure

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "traceId": "request-abc123",
    "details": {}
  }
}
```

### Error Fields

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Always `false` for an error |
| `error.code` | string | Machine-readable error code |
| `error.message` | string | Human-readable error message |
| `error.traceId` | string | Request trace ID for debugging |
| `error.details` | object | Additional error information, when available |

### Common Error Codes

| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `INVALID_REQUEST` | Invalid request syntax or payload |
| `400` | `VALIDATION_ERROR` | Request validation failed |
| `404` | `PRODUCT_NOT_FOUND` | Product not found |
| `404` | `ROUTE_NOT_FOUND` | Endpoint doesn't exist |
| `409` | `INSUFFICIENT_STOCK` | Insufficient inventory |
| `409` | `DATABASE_CONSTRAINT_ERROR` | Database constraint violation |
| `404` | `RESOURCE_NOT_FOUND` | Requested database resource not found |
| `503` | `SERVICE_UNAVAILABLE` | Dependency/database unavailable |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error |

### Frontend Error Handling Recommendations

The frontend should:

- Use `error.code` for programmatic handling.
- Use `error.message` for user-facing messages where appropriate.
- Avoid displaying `traceId` to the user, but retain it for support/debugging.
- Handle `503` with a service-unavailable state.
- Handle network failures separately from API errors.

---

# 9. Health Endpoints

These endpoints are primarily intended for infrastructure monitoring and container orchestration.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health/live` | Liveness check |
| GET | `/health/ready` | Readiness check |

### Liveness

```http
GET /health/live
```

Example response:

```json
{
  "status": "ok"
}
```

### Readiness

```http
GET /health/ready
```

Returns a successful response when the service is ready to accept traffic and its database dependency is available.

When the database is unavailable, readiness returns `503 Service Unavailable`.

---

# 10. Frontend Integration Flow

Recommended catalog flow for the Next.js frontend.

### Product Listing Page

```text
Frontend
   |
   | GET /api/products?page=1&limit=12
   v
Product Service
   |
   | Products + Pagination
   v
Frontend renders product cards
```

### Product Detail Page

```text
Frontend
   |
   | GET /api/products/:id
   v
Product Service
   |
   | Product details
   v
Frontend renders detail page
```

### Add to Cart

The frontend can use product details and availability to manage the cart UI.

However, **checking availability does not reserve stock**. The future Order Service must validate and reserve inventory when an order is initiated.

---

# 11. Example Frontend API Calls

Using `fetch` from Next.js/TypeScript:

### Fetch products

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}?page=1&limit=12`,
);

const result = await response.json();

if (!response.ok) {
  throw new Error(result.error?.message ?? 'Failed to fetch products');
}

const products = result.data;
const pagination = result.pagination;
```

### Fetch a single product

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/${productId}`,
);

const result = await response.json();

if (!response.ok) {
  throw new Error(result.error?.message ?? 'Failed to fetch product');
}

const product = result.data;
```

### Check availability

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/${productId}/availability`,
);

const result = await response.json();

if (!response.ok) {
  throw new Error(result.error?.message ?? 'Failed to check availability');
}

const { available, stock } = result.data;
```

---

# 12. Current Scope and Limitations

The Product Service currently provides catalog and inventory functionality.

It does not handle:

- User authentication or authorization
- Product creation or deletion APIs
- Product administration
- Cart persistence
- Order creation
- Payment processing
- Stock reservation
- Inventory locking across an order lifecycle

Stock adjustment is not an order workflow. The future Order Service should not rely on a simple stock decrease to implement order placement. A proper inventory reservation/commit/release mechanism will be required to prevent overselling.

---

## 13. Endpoint Summary

| Endpoint | Method | Purpose | Frontend Usage |
|---|---|---|---|
| `/api/products` | GET | Browse catalog | Yes |
| `/api/products/:id` | GET | Product details | Yes |
| `/api/products/:id/availability` | GET | Check stock | Yes |
| `/api/products/:id/stock` | PATCH | Adjust stock | Internal only |
| `/health/live` | GET | Liveness | No |
| `/health/ready` | GET | Readiness | No |

---

**Document Status:** Initial API Contract  
**Service:** pickNorder Product Service  
**Audience:** Frontend developers and backend service consumers