# API Reference

MedBook exposes REST API routes under `/api/`. All endpoints return JSON unless otherwise noted.

**Base URL:** `https://your-domain.com`

---

## Authentication

Most endpoints require a valid Supabase session. The app uses cookie-based auth via `@supabase/ssr`.

Protected routes are enforced in `src/proxy.ts` (Next.js middleware). Unauthenticated requests to protected routes are redirected to `/auth/login`.

---

## Endpoints

### Triage (AI Chat)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/chat/webhook` | No | Send a message to the AI triage agent |
| `GET` | `/api/chat/webhook` | No | Health check |
| `POST` | `/api/triage/chat` | No | Conversational triage (alternative) |
| `POST` | `/api/triage/complete` | No | Finalize a triage session |

### Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| Server Actions | `src/app/[locale]/(app)/appointments/actions.ts` | Yes | CRUD for appointments |

### Stripe (Payments)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/stripe/checkout` | Yes | Create a Stripe checkout session |
| `POST` | `/api/stripe/portal` | Yes | Redirect to billing portal |
| `POST` | `/api/stripe/webhook` | Signature | Handle Stripe events |

### WhatsApp

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/whatsapp/send` | Yes | Send a WhatsApp message |
| `POST` | `/api/whatsapp/webhook` | Verify Token | Receive inbound WhatsApp messages |

### Cron

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/cron/reminders` | Bearer Token | Send 24h appointment reminders |

---

## Detailed Endpoint Documentation

See individual files:

- [Triage Webhook](./triage-webhook.md) — AI chat endpoint with JSON and SSE streaming
- [Stripe Webhook](./stripe-webhook.md) — Payment event handling
- [WhatsApp Webhook](./whatsapp-webhook.md) — Inbound message processing
