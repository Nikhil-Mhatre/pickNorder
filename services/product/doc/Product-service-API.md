# pickNorder — Product Service API

**Service:** Product Service  
**API version:** v1 (initial)  
**Stack:** Express.js · TypeScript · Prisma · PostgreSQL  
**Audience:** Frontend developers and internal backend service consumers

---

## 1. Overview

The Product Service owns the product catalog, category information, product details, and basic inventory operations. It exposes read APIs for the storefront and an inventory adjustment endpoint intended for internal use.

### Responsibilities

- Browse and paginate active products
- Filter products by category
- Search product names
- Sort catalog results
- Fetch product details
- Check current stock availability
- List active categories and retrieve a category by slug
- Adjust inventory through an internal endpoint

### Out of scope

Authentication/authorization, product administration (create/update/delete), cart persistence, order creation, payment processing, inventory reservation, and order lifecycle inventory locking are not currently handled by this service.

---

## 2. Base URL and conventions

Local development base URL (replace `PORT` with the configured service port):

```text
http://localhost:PORT
```

API routes use the `/api` prefix. Health endpoints are outside that prefix.

| Area | Base path |
|---|---|
| Products | `/api/products` |
| Categories | `/api/categories` |
| Health | `/health` |

For Next.js, configure the service base URL in an environment variable. This documentation uses the **service root**, not a URL that already includes `/api/products`, so it can be shared by both product and category requests.

```env
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:PORT
```

> Avoid hardcoding the service URL in frontend source files. For server-side Next.js calls, use a server-only environment variable if the URL should not be exposed to the browser.

### Response conventions

- Successful responses use `success: true`.
- Error responses use `success: false` and an `error` object.
- Dates are serialized as ISO 8601 strings.
- Prisma Decimal prices are serialized as strings to preserve decimal precision.
- Catalog endpoints return active products and active categories only.

---

## 3. Endpoint overview

### Products

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/products` | List, search, filter, paginate, and sort products | Public |
| `GET` | `/api/products/:id` | Fetch a product by ID | Public |
| `GET` | `/api/products/:id/availability` | Read current stock availability | Public |
| `PATCH` | `/api/products/:id/stock` | Increase or decrease stock | Internal; protect before exposing |

### Categories

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/categories` | List active categories with active product counts | Public |
| `GET` | `/api/categories/:slug` | Fetch an active category by slug | Public |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health/live` | Process liveness |
| `GET` | `/health/ready` | Service/database readiness |

---

# 4. Products API

## 4.1 List products

Retrieve active products with optional pagination, category filtering, name search, and sorting.

**Request**

```http
GET /api/products
```

### Query parameters

| Parameter | Type | Required | Default | Rules / description |
|---|---|---|---|---|
| `page` | integer | No | `1` | Page number; must be positive |
| `limit` | integer | No | `10` | Page size; allowed range `1–100` |
| `category` | string | No | — | Category slug (e.g. `electronics`) |
| `search` | string | No | — | Search product name |
| `sortBy` | string | No | `createdAt` | `name`, `price`, or `createdAt` |
| `sortOrder` | string | No | `desc` | `asc` or `desc` |

### Sorting values

| `sortBy` | Sorts by |
|---|---|
| `name` | Product name |
| `price` | Price |
| `createdAt` | Creation timestamp |

| `sortOrder` | Meaning |
|---|---|
| `asc` | Ascending |
| `desc` | Descending |

### Examples

```http
# Default first page
GET /api/products

# Page 2, 12 items per page
GET /api/products?page=2&limit=12

# Products belonging to the electronics category
GET /api/products?category=electronics

# Search by product name
GET /api/products?search=headphones

# Lowest price first
GET /api/products?sortBy=price&sortOrder=asc

# Combine query parameters
GET /api/products?page=1&limit=12&category=electronics&search=wireless&sortBy=price&sortOrder=asc
```

### Success response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "product-id",
      "name": "Wireless Headphones",
      "description": "Bluetooth headphones",
      "price": "2499.00",
      "category": {
        "id": "category-id",
        "name": "Electronics",
        "slug": "electronics"
      },
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

`data` is an array. It may be empty when no products match the filters; an empty result is not an error.

### Pagination metadata

| Field | Type | Description |
|---|---|---|
| `page` | number | Requested/current page |
| `limit` | number | Page size |
| `totalItems` | number | Number of matching active products |
| `totalPages` | number | Total pages for the matching result set |

Frontend behavior:
- Reset `page` to `1` when search, category, or sort filters change.
- Keep the selected filters when the user moves between pages.
- Disable Previous on page `1`.
- Disable Next when `page >= totalPages`.
- Handle an empty `data` array as a normal empty-state result.

---

## 4.2 Get product details

Retrieve one active product by its ID.

**Request**

```http
GET /api/products/:id
```

### Path parameter

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Product identifier |

### Example

```http
GET /api/products/product-id
```

### Success response — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "product-id",
    "name": "Wireless Headphones",
    "description": "Bluetooth headphones",
    "price": "2499.00",
    "category": {
      "id": "category-id",
      "name": "Electronics",
      "slug": "electronics"
    },
    "imageUrl": "https://example.com/headphones.jpg",
    "stock": 15,
    "isActive": true,
    "createdAt": "2026-11-20T10:30:00.000Z",
    "updatedAt": "2026-11-20T10:30:00.000Z"
  }
}
```

### Errors

| Status | Code | Meaning |
|---|---|---|
| `404 Not Found` | `PRODUCT_NOT_FOUND` | Product does not exist or is inactive |

A frontend product detail route can use this endpoint, e.g. `/products/[id]`. If the API returns `PRODUCT_NOT_FOUND`, render the application's not-found state.

---

## 4.3 Check product availability

Read the current inventory quantity for an active product.

**Request**

```http
GET /api/products/:id/availability
```

### Success response — `200 OK` (in stock)

```json
{
  "success": true,
  "data": {
    "productId": "product-id",
    "available": true,
    "stock": 15
  }
}
```

### Success response — `200 OK` (out of stock)

```json
{
  "success": true,
  "data": {
    "productId": "product-id",
    "available": false,
    "stock": 0
  }
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `productId` | string | Product ID |
| `available` | boolean | `true` when stock is greater than zero |
| `stock` | integer | Current stock quantity |

### Errors

| Status | Code | Meaning |
|---|---|---|
| `404 Not Found` | `PRODUCT_NOT_FOUND` | Product does not exist or is inactive |

Availability is only a read/check. It does **not** reserve stock. Stock may change after the response, so the future order workflow must revalidate inventory.

---

## 4.4 Adjust product stock (internal)

Increase or decrease inventory for an existing product. This endpoint is for internal/admin use and must not be exposed directly to an unauthenticated storefront client.

**Request**

```http
PATCH /api/products/:id/stock
Content-Type: application/json
```

### Path parameter

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Product ID |

### Request body

Increase stock:

```json
{
  "operation": "INCREASE",
  "quantity": 10
}
```

Decrease stock:

```json
{
  "operation": "DECREASE",
  "quantity": 3
}
```

### Validation

| Field | Type | Required | Constraints |
|---|---|---|---|
| `operation` | string | Yes | Must be `INCREASE` or `DECREASE` |
| `quantity` | integer | Yes | Must be a positive integer |

Inventory must never be decremented below zero.

### Success response — `200 OK`

```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "id": "product-id",
    "name": "Wireless Headphones",
    "description": "Bluetooth headphones",
    "price": "2499.00",
    "category": {
      "id": "category-id",
      "name": "Electronics",
      "slug": "electronics"
    },
    "imageUrl": null,
    "stock": 25,
    "isActive": true,
    "createdAt": "2026-11-20T10:30:00.000Z",
    "updatedAt": "2026-11-21T10:30:00.000Z"
  }
}
```

### Errors

| Status | Code | Meaning |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Invalid body, operation, or quantity |
| `404 Not Found` | `PRODUCT_NOT_FOUND` | Product does not exist |
| `409 Conflict` | `INSUFFICIENT_STOCK` | Requested decrement exceeds available stock |

---

# 5. Categories API

Categories are used to organize products and power storefront category navigation/filtering. Only active categories are returned by the public endpoints. Product counts include only active products.

## 5.1 List categories

Retrieve all active categories, alphabetically ordered by name.

**Request**

```http
GET /api/categories
```

### Success response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "category-id",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic gadgets and devices",
      "productCount": 8
    },
    {
      "id": "category-id-2",
      "name": "Fashion",
      "slug": "fashion",
      "description": "Clothing and fashion accessories",
      "productCount": 12
    }
  ]
}
```

### Category fields

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | string | No | Category identifier |
| `name` | string | No | Display name |
| `slug` | string | No | URL/filter-safe category identifier |
| `description` | string | Yes | Category description |
| `productCount` | number | No | Count of active products in the category |

An empty category list is valid and returns `data: []`.

---

## 5.2 Get category by slug

Retrieve one active category using its slug.

**Request**

```http
GET /api/categories/:slug
```

### Path parameter

| Parameter | Type | Required | Validation |
|---|---|---|---|
| `slug` | string | Yes | Lowercase letters/numbers separated by single hyphens; e.g. `home-decor` |

### Example

```http
GET /api/categories/electronics
```

### Success response — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "category-id",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic gadgets and devices",
    "productCount": 8
  }
}
```

### Errors

| Status | Code | Meaning |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Slug is malformed or contains unsupported characters |
| `404 Not Found` | `CATEGORY_NOT_FOUND` | Category does not exist or is inactive |

---

# 6. Data models

These are the response DTOs exposed by the documented endpoints. They are API shapes, not direct Prisma model definitions.

## 6.1 Product

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | string | No | Product identifier |
| `name` | string | No | Product name |
| `description` | string | Yes | Product description |
| `price` | string | No | Decimal price serialized as a string |
| `category` | object | No | Category summary (see below) |
| `imageUrl` | string | Yes | Product image URL |
| `stock` | integer | No | Current stock quantity |
| `isActive` | boolean | No | Product active flag |
| `createdAt` | string | No | ISO 8601 timestamp |
| `updatedAt` | string | No | ISO 8601 timestamp |

## 6.2 Product category summary

| Field | Type | Description |
|---|---|---|
| `id` | string | Category ID |
| `name` | string | Category display name |
| `slug` | string | Category slug |

## 6.3 Category

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | string | No | Category identifier |
| `name` | string | No | Category name |
| `slug` | string | No | URL-safe slug |
| `description` | string | Yes | Category description |
| `productCount` | integer | No | Number of active products in category |

### Price handling

Prices are represented as strings (for example, `"2499.00"`) because the database uses a decimal type. Do not convert prices to binary floating-point for financial calculations. For display, format the decimal string with the UI's currency formatter.

---

# 7. Error format

All API errors should follow the shared error envelope.

### Example

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

### Error fields

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Always `false` for errors |
| `error.code` | string | Machine-readable error code |
| `error.message` | string | Human-readable summary |
| `error.traceId` | string | Request trace ID for troubleshooting |
| `error.details` | object | Optional additional information |

### Common error codes

| HTTP status | Code | Meaning |
|---|---|---|
| `400` | `INVALID_REQUEST` | Malformed request |
| `400` | `VALIDATION_ERROR` | Request failed validation |
| `404` | `PRODUCT_NOT_FOUND` | Product missing or inactive |
| `404` | `CATEGORY_NOT_FOUND` | Category missing or inactive |
| `404` | `ROUTE_NOT_FOUND` | No matching API route |
| `404` | `RESOURCE_NOT_FOUND` | Generic resource lookup failure |
| `409` | `INSUFFICIENT_STOCK` | Stock decrement cannot be fulfilled |
| `409` | `DATABASE_CONSTRAINT_ERROR` | Database constraint violation |
| `503` | `SERVICE_UNAVAILABLE` | Service or database dependency unavailable |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error |

Frontend error handling:
- Branch on `error.code`, not message text.
- Use `error.message` for a suitable UI message.
- Do not show `traceId` to customers; retain it for diagnostics/logging.
- Distinguish an API error response from a network/timeout failure.
- Show a service-unavailable state for `503`.

---

# 8. Health checks

Health routes are for container orchestration, monitoring, and operational checks.

## Liveness

```http
GET /health/live
```

Example response:

```json
{
  "status": "ok"
}
```

Liveness indicates the process is running. It should not be used to verify every downstream dependency.

## Readiness

```http
GET /health/ready
```

Readiness indicates that the service can accept requests and its database dependency is available. If the database is unavailable, the endpoint returns `503 Service Unavailable`.

---

# 9. Frontend integration

## 9.1 Catalog page data flow

Suggested initial page load:

1. Fetch categories from `GET /api/categories`.
2. Fetch the first product page from `GET /api/products?page=1&limit=12`.
3. Render categories and product cards.
4. When category/search/sort changes, update the product query and reset page to `1`.
5. When pagination changes, request the corresponding page while preserving the active filters.

## 9.2 Product detail page

Fetch the product using `GET /api/products/:id`. Use the product response for the detail view. If stock status needs a separate refresh, use the availability endpoint; do not treat it as a reservation.

## 9.3 Example fetch helper

This example assumes the environment variable stores the service root URL.

```typescript
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;

// Example: fetch catalog data
const response = await fetch(
  `${PRODUCT_SERVICE_URL}/api/products?page=1&limit=12`,
);

const result = await response.json();

if (!response.ok) {
  throw new Error(result.error?.message ?? "Failed to fetch products");
}

const products = result.data;
const pagination = result.pagination;
```

### Fetch categories

```typescript
const response = await fetch(`${PRODUCT_SERVICE_URL}/api/categories`);
const result = await response.json();

if (!response.ok) {
  throw new Error(result.error?.message ?? "Failed to fetch categories");
}

const categories = result.data;
```

### Fetch a product

```typescript
const response = await fetch(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
const result = await response.json();

if (!response.ok) {
  throw new Error(result.error?.message ?? "Failed to fetch product");
}

const product = result.data;
```

---

# 10. Inventory and order workflow considerations

- The availability endpoint is informational; it does not hold or reserve inventory.
- Stock can change between the availability check and the user's checkout.
- The stock adjustment endpoint is not a substitute for an order/checkout transaction.
- Before this endpoint is exposed outside trusted backend/admin callers, implement authentication, authorization, and auditing.
- The future Order Service should own order validation and coordinate an atomic inventory reservation/commit/release workflow to reduce overselling.

---

# 11. Endpoint reference

| Method | Endpoint | Purpose | Intended caller |
|---|---|---|---|
| `GET` | `/api/products` | Browse/search/filter/sort products | Storefront |
| `GET` | `/api/products/:id` | Product detail | Storefront |
| `GET` | `/api/products/:id/availability` | Current stock check | Storefront/internal |
| `PATCH` | `/api/products/:id/stock` | Inventory adjustment | Internal/admin only |
| `GET` | `/api/categories` | Active categories and product counts | Storefront |
| `GET` | `/api/categories/:slug` | Category detail | Storefront |
| `GET` | `/health/live` | Liveness | Infrastructure |
| `GET` | `/health/ready` | Readiness | Infrastructure |

---

**Document status:** API contract draft for frontend integration  
**Service:** pickNorder Product Service
