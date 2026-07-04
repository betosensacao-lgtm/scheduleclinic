# Architecture

MedBook is a medical clinic scheduling platform with AI-powered triage. This section documents the system design and key architectural decisions.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                            │
│  Next.js 16 App Router · React 19 · Tailwind · shadcn   │
├─────────────────────────────────────────────────────────┤
│                    API Layer                              │
│  Next.js Route Handlers · Server Actions · Middleware     │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Triage   │ Booking  │ Stripe   │ WhatsApp │  Cron       │
│ (LangGraph)│        │          │          │             │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│                   Data Layer                              │
│  Drizzle ORM · Supabase PostgreSQL · SQLite (sessions)   │
├─────────────────────────────────────────────────────────┤
│                  External Services                        │
│  Supabase Auth · Groq LLM · Resend · Stripe · WhatsApp  │
└─────────────────────────────────────────────────────────┘
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| [LangGraph Triage Agent](./langgraph.md) | `src/lib/langgraph/` | AI-powered multi-turn medical triage |
| [Booking System](./booking.md) | `src/lib/booking.ts` + `src/app/[locale]/booking/` | Clinic search and appointment scheduling |
| [Auth](./auth.md) | `src/proxy.ts` + `src/app/auth/` | Supabase Auth with cookie-based sessions |
| [Email](./email.md) | `src/lib/email/` | Transactional emails via Resend |
| [WhatsApp](./whatsapp.md) | `src/lib/whatsapp/` | WhatsApp Business API integration |
| [Payments](./payments.md) | `src/lib/stripe.ts` + `src/app/api/stripe/` | Stripe subscription billing |

## Database Schema

7 tables, 7 enums. See [Database](./database.md) for full schema documentation.

## Deployment

- **Platform:** Vercel
- **Database:** Supabase (PostgreSQL)
- **Package Manager:** pnpm
- **Node.js:** 18+ (Vercel default)

## Environment Variables

See [`.env.example`](../../.env.example) for the full list with descriptions.
