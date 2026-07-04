# LangGraph Triage Agent

AI-powered multi-turn medical triage using LangGraph.js.

## Overview

The triage agent conducts a conversational assessment of patient symptoms, classifies urgency, and can schedule appointments directly.

**Stack:** LangGraph.js + Groq (Llama 4 Scout) + PostgreSQL tools

## Graph Flow

```
                    ┌─────────────┐
                    │    START    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   router    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐ ┌─────▼──────┐ ┌──▼───────────┐
     │   triage   │ │ scheduling │ │    doubt_     │
     │  (loop)    │ │            │ │  resolution   │
     └────┬───────┘ └────────────┘ └──────────────┘
          │
    ┌─────┼──────┐
    │            │
┌───▼────┐ ┌────▼──────┐
│escalation│ │ scheduling│
│ (RED)   │ │(YELLOW/  │
└─────────┘ │ GREEN)   │
            └──────────┘
```

## Nodes

### `router`
Classifies user intent into one of:
- `TRIAGEM` — Symptom assessment
- `AGENDAMENTO` — Appointment scheduling
- `DUVIDA_CLINICA` — General health question
- `CANCELAMENTO` — Cancel appointment

### `triage`
Multi-turn symptom collection. The agent:
1. Asks targeted questions based on initial complaint
2. Detects when sufficient information is gathered
3. Extracts structured clinical data (JSON)
4. Validates with Zod schema
5. Classifies urgency: RED (emergency), YELLOW (soon), GREEN (routine)

### `escalation`
Triggered when urgency = RED. Provides emergency guidance and recommends immediate medical attention.

### `scheduling`
Uses OpenAI function calling with tools to:
1. Check available time slots
2. Book appointments directly in PostgreSQL

### `doubt_resolution`
Answers general health questions. Does NOT provide diagnoses.

## Tools

| Tool | Description | Database Tables |
|------|-------------|-----------------|
| `check_availability` | Query available time slots for a clinic/specialty | `professionals`, `appointments` |
| `book_appointment` | Create a new appointment | `appointments` |
| `get_patient_history` | Fetch patient's last 10 appointments | `appointments`, `professionals` |
| `cancel_appointment` | Cancel an existing appointment | `appointments` |

## State

The graph maintains a `TriageState` with 20+ fields:

```typescript
type TriageState = {
  messages: BaseMessage[];        // Conversation history
  clinicId: string;               // Target clinic
  patientPhone: string | null;
  patientName: string;
  patientEmail: string;
  locale: "en" | "pt" | "es";    // Response language
  intent: string | null;          // Classified intent
  triageUrgency: string | null;   // RED/YELLOW/GREEN
  suggestedSpecialty: string | null;
  triageCompleted: boolean;
  clinicalData: object | null;    // Extracted clinical info
  schedulingData: object | null;
  iterationCount: number;         // Triage loop counter
  maxIterations: number;          // Default: 3
  // ... more fields
};
```

## Persistence

Uses SQLite via `SqliteSaver` for conversation persistence across server restarts.

**File:** `data/langgraph.db`

**Fallback:** `MemorySaver` if SQLite is unavailable.

**Thread-based:** Each `session_id` maps to a LangGraph thread.

## Streaming Modes

| Mode | Endpoint | Events |
|------|----------|--------|
| JSON | `POST /api/chat/webhook` | Full response at once |
| Node SSE | `POST /api/chat/webhook?stream=1` | `node_start`, `node_complete`, `done` |
| Token SSE | `POST /api/chat/webhook?stream=tokens` | All above + individual `token` events |

## System Prompts

Trilingual prompts defined in `src/lib/triage-prompt.ts`:
- **Spanish (ES)** — Default for Latin America
- **Portuguese (PT)** — Brazil
- **English (EN)** — International

Each prompt defines:
- Agent role and boundaries
- Question guide by symptom category
- Urgency classification criteria
- Specialty mapping
- JSON output format
