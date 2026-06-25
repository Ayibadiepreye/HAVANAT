# Havanat — Logistics, Delivery Fees & Order Lifecycle Spec (Backend Cutover)

## 1. Per-item delivery fees (no flat-rate shipping)

- Each product has an admin/moderator-set `deliveryFee` (₦, integer).
- Cart computes `deliveryFee = Σ (product.deliveryFee × quantity)`. If a product has no fee set, fall back to the platform default (`CONFIG.DEFAULT_DELIVERY_FEE = ₦2,500`).
- Customer sees a per-line breakdown in cart + checkout + order confirmation.
- Admin/Moderator product-edit form has a numeric input for delivery fee.
- No "free delivery" promotion. Tier discounts apply to product subtotal only.

### Schema (backend)

```
products {
  ...
  delivery_fee     integer     // in kobo, default 250000 (₦2,500)
  deluxe_discount  numeric     // 0-1, default 0.05
  elite_discount   numeric     // 0-1, default 0.10
  occasion         text[]      // ["corporate","formal-event","social","everyday"]
}
```

## 2. Order lifecycle

```
received → processing → in_transit → delivered
                                    ↘ cancelled (from any prior state)
```

| Stage | Set by | UI surface |
|-------|--------|------------|
| `received` | System (order placed + payment confirmed) | Customer + admin |
| `processing` | Rider (warehouse pickup OTP verified) **OR** admin (manual) | Rider app + customer email + order page |
| `in_transit` | Rider (mid-route) | Customer sees "Rider is on the way" block + map |
| `delivered` | Rider (delivery OTP verified + photo + optional signature) | Customer + admin |
| `cancelled` | Customer (within 1 hour of `processing`) OR admin (any reason) | All |

### Skipped stages (e.g. `received → delivered` directly)

If the rider/admin transitions from `received` straight to `delivered`, the
backend **MUST auto-fill the missing events** (`processing`, `in_transit`)
with the timestamp at the moment of transition and a note such as:
`Back-filled by [actor]: stage skipped, marked complete at delivery confirmation.`

This guarantees:
- Audit log + timeline are continuous
- Customer timeline doesn't show gaps
- Analytics queries on time-in-stage still produce meaningful numbers

### Delivery OTP

- 4-digit, generated server-side when order first enters `processing`.
- Stored in `orders.delivery_otp`.
- **Email-only delivery**: OTP is sent via Resend to the customer's email
  AND shown on `/account/orders/:id` when status ∈ {processing, in_transit}.
- Customer reveals the code to the rider, rider types it in to confirm delivery.
- 5-attempt lockout per order (configurable) — beyond that, rider must contact support.

## 3. Routes (backend)

| Verb | Path | Auth | Purpose |
|------|------|------|---------|
| `GET`    | `/api/orders`                              | customer (own) / staff (all) | List orders |
| `GET`    | `/api/orders/:id`                          | customer (own) / staff (all) | Order detail + tracking |
| `POST`   | `/api/orders`                              | customer | Place order |
| `PATCH`  | `/api/orders/:id/status`                   | rider / admin | Update status (with skipped-stage auto-fill) |
| `POST`   | `/api/orders/:id/verify-delivery`          | rider | Verify delivery OTP |
| `POST`   | `/api/orders/:id/proof`                    | rider | Attach photo + optional signature |
| `GET`    | `/api/orders/:id/tracking`                 | customer (own) / staff | Tracking events |
| `PATCH`  | `/api/orders/:id/cancel`                   | customer (within 1h of processing) / admin | Cancel order |

## 4. Status transition validation

```ts
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received:    ['processing', 'cancelled'],
  processing:  ['in_transit', 'cancelled'],
  in_transit:  ['delivered'],
  delivered:   [],         // terminal
  cancelled:   [],         // terminal
};
```

Backend rejects transitions outside this graph with HTTP 422.

## 5. Audit log

Every status change is recorded (same pattern as the mock):

```
audit_log {
  actorId, actorName, actorRole,
  action: "status_change" | "update",
  entityType: "order",
  entityId: orderId,
  entityLabel: orderNumber,
  summary: "Updated status to {newStatus} ({note})",
  changes: {
    before: { status, riderId, deliveryOtp },
    after:  { status, riderId, deliveryOtp }
  }
}
```

## 6. Frontend surfaces to verify at mock stage

- Cart `deliveryFee()` returns the correct per-item sum
- OrderDetailPage shows the 4-digit delivery OTP block when status = processing/in_transit
- OrderDetailPage timeline shows the back-filled events when stages are skipped
- Rider delivery detail page wires OTP verify + photo + (optional) signature
- Admin can manually set status to any of received/processing/in_transit/delivered/cancelled