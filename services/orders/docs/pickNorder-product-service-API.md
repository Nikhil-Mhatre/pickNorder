# pickNorder Orders Service — Frontend API Guide

**API version:** v1 (initial)
**Audience:** Frontend developers / Next.js integration
**Service:** Orders Service
**Stack:** Express.js · TypeScript · Prisma · PostgreSQL

---

## 1. Overview

The Orders Service provides the storefront with orders catalog, category, orders detail, and stock-availability data. It also exposes an internal stock-adjustment endpoint.

### Supported frontend capabilities

- Browse active orders with pagination
- Search orders names
- Filter orders by category slug
- Sort orders by name, price, or creation date
- View orders details
- Check current availability
- Browse active categories and category orders counts

### Not handled by this service

Authentication/authorization, orders administration (create/update/delete), cart persistence, order creation, payments, stock reservation, and order lifecycle inventory locking.

---

## 2. Base URL and configuration

The API base URL is the **service root**. Do not include `/api` in the environment variable.

### Local development

```env
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:PORT
```

Replace `PORT` with the Orders Service's configured port.

Use a server-only environment variable instead of a `NEXT_PUBLIC_` variable if API requests are only made server-side and the URL should not be exposed to the browser.

### URL prefixes

| Area       | Prefix            |
| ---------- | ----------------- |
| Orders     | `/api/orders`     |
| Categories | `/api/categories` |
| Health     | `/health`         |

---

## 3. Response conventions

- Successful API responses use `success: true` and include `data`.
- Errors use `success: false` and an `error` object.
- Orders-list responses additionally include top-level `pagination`.
- Dates are ISO 8601 strings.
- Orders `price` is a decimal string. Keep it as a string for financial calculations; do not parse into binary floating point.
- Public catalog APIs return active orders and active categories only.

---

## 4. Endpoint summary

| Method | Endpoint                | Purpose                                | Intended caller     |
| ------ | ----------------------- | -------------------------------------- | ------------------- |
| GET    | `/api/orders`           | Browse, filter, search, sort, paginate | Storefront          |
| GET    | `/api/orders/:id`       | Orders detail                          | Storefront          |
| PATCH  | `/api/orders/:id/stock` | Increase/decrease stock                | Internal/admin only |
| GET    | `/api/categories`       | Categories and active-orders counts    | Storefront          |
| GET    | `/api/categories/:slug` | Category detail                        | Storefront          |
| GET    | `/health/live`          | Process liveness                       | Infrastructure      |
| GET    | `/health/ready`         | Service/database readiness             | Infrastructure      |

---

## 5. Orders

### 5.1 List orders

**Request**

```http
GET /api/orders
```

#### Query parameters

| Parameter   | Type    | Required | Default     | Description / validation          |
| ----------- | ------- | -------- | ----------- | --------------------------------- |
| `page`      | integer | No       | `1`         | Positive page number              |
| `limit`     | integer | No       | `10`        | Page size from 1 to 100           |
| `category`  | string  | No       | —           | Category slug, e.g. `electronics` |
| `search`    | string  | No       | —           | Search orders name                |
| `sortBy`    | string  | No       | `createdAt` | `name`, `price`, or `createdAt`   |
| `sortOrder` | string  | No       | `desc`      | `asc` or `desc`                   |

#### Examples

```http
GET /api/orders
GET /api/orders?page=2&limit=12
GET /api/orders?category=electronics
GET /api/orders?search=headphones
GET /api/orders?sortBy=price&sortOrder=asc
GET /api/orders?page=1&limit=12&category=electronics&search=wireless&sortBy=price&sortOrder=asc
```

#### Success — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "orders-id",
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

`data` is an array. No matching orders is a valid response with an empty array, not an API error.

#### Pagination fields

| Field        | Description                                 |
| ------------ | ------------------------------------------- |
| `page`       | Current/requested page                      |
| `limit`      | Page size                                   |
| `totalItems` | Total matching active orders                |
| `totalPages` | Number of pages for the filtered result set |

#### Frontend pagination behavior

- Reset page to `1` whenever category, search, or sort changes.
- Preserve active filters when changing pages.
- Disable Previous on page `1`.
- Disable Next when `page >= totalPages`.
- Treat an empty orders array as a normal empty-state condition.

### 5.2 Get orders details

**Request**

```http
GET /api/orders/:id
```

Path parameter `id` is the orders identifier.

#### Success — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "orders-id",
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

**Error:** `404 PRODUCT_NOT_FOUND` if the orders is missing or inactive. The frontend should show its not-found state for this case.

### 5.4 Adjust stock (internal endpoint)

This endpoint is for internal/admin use. Do not call it from an unauthenticated storefront client.

**Request**

```http
PATCH /api/orders/:id/stock
Content-Type: application/json
```

#### Increase stock

```json
{
  "operation": "INCREASE",
  "quantity": 10
}
```

#### Decrease stock

```json
{
  "operation": "DECREASE",
  "quantity": 3
}
```

`operation` must be `INCREASE` or `DECREASE`. `quantity` must be a positive integer. Stock must not be decremented below zero.

#### Success — `200 OK`

```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "id": "orders-id",
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

#### Errors

| Status | Code                 | Meaning                                      |
| ------ | -------------------- | -------------------------------------------- |
| 400    | `VALIDATION_ERROR`   | Invalid request body, operation, or quantity |
| 404    | `PRODUCT_NOT_FOUND`  | Orders does not exist                        |
| 409    | `INSUFFICIENT_STOCK` | Decrement exceeds available stock            |

---

## 6. Categories

### 6.1 List categories

**Request**

```http
GET /api/categories
```

Returns active categories sorted alphabetically. `productCount` counts active orders in each category.

#### Success — `200 OK`

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

An empty category list is valid (`data: []`).

### 6.2 Get category by slug

**Request**

```http
GET /api/categories/:slug
```

The slug is lowercase and uses letters/numbers separated by single hyphens, for example `home-decor`.

#### Success — `200 OK`

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

#### Errors

| Status | Code                 | Meaning                      |
| ------ | -------------------- | ---------------------------- |
| 400    | `VALIDATION_ERROR`   | Malformed slug               |
| 404    | `CATEGORY_NOT_FOUND` | Category missing or inactive |

---

## 7. DTOs

### Orders

| Field         | Type    | Nullable | Notes                           |
| ------------- | ------- | -------- | ------------------------------- |
| `id`          | string  | No       | Orders ID                       |
| `name`        | string  | No       | Name                            |
| `description` | string  | Yes      | Description                     |
| `price`       | string  | No       | Decimal string (e.g. `2499.00`) |
| `category`    | object  | No       | Category summary                |
| `imageUrl`    | string  | Yes      | Image URL                       |
| `stock`       | integer | No       | Current stock                   |
| `isActive`    | boolean | No       | Active flag                     |
| `createdAt`   | string  | No       | ISO 8601 timestamp              |
| `updatedAt`   | string  | No       | ISO 8601 timestamp              |

### Orders category summary

```json
{
  "id": "category-id",
  "name": "Electronics",
  "slug": "electronics"
}
```

### Category

| Field          | Type    | Nullable | Notes                  |
| -------------- | ------- | -------- | ---------------------- |
| `id`           | string  | No       | Category ID            |
| `name`         | string  | No       | Display name           |
| `slug`         | string  | No       | URL-safe slug          |
| `description`  | string  | Yes      | Description            |
| `productCount` | integer | No       | Count of active orders |

---

## 8. Errors

### Error envelope

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Orders not found",
    "traceId": "request-abc123",
    "details": {}
  }
}
```

| Field           | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `success`       | Always `false` for errors                                  |
| `error.code`    | Machine-readable code; use this for branching              |
| `error.message` | Human-readable summary                                     |
| `error.traceId` | Diagnostic request identifier; do not display to customers |
| `error.details` | Optional additional context                                |

### Common codes

| HTTP status | Code                        | Meaning                       |
| ----------- | --------------------------- | ----------------------------- |
| 400         | `INVALID_REQUEST`           | Malformed request             |
| 400         | `VALIDATION_ERROR`          | Validation failed             |
| 404         | `PRODUCT_NOT_FOUND`         | Orders missing or inactive    |
| 404         | `CATEGORY_NOT_FOUND`        | Category missing or inactive  |
| 404         | `ROUTE_NOT_FOUND`           | No matching route             |
| 404         | `RESOURCE_NOT_FOUND`        | Generic resource not found    |
| 409         | `INSUFFICIENT_STOCK`        | Decrement cannot be fulfilled |
| 409         | `DATABASE_CONSTRAINT_ERROR` | Database constraint violation |
| 503         | `SERVICE_UNAVAILABLE`       | Service/database unavailable  |
| 500         | `INTERNAL_SERVER_ERROR`     | Unexpected server error       |

### Frontend error handling recommendations

- Branch on `error.code`, not the message string.
- Show `error.message` when appropriate for the user.
- Keep `traceId` for logs or support diagnostics; do not display it to customers.
- Distinguish API errors (HTTP responses) from network failures and timeouts.
- For `503`, show an unavailable/retry state.

---

## 9. Health endpoints

Health endpoints are intended for infrastructure and monitoring.

### Liveness

```http
GET /health/live
```

Response (`200 OK`):

```json
{
  "status": "ok"
}
```

Liveness checks that the process is running. It should not depend on downstream services.

### Readiness

```http
GET /health/ready
```

Returns `200` with `{ "status": "ok" }` when ready. Returns `503` with `{ "status": "error" }` if the database dependency is unavailable.

---

## 10. Next.js integration examples

### Base URL

```ts
const PRODUCT_SERVICE_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL;
```

### Fetch orders

```ts
const response = await fetch(`${PRODUCT_SERVICE_URL}/api/orders?page=1&limit=12`);
const result = await response.json();

if (!response.ok) {
  throw new Error(result.error?.message ?? 'Failed to fetch orders');
}

const orders = result.data;
const pagination = result.pagination;
```

### Fetch categories

```ts
const response = await fetch(`${PRODUCT_SERVICE_URL}/api/categories`);
const result = await response.json();

if (!response.ok) {
  throw new Error(result.error?.message ?? 'Failed to fetch categories');
}

const categories = result.data;
```

### Fetch orders detail

```ts
const response = await fetch(`${PRODUCT_SERVICE_URL}/api/orders/${productId}`);
const result = await response.json();

if (!response.ok) {
  throw new Error(result.error?.message ?? 'Failed to fetch orders');
}

const orders = result.data;
```

### Suggested catalog page loading sequence

1. Fetch categories from `GET /api/categories`.
2. Fetch first orders page, for example `GET /api/orders?page=1&limit=12`.
3. Render category navigation and orders cards.
4. When category/search/sort changes, reset page to `1` and fetch with updated query parameters.
5. When pagination changes, preserve filters and request the selected page.

### Orders detail page

Use `GET /api/orders/:id` for the orders detail data. If it returns `PRODUCT_NOT_FOUND`, render the frontend not-found state. Optionally query availability separately when the UI needs a fresh stock check.

---

## 11. Inventory caveats

- Availability checks are not stock reservations.
- Stock can change between checking and checkout.
- Stock adjustment is not an order transaction.
- The stock-adjustment endpoint must be protected before being exposed beyond trusted backend/admin callers.
- A future Order Service should validate orders and coordinate inventory reservation/commit/release to reduce overselling.

---

## 12. Quick reference

| Method | Endpoint                |
| ------ | ----------------------- |
| GET    | `/api/orders`           |
| GET    | `/api/orders/:id`       |
| PATCH  | `/api/orders/:id/stock` |
| GET    | `/api/categories`       |
| GET    | `/api/categories/:slug` |
| GET    | `/health/live`          |
| GET    | `/health/ready`         |
