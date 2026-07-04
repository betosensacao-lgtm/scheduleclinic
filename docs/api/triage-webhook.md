# Triage Webhook

AI-powered medical triage and appointment scheduling via LangGraph.

## POST `/api/chat/webhook`

Send a message to the triage agent. Supports three response modes.

### Request

**Headers:**
| Header | Required | Value |
|--------|----------|-------|
| `Content-Type` | Yes | `application/json` |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `stream` | string | — | `"1"` for node-level SSE, `"tokens"` for token-level SSE. Omit for JSON response. |

**Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Patient message (1-2000 chars) |
| `clinic_id` | string (UUID) | Yes | Target clinic ID |
| `patient_phone` | string | No | Patient phone number |
| `patient_name` | string | No | Patient name (2-120 chars) |
| `patient_email` | string (email) | No | Patient email |
| `session_id` | string (UUID) | No | Existing session ID for continuation |
| `locale` | `"en"` \| `"pt"` \| `"es"` | `"pt"` | Response language |

**Example:**

```bash
curl -X POST https://medbook.app/api/chat/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tenho dor de cabeça há 3 dias",
    "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
    "patient_name": "Maria Silva",
    "patient_email": "maria@example.com",
    "locale": "pt"
  }'
```

### JSON Response (default)

```json
{
  "success": true,
  "response": "Entendo que você está com dor de cabeça há 3 dias...",
  "intent": "TRIAGEM",
  "urgency": "GREEN",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "triage_completed": false,
    "suggested_specialty": null,
    "message_count": 2
  }
}
```

### SSE Response (`?stream=1`)

Server-Sent Events with node-level updates:

```
event: node_start
data: {"node":"router"}

event: node_complete
data: {"node":"router","output":"TRIAGEM"}

event: node_start
data: {"node":"triage"}

event: node_complete
data: {"node":"triage","output":"Entendo que você está com dor de cabeça..."}

event: done
data: {"session_id":"...","intent":"TRIAGEM","urgency":"GREEN","specialty":null,"message_count":2}
```

### Token-level SSE (`?stream=tokens`)

Same as above but includes individual token events:

```
event: token
data: {"node":"triage","content":"Ent"}

event: token
data: {"node":"triage","content":"endo"}

event: token
data: {"node":"triage","content":" que"}
```

### Error Responses

**400 — Validation Error:**
```json
{
  "success": false,
  "error": "Dados inválidos",
  "details": {
    "fieldErrors": {
      "message": ["String must contain at least 1 character(s)"]
    }
  }
}
```

**500 — Server Error:**
```json
{
  "success": false,
  "error": "Erro interno do servidor"
}
```

---

## GET `/api/chat/webhook`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "MedBook Triage Webhook",
  "version": "3.0.0",
  "features": ["persistence", "multi-turn", "streaming"],
  "endpoints": {
    "json": "POST /api/chat/webhook",
    "sse": "POST /api/chat/webhook?stream=1"
  },
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

---

## LangGraph Agent Flow

```
START → router → triage (loop, max 3 iterations)
                  ├── escalation (if urgency = RED)
                  └── scheduling (if intent = AGENDAMENTO)
              → scheduling (if intent = AGENDAMENTO)
              → doubt_resolution (if intent = DUVIDA_CLINICA)
```

**Tools available to the agent:**
- `check_availability` — Query available time slots
- `book_appointment` — Create an appointment
- `get_patient_history` — Fetch patient's past appointments
- `cancel_appointment` — Cancel an existing appointment

See [Architecture — LangGraph](../architecture/langgraph.md) for details.
