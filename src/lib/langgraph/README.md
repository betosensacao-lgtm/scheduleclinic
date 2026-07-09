# LangGraph Module - MedBook Triage & Scheduling

## Visão Geral

Este módulo implementa a orquestração do agente de IA usando **LangGraph.js**, preparando o sistema para ser um SaaS B2B ("Clinic-in-a-Box") multi-tenant.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        LangGraph Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                                                    │
│  │  START   │                                                    │
│  └────┬─────┘                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐     ┌─────────────┐     ┌──────────────┐          │
│  │  Router  │────▶│   Triage    │────▶│ Escalation   │          │
│  └────┬─────┘     └──────┬──────┘     └──────────────┘          │
│       │                  │                                        │
│       │                  ▼                                        │
│       │           ┌─────────────┐                                │
│       │           │ Scheduling  │                                │
│       │           └─────────────┘                                │
│       │                                                          │
│       └──────────▶┌──────────────┐                               │
│                   │ Doubt Resol. │                               │
│                   └──────────────┘                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. State (Estado Global)

Arquivo: `state.ts`

O estado contém todas as informações compartilhadas entre os nós:

- **messages**: Histórico da conversa
- **patientId/clinicId**: Identificadores multi-tenant
- **triageUrgency**: Nível de urgência (RED/YELLOW/GREEN)
- **intent**: Intenção identificada (TRIAGEM/AGENDAMENTO/DUVIDA_CLINICA)
- **Dados clínicos**: Sintomas, histórico, intensidade da dor
- **Dados de agendamento**: Profissional, data, horário

### 2. Nodes (Nós)

Arquivo: `nodes.ts`

| Nó | Função |
|-----|--------|
| `routerNode` | Analisa intenção do usuário via LLM |
| `triageNode` | Conduz triagem conversacional |
| `escalationNode` | Escala para humano (casos urgentes) |
| `schedulingNode` | Gerencia agendamentos |
| `doubtResolutionNode` | Responde dúvidas clínicas |

### 3. Edges (Arestas Condicionais)

Arquivo: `edges.ts`

| Aresta | Lógica |
|--------|--------|
| `routeAfterRouter` | Redireciona baseado na intenção |
| `routeAfterTriage` | Verifica urgência e progresso |
| `routeAfterEscalation` | Sempre termina |
| `routeAfterScheduling` | Continua até agendar |
| `routeAfterDoubt` | Sempre termina |

### 4. Tools (Ferramentas)

As tools são chamadas automaticamente pelo **Scheduling Node** via Function Calling do LLM.

| Tool | Descrição | Integração DB |
|------|-----------|---------------|
| `check_availability` | Busca horários livres | PostgreSQL (professionals) |
| `book_appointment` | Cria agendamento | PostgreSQL (appointments, users) |

**Fluxo de agendamento:**
1. Usuário diz "Quero agendar"
2. Router classifica como `AGENDAMENTO`
3. Scheduling Node chama LLM com tools disponíveis
4. LLM decide chamar `check_availability` → busca slots no DB
5. LLM apresenta opções ao paciente
6. Paciente confirma → LLM chama `book_appointment` → cria registro no DB

### 5. Graph (Grafo Principal)

Arquivo: `graph.ts`

Compila todos os componentes em um grafo executável.

## Uso Básico

### 1. Executar o Grafo

```typescript
import { runTriageGraph } from "@/lib/langgraph";
import { HumanMessage } from "@langchain/core/messages";

const result = await runTriageGraph({
  messages: [new HumanMessage("Estou com dor de cabeça há 3 dias")],
  clinicId: "uuid-da-clinica",
  patientName: "João Silva",
  patientEmail: "joao@email.com",
});

console.log(result.intent); // "TRIAGEM"
console.log(result.triageUrgency); // "YELLOW"
```

### 2. Usar via Webhook

```bash
POST /api/chat/webhook
Content-Type: application/json

{
  "message": "Preciso de uma consulta",
  "clinic_id": "uuid-da-clinica",
  "patient_name": "Maria Santos",
  "patient_email": "maria@email.com",
  "patient_phone": "5511999998888"
}
```

### 3. Usar Tools Individualmente

```typescript
import { checkAvailabilityTool } from "@/lib/langgraph";

const result = await checkAvailabilityTool.invoke({
  clinicId: "uuid-da-clinica",
  specialty: "cardiology",
  preferredPeriod: "manha",
});

const slots = JSON.parse(result);
console.log(slots.professionals[0].availableSlots);
```

## Fluxos de Exemplo

### Fluxo 1: Triagem Normal

1. Usuário: "Estou com dor de barriga"
2. Router → Intent: TRIAGEM
3. Triage → Pergunta sobre sintomas
4. Usuário responde...
5. Triage → Classifica como GREEN
6. Scheduling → Oferece horários

### Fluxo 2: Caso Urgente

1. Usuário: "Estou com dor no peito"
2. Router → Intent: TRIAGEM
3. Triage → Identifica sintomas graves
4. Triage → Classifica como RED
5. Escalation → Mensagem de emergência

### Fluxo 3: Agendamento Direto

1. Usuário: "Quero marcar consulta"
2. Router → Intent: AGENDAMENTO
3. Scheduling → Busca disponibilidade
4. Usuário escolhe horário
5. Scheduling → Cria agendamento

## Configuração

### Variáveis de Ambiente

```env
# Groq (LLM)
GROQ_API_KEY=your-groq-key
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Banco de dados (já existente)
DATABASE_URL=postgresql://...
```

## Persistência

O sistema usa **SqliteSaver** para persistir sessões de conversa entre chamadas.

- **Database**: `data/langgraph.db` (auto-criada na primeira execução)
- **Backup**: Fallback para MemorySaver (in-memory) se SQLite falhar
- **Multi-turn**: O histórico completo é mantido entre chamadas usando `session_id`

```typescript
// Exemplo de uso com persistência
const result = await runTriageGraph(input, "session-uuid");

// Segunda chamada com mesmo session_id retoma a conversa
const result2 = await runTriageGraph(input2, "session-uuid");
```

## Streaming

O endpoint suporta streaming via Server-Sent Events (SSE):

```bash
# Modo JSON (resposta completa)
POST /api/chat/webhook

# Modo SSE (resposta em tempo real)
POST /api/chat/webhook?stream=1
```

Eventos SSE:
- `node_start` — Nó do grafo iniciado
- `node_complete` — Resposta do nó
- `done` — Conversa finalizada com metadados
- `error` — Erro durante processamento

## Estrutura de Arquivos

```
src/lib/langgraph/
├── index.ts      # Exportações públicas
├── state.ts      # Definição do estado
├── nodes.ts      # Nós do grafo
├── edges.ts      # Arestas condicionais
├── tools.ts      # Ferramentas (Function Calling)
├── graph.ts      # Grafo principal compilado
└── README.md     # Este arquivo
```

## Próximos Passos

1. [x] Persistência de sessão (SQLite via SqliteSaver)
2. [x] Streaming de respostas (SSE)
3. [x] Integrar Tools reais com banco PostgreSQL (check_availability, book_appointment)
4. [ ] Token-level streaming (caractere por caractere do LLM)
5. [ ] Implementar human-in-the-loop
6. [ ] Criar dashboard admin para monitoramento
7. [ ] Adicionar testes unitários e de integração (Vitest)
8. [ ] Suporte multi-idioma completo (PT/ES/EN)
