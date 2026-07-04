# Stripe Webhook

Handles Stripe subscription lifecycle events.

## POST `/api/stripe/webhook`

### Authentication

Uses Stripe signature verification. The request body must be the raw JSON string, and the `stripe-signature` header must be present.

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `stripe-signature` | Yes | Stripe webhook signature |

### Handled Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set clinic subscription to active, store customer/subscription IDs |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Cancel subscription, reset to free plan |

### Response

**Success:**
```json
{ "received": true }
```

**Error (invalid signature):**
```json
{ "error": "Invalid signature" }
```

### Setup

1. Create a webhook in Stripe Dashboard pointing to `https://your-domain.com/api/stripe/webhook`
2. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`
