# MedBook — AGENTS.md

## Comandos essenciais

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor dev Next.js |
| `pnpm build` | Build de produção (ignora erros TS — `next.config.ts` força `ignoreBuildErrors: true`) |
| `pnpm lint` | ESLint (Next.js) |
| `pnpm test` | Jest (jsdom, ts-jest) |
| `pnpm test -- -u` | Jest com update de snapshots |
| `pnpm db:generate` | Gera migration SQL com Drizzle Kit |
| `pnpm db:migrate` | Aplica migrations no banco |

## Framework & toolchain

- **Next.js 16** App Router, `src/` directory, `@/*` → `src/*`
- **Drizzle ORM** + Supabase PostgreSQL. Migrations usam `DIRECT_URL` (conexao direta, sem pooler). Runtime usa `DATABASE_URL` (pooler porta 6543 com `prepare: false`).
- **LangGraph.js** para o agente conversacional. Grafo em `src/lib/langgraph/` com 3 nodes: `doubt_resolution`, `scheduling`, `pre_anamnesis`.
- **Meta API** integracao direta (sem n8n/Make). Webhook unificado em `app/api/webhook/route.ts` atende WhatsApp, Instagram e Facebook Messenger.
- **Google Calendar API** substitui agendamento via DB proprio. Client em `lib/calendar/google.ts`.
- **pnpm** com `pnpm-workspace.yaml` que permite build de `esbuild`.

## Rotas atuais

```
/                   → redirect para /admin
/admin              → Visao de agendamentos (Google Calendar)
/admin/contexto     → Gestao da base de conhecimento da IA
/api/webhook        → Webhook unificado Meta (GET verify + POST messages)
/api/health         → Health check
```

## Pontos de atencao

- **`strict: false`** no `tsconfig.json` — tipos sao relaxados, mas nao use `any` sem necessidade.
- **Migrations** sao geradas com `drizzle-kit` e precisam ser aplicadas via `pnpm db:migrate`. A pasta `src/db/migrations/` esta no `.gitignore`.
- **`ignoreBuildErrors: true`** no `next.config.ts` — o build nao falha em erros TS, mas eles aparecem no output.
- **Middleware** (`src/proxy.ts`) atual — faz apenas `NextResponse.next()`, sem locale ou auth guard.
- **Variáveis de ambiente** em `.env.local` (gitignorado).
- **Testes** sao Jest puro (sem Testing Library para componentes — apenas unitarios). Testes atuais em `src/lib/*.test.ts` cobrem utils e edge routing do grafo.

## Variaveis de ambiente necessarias

```env
DATABASE_URL=           # Supabase pooler (porta 6543, prepare: false)
DIRECT_URL=             # Supabase direto (porta 5432, para migrations)
GROQ_API_KEY=           # Chave da API Groq
META_APP_SECRET=        # App Secret do Meta Developers
META_WEBHOOK_VERIFY_TOKEN= # Token de verificacao do webhook
WHATSAPP_TOKEN=         # Access Token do WhatsApp Business
WHATSAPP_PHONE_NUMBER_ID=  # ID do numero de telefone no WABA
PAGE_ACCESS_TOKEN=      # Token da Page (IG/FB Messenger)
INSTAGRAM_USER_ID=      # ID da conta Instagram
FACEBOOK_PAGE_ID=       # ID da pagina Facebook
GOOGLE_CALENDAR_CLIENT_EMAIL=  # Service account email
GOOGLE_CALENDAR_PRIVATE_KEY=   # Chave privada da service account
GOOGLE_CALENDAR_ID=     # ID do calendario Google
CLINIC_ID=              # ID da clinica no banco de dados
```

## Fluxo de trabalho para mudancas

1. Editar schema em `src/db/schema.ts`
2. `pnpm db:generate` + `pnpm db:migrate`
3. `pnpm lint` (opcional, erros TS nao bloqueiam build)
4. `pnpm test` (testes unitarios existentes)

## Estrutura dos modulos principais

| Diretorio | Responsabilidade |
|-----------|-----------------|
| `src/lib/langgraph/` | Grafo do agente (state, nodes, edges, tools, graph) |
| `src/lib/meta/` | Normalizacao e envio de mensagens para Meta |
| `src/lib/calendar/` | Integracao Google Calendar API |
| `src/lib/rag/` | Base de conhecimento da clinica (tabela `clinic_context`) |
| `src/lib/ai.ts` | Cliente Groq (OpenAI-compatible) com Proxy lazy |
| `src/db/schema.ts` | Schema Drizzle (todas as tabelas) |
| `src/app/api/webhook/route.ts` | Webhook unificado Meta |
| `src/app/admin/` | Interface administrativa |
