# MedBook (ScheduleClinic)

Plataforma moderna de agendamento de clínicas com pré-anamnese digital e triagem por IA. Construída com Next.js 16, Supabase, LangGraph.js e deploy na Vercel.

## Funcionalidades

- **Triagem por IA** — Chat multi-turno com LangGraph.js que coleta sintomas, classifica urgência (VERMELHO/AMARELO/VERDE) e agenda consultas automaticamente
- **Agendamento online** — Busca de clínicas por especialidade, seleção de profissional e horário, confirmação instantânea
- **Pré-anamnese digital** — Formulário multi-step com dados pessoais, histórico médico, medicamentos, alergias e consentimento
- **Dashboard admin** — Painel com estatísticas, lista de pacientes, agendamentos e sessões de triagem
- **Multi-idioma** — Suporte a Español (ES), Português (PT) e English (EN)
- **Integração WhatsApp** — Envio e recebimento de mensagens via WhatsApp Business API
- **Pagamentos** — Assinaturas Stripe com webhooks para ciclo de vida
- **Lembretes** — Notificações por email 24h antes da consulta (Vercel Cron)

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL (Supabase) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (email/password) |
| IA/LLM | Groq (Llama 4 Scout) |
| Agente IA | LangGraph.js |
| UI | shadcn/ui + Radix UI + Tailwind CSS |
| Formulários | React Hook Form + Zod |
| Email | Resend |
| Pagamentos | Stripe |
| Mensageria | WhatsApp Business API |
| i18n | next-intl |
| Testes | Jest + Testing Library |
| Deploy | Vercel |
| Package Manager | pnpm |

## Início Rápido

### Pré-requisitos

- Node.js 18+
- pnpm
- Conta no Supabase
- Chave de API do Groq

### Instalação

```bash
git clone <repo-url>
cd medbook
pnpm install
```

### Configuração

```bash
cp .env.example .env.local
```

Preencha as variáveis de ambiente em `.env.local` (veja `.env.example` para referência).

### Banco de Dados

```bash
pnpm db:generate    # Gera as migrations
pnpm db:migrate     # Aplica as migrations
```

### Desenvolvimento

```bash
pnpm dev
```

Acesse http://localhost:3000

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── chat/webhook/          # AI Triage (JSON + SSE)
│   │   ├── cron/reminders/        # Lembretes 24h
│   │   ├── stripe/                # Checkout, portal, webhook
│   │   ├── triage/                # Triagem conversacional
│   │   └── whatsapp/              # Envio e webhook
│   ├── auth/                      # Login, registro, verificação
│   ├── [locale]/
│   │   ├── (app)/                 # Dashboard (autenticado)
│   │   │   ├── appointments/      # Gestão de agendamentos
│   │   │   ├── dashboard/         # Painel principal
│   │   │   ├── patients/          # Lista de pacientes
│   │   │   ├── settings/          # Perfil, clínica, billing
│   │   │   ├── triages/           # Sessões de triagem
│   │   │   └── whatsapp/          # Integração WhatsApp
│   │   ├── booking/               # Fluxo público de agendamento
│   │   ├── chat/                  # Interface de chat IA
│   │   └── pre-anamnesis/         # Formulário pré-consulta
│   └── logout/
├── components/
│   ├── anamnesis/                 # Formulário de pré-anamnese
│   ├── layout/                    # Sidebar e Navbar
│   └── whatsapp/                  # QR Code WhatsApp
├── db/
│   ├── schema.ts                  # Schema Drizzle (7 tabelas)
│   ├── index.ts                   # Conexão com banco
│   └── migrations/                # Migrations geradas
├── lib/
│   ├── langgraph/                 # Agente IA (LangGraph.js)
│   ├── email/                     # Templates e envio (Resend)
│   ├── whatsapp/                  # Cliente WhatsApp Business
│   ├── ai.ts                      # Cliente Groq
│   ├── booking.ts                 # Lógica de agendamento
│   ├── queries.ts                 # Queries Drizzle
│   ├── stripe.ts                  # SDK Stripe
│   ├── supabase.ts                # Clientes browser/server
│   ├── triage-prompt.ts           # Prompts do sistema (ES/PT/EN)
│   └── validations.ts             # Schemas Zod
├── messages/                      # Traduções (next-intl)
├── styles/globals.css             # Estilos globais
└── types/index.ts                 # Tipos TypeScript
```

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [API Reference](docs/api/README.md) | Referência completa dos endpoints |
| [Triage Webhook](docs/api/triage-webhook.md) | Endpoint de chat IA com JSON e SSE |
| [Architecture](docs/architecture/README.md) | Visão geral do sistema |
| [Database Schema](docs/architecture/database.md) | Schema completo do banco |
| [LangGraph Agent](docs/architecture/langgraph.md) | Arquitetura do agente IA |
| [GLOSSARIO.md](GLOSSARIO.md) | Glossário para iniciantes (PT) |

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Iniciar servidor de produção |
| `pnpm lint` | Verificar código |
| `pnpm test` | Executar testes |
| `pnpm test:watch` | Testes em watch mode |
| `pnpm test:coverage` | Testes com cobertura |
| `pnpm db:generate` | Gerar migrations |
| `pnpm db:migrate` | Aplicar migrations |
| `pnpm db:studio` | Abrir Drizzle Studio |

## Deploy

O projeto está configurado para deploy na Vercel:

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. O deploy acontece automaticamente a cada push em `main`

**Cron Jobs:** Configure no `vercel.json` → `/api/cron/reminders` roda a cada hora.

## Licença

Projeto privado.
