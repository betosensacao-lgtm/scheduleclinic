# WhatsApp Webhook

Receive and process inbound WhatsApp Business messages.

## POST `/api/whatsapp/webhook`

### Verification (GET)

WhatsApp requires a verification handshake. Send a GET request with:

| Query Param | Description |
|-------------|-------------|
| `hub.mode` | `subscribe` |
| `hub.verify_token` | Your `WHATSAPP_VERIFY_TOKEN` |
| `hub.challenge` | Random string to echo back |

The endpoint responds with the challenge value if the token matches.

### Inbound Messages (POST)

Processes incoming messages and routes them through the triage system.

**Body:** Standard WhatsApp Cloud API webhook payload.

### Processing Flow

1. Extract message content and sender phone number
2. Find or create a `whatsappSessions` record
3. Route through LangGraph triage agent
4. Send response back via WhatsApp Business API

---

## POST `/api/whatsapp/send`

Send an outbound WhatsApp message.

**Auth:** Requires authenticated session (clinic admin).

**Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | Yes | Recipient phone number |
| `message` | string | Yes | Message text |
| `clinic_id` | string (UUID) | Yes | Clinic ID for context |
