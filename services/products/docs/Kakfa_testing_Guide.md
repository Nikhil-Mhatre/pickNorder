# Inventory Stock Kafka Consumer — Manual Testing Guide

This document describes how to manually test the Products service Kafka consumer using the **Aiven Kafka web console**.

## 0.Pre-requisite

- **Topic:**

  ```bash
  picknorder.inventory.stock.v1
  ```

- **Partitions:** 1
- **Replication:** 2

## 1. Aiven message fields

When producing a message in Aiven, enter the **Key** and **Value** separately.

- **Key:** JSON object identifying the aggregate (the product).
- **Value:** JSON event envelope consumed by the Products service.

### Message key format

```json
{
  "aggregateId": "product-id-here"
}
```

### Event value format

```json
{
  "eventId": "unique-event-id",
  "eventType": "product.out-of-stock",
  "eventVersion": 1,
  "occurredAt": "2026-11-28T10:00:00.000Z",
  "producer": "inventory-service",
  "data": {
    "productId": "product-id-here",
    "productName": "Sample Product"
  }
}
```

> Replace `product-id-here` with an existing product ID in your database for tests that expect a product status change. Use a fresh `eventId` for each new event, except when deliberately testing duplicates.

---

## 2. Test: Product becomes out of stock

**Purpose:** Confirm that a valid out-of-stock event sets the product status to `INACTIVE` and records the event.

**Key**

```json
{
  "aggregateId": "a3mkwffqdjj5whdh0clv1l5t"
}
```

**Value**

```json
{
  "eventId": "32fdhbh9j1ojnmawq3",
  "eventType": "product.out-of-stock",
  "eventVersion": 1,
  "occurredAt": "2026-11-28T10:00:00.000Z",
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result**

- Consumer logs that it is processing the event and then that the event was processed.
- Product status becomes `INACTIVE`.
- A row is created in `ProcessedEvent` for `32fdhbh9j1ojnmawq3`.

---

## 3. Test: Product is restocked

**Purpose:** Confirm that a valid restock event sets the product status to `ACTIVE` and records the event.

**Key**

```json
{
  "aggregateId": "a3mkwffqdjj5whdh0clv1l5t"
}
```

**Value**

```json
{
  "eventId": "72f53bh9j1ojnmawq3",
  "eventType": "product.restocked",
  "eventVersion": 1,
  "occurredAt": "2026-11-28T10:05:00.000Z",
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result**

- Consumer processes the event.
- Product status becomes `ACTIVE`.
- A row is created in `ProcessedEvent` for `32fdhbh9j1ojnmawq3`.

---

## 4. Test: Duplicate delivery — same event ID and same payload

**Purpose:** Confirm that a duplicate event does not repeat the database update or create another event-history record.

First, produce the out-of-stock message from **Test 2**. Then produce it again with the **exact same Value**, including the same `eventId`.

**Key**

```json
{
  "aggregateId": "a3mkwffqdjj5whdh0clv1l5t"
}
```

**Value — produce this exact value again**

```json
{
  "eventId": "72f53bh9j1ojnmawq3",
  "eventType": "product.out-of-stock",
  "eventVersion": 1,
  "occurredAt": "2026-11-28T10:00:00.000Z",
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result**

- Consumer logs that the duplicate event was detected and skipped (from the stock handler).
- No second `ProcessedEvent` row is created for that event ID.
- The duplicate is handled as a successful no-op, not as an error/retry.

---

## 5. Test: Same event ID but different event type

**Purpose:** Verify that `eventId` is the idempotency key even if the payload changes.

Use an `eventId` already processed in **Test 2**. Change the `eventType` to `product.restocked`, but keep the same ID.

**Key**

```json
{
  "aggregateId": "a3mkwffqdjj5whdh0clv1l5t"
}
```

**Value**

```json
{
  "eventId": "72f53bh9j1ojnmawq3",
  "eventType": "product.restocked",
  "eventVersion": 1,
  "occurredAt": "2026-11-28T10:10:00.000Z",
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result**

- Consumer identifies this as a duplicate based on the event ID.
- Product status should remain unchanged from its state after Test 2 (it should not be reactivated).
- No new `ProcessedEvent` row is created.

---

## 6. Test: Invalid JSON

**Purpose:** Confirm malformed JSON is skipped without calling the stock handler.

**Key**

```json
{
  "aggregateId": "a3mkwffqdjj5whdh0clv1l5t"
}
```

**Value — intentionally invalid JSON**

```json
{
  "eventId": "manual-test-invalid-json-001",
  "eventType": "product.out-of-stock",
  "eventVersion": 1,
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t"
  }
```

> This value is intentionally missing closing braces and is not valid JSON.

**Expected result**

- Consumer logs `Invalid Kafka JSON; skipping`.
- No `ProcessedEvent` row is created.
- No product status change occurs.

---

## 7. Test: Missing required event fields

**Purpose:** Confirm runtime validation rejects an event missing required fields.

**Key**

```json
{
  "aggregateId": "a3mkwffqdjj5whdh0clv1l5t"
}
```

**Value — missing `eventId` and `occurredAt`**

```json
{
  "eventType": "product.out-of-stock",
  "eventVersion": 1,
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result**

- Consumer logs `Invalid inventory event; skipping`.
- No event is recorded in `ProcessedEvent`.
- Product status does not change.

---

## 8. Test: Unsupported event type

**Purpose:** Confirm an event with an unknown event type is rejected.

**Key**

```json
{
  "aggregateId": "a3mkwffqdjj5whdh0clv1l5t"
}
```

**Value**

```json
{
  "eventId": "manual-test-unsupported-001",
  "eventType": "product.price-changed",
  "eventVersion": 1,
  "occurredAt": "2026-11-28T10:15:00.000Z",
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result**

- Consumer logs `Invalid inventory event; skipping`.
- No `ProcessedEvent` row is created.
- Product status does not change.

---

## 9. Test: Wrong event version

**Purpose:** Confirm only event version `1` is accepted.

**Key**

```json
{
  "aggregateId": "a3mkwffqdjj5whdh0clv1l5t"
}
```

**Value**

```json
{
  "eventId": "manual-test-wrong-version-001",
  "eventType": "product.out-of-stock",
  "eventVersion": 2,
  "occurredAt": "2026-11-28T10:20:00.000Z",
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result**

- Consumer logs `Invalid inventory event; skipping`.
- No event is recorded.
- Product status does not change.

---

## 10. Test: Wrong producer

**Purpose:** Confirm the consumer rejects events not produced by the expected service.

**Key**

```json
{
  "aggregateId": "a3mkwffqdjj5whdh0clv1l5t"
}
```

**Value**

```json
{
  "eventId": "manual-test-wrong-producer-001",
  "eventType": "product.out-of-stock",
  "eventVersion": 1,
  "occurredAt": "2026-11-28T10:25:00.000Z",
  "producer": "some-other-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result**

- Consumer logs `Invalid inventory event; skipping`.
- No event is recorded.
- Product status does not change.

---

## 11. Test: Product ID does not exist

**Purpose:** Observe how the service behaves if an otherwise valid event references a non-existent product.

**Key**

```json
{
  "aggregateId": "product-does-not-exist"
}
```

**Value**

```json
{
  "eventId": "manual-test-missing-product-001",
  "eventType": "product.out-of-stock",
  "eventVersion": 1,
  "occurredAt": "2026-11-28T10:30:00.000Z",
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result — needs verification**

- Observe whether the ORM update throws an error or silently updates zero rows.
- Check whether `ProcessedEvent` is created.
- This test is specifically intended to expose the product-existence validation gap. Do not assume it is handled correctly until the ORM's update result is verified.

---

## 12. Test: Database failure

**Purpose:** Confirm a genuine database failure propagates from the handler and is not silently swallowed.

This scenario cannot be reliably produced just by changing the message JSON. Use a test environment where the database connection can be safely interrupted or a controlled database failure can be induced.

**Use a valid event with a fresh ID**, for example:

```json
{
  "eventId": "manual-test-db-failure-001",
  "eventType": "product.out-of-stock",
  "eventVersion": 1,
  "occurredAt": "2026-11-28T10:35:00.000Z",
  "producer": "inventory-service",
  "data": {
    "productId": "a3mkwffqdjj5whdh0clv1l5t",
    "productName": "Classic Sunglasses"
  }
}
```

**Expected result**

- The transaction fails.
- The transaction should not leave a `ProcessedEvent` row behind if it rolls back correctly.
- The handler error propagates to KafkaJS.
- Retry behavior depends on the configured consumer retry/error handling; verify it rather than assuming Kafka retries indefinitely.

---

## 13. Test checklist

| #   | Test                    | Expected outcome                         | Done |
| --- | ----------------------- | ---------------------------------------- | ---- |
| 1   | Valid out-of-stock      | Product `INACTIVE`                       | ☐    |
| 2   | Valid restocked         | Product `ACTIVE`                         | ☐    |
| 3   | Duplicate same event    | Skipped; no duplicate DB record          | ☐    |
| 4   | Same ID, different type | Skipped; product unchanged               | ☐    |
| 5   | Invalid JSON            | Logged and skipped                       | ☐    |
| 6   | Missing required fields | Logged and skipped                       | ☐    |
| 7   | Unsupported event type  | Rejected/skipped                         | ☐    |
| 8   | Wrong version           | Rejected/skipped                         | ☐    |
| 9   | Wrong producer          | Rejected/skipped                         | ☐    |
| 10  | Product missing         | Verify ORM behavior                      | ☐    |
| 11  | Database failure        | Transaction rolls back; error propagates | ☐    |

## Notes

- Use a product that exists for tests 1–4.
- Use a unique event ID for every test except duplicate tests.
- Kafka message keys are useful for identifying/grouping the product, but the current consumer logic uses the **event value** for processing. The key is not currently used by `kafka.consumer.ts`.
- Invalid messages are skipped by the consumer in the current implementation. They are not persisted to an invalid-message audit table or DLQ.
- Duplicate delivery is handled in `inventory.service.ts` via the `ProcessedEvent.eventId` uniqueness constraint.
