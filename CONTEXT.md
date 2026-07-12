# MedBook — Contexto do Projeto (Julho 2026)

## Status atual
Landing page redesenhada, precificacao implementada, admin funcional com dados demo. Stripe checkout integrado.

---

---

## O que ja foi feito

### Landing page
- Redesign completo: Sora (headings) + Inter (body), paleta refinada (`#F5F8FA`), preview do chat animado
- 6 cards de features, precos (3 tiers), depoimentos, CTA final, footer
- Testada em mobile (375px), tablet (768px), desktop (1280px) — zero scroll horizontal

### Precificacao
- Tabela `pricing_plans` com 3 tiers: Starter R$97/mes, Professional R$197/mes, Enterprise R$397/mes
- `clinics` atualizada com `plan_id` FK, `billing_cycle`, `trial_ends_at`, `conversations_used_monthly`
- Seed: `pnpm seed-plans`
- API: `GET/POST /api/admin/clinics`, `GET/PATCH/DELETE /api/admin/clinics/[id]`, `GET /api/admin/plans`

### Seed dados demo
- `pnpm seed-demo`: 20 sessoes de chat com pacientes reais (nomes, telefones, emails) distribuidas nos ultimos 14 dias
- Dashboards e analytics populados com dados

### Corrigido
- **Erro 500 analytics/dashboard**: Date objects dentro de `sql\` raw templates — trocado por `lt()` do Drizzle
- **Plans API**: `where(asc())` → `orderBy(asc())`
- **Landing redirect**: `src/app/page.tsx` removia rota p/ /admin
- **Chat initial message**: greeting IA adicionado em /chat e /chat/embed
- **Deprecation warning**: `cross-env NODE_OPTIONS=--no-deprecation` para Windows

### Testes e build
- 59/59 testes passando
- 27 rotas buildando
- Zero console errors/warnings no frontend
- Push feito para origin (scheduleclinic) e aria-med

---

## Arquitetura

### Stack principal
- **Next.js 16** App Router, `src/` dir, `@/*` → `src/*`
- **Drizzle ORM** + Supabase PostgreSQL
- **LangGraph.js** — agente conversacional (3 nodes: doubt_resolution, scheduling, pre_anamnesis)
- **Google Calendar API** — service account
- **Groq** — LLM provider (OpenAI-compatible)

### Rotas atuais
```
/                   → landing page
/chat               → chat web standalone
/chat/embed         → chat embed (iframe)
/admin/login        → login administrativo
/admin/dashboard    → dashboard com metricas
/admin/analytics    → metricas detalhadas
/admin/super        → super admin (CRUD clinicas + planos)
/admin/patients     → pacientes
/admin/contexto     → base de conhecimento
/admin              → calendario Google
/api/chat           → POST endpoint do chat
/api/admin/clinics  → CRUD clinicas
/api/admin/plans    → listar planos
/api/health         → health check
```

### Database
- Tabelas: `users`, `clinics`, `pricing_plans`, `professionals`, `chat_sessions`, `chat_messages`, `appointments`, `clinic_context`, `triage_sessions`, `triage_messages`
- `chat_sessions`: session_id, clinic_id, patient_name, patient_phone, patient_email, created_at
- `chat_messages`: session_id, role (user/assistant), content, created_at
- `pricing_plans`: name, slug, price_monthly/yearly (em centavos), max_professionals, max_conversations_monthly, features JSONB

---

## Proximas etapas (prioridade)

### 1. Deploy publico
- Subir para Vercel com URL publica para clientes acessarem
- Configurar dominio personalizado
- Verificar variaveis de ambiente no deploy

### 2. WhatsApp ativo
- Codigo existe em `src/lib/meta/` mas sem numero verificado no WABA
- Precisa: numero WhatsApp Business verificado + configurar Meta webhook
- Ativar `src/app/api/webhook/route.ts` (hoje responde apenas GET verify)

### 3. Fluxo de checkout / assinatura ✅
- Stripe SDK integrado (`src/lib/stripe.ts`)
- API: `POST /api/stripe/create-checkout-session` — cria sessao Stripe Checkout
- API: `POST /api/stripe/create-portal-session` — portal de gerenciamento Stripe
- Webhook: `POST /api/stripe/webhook` — `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
- Seed: `pnpm seed-stripe-products` — cria produtos/precos no Stripe e salva IDs no DB
- Pagina publica `/pricing` com toggle mensal/anual
- Pagina admin `/admin/billing` com plano atual, uso, upgrade/downgrade
- Colunas adicionadas ao schema: `stripe_product_id`, `stripe_price_id_monthly`, `stripe_price_id_yearly` em `pricing_plans`
- **Precisa**: `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` no .env.local + Vercel

### 4. Onboarding de nova clinica ✅
- Pagina `/admin/signup` com formulario completo (nome, email, senha, clinica, especialidade, telefone)
- API `POST /api/admin/signup` — cria `users` + `clinics` + `adminUsers` em transacao, auto-login
- Middleware (`src/middleware.ts`) ativo — protege `/admin/*`, exceto login/signup/forgot/reset
- Login page tem link para cadastro
- Landing page CTAs apontam para `/admin/signup`
- Checkout e portal usam `clinicId` da sessao JWT, nao mais env var hardcoded
- API `GET /api/admin/me` — retorna usuario logado a partir do cookie

### 5. Landing page SEO
- Meta tags, OG image, descricao
- Google Analytics / Plausible
- Sitemap

---

## Comandos uteis

| Comando | Descricao |
|---------|-----------|
| `pnpm dev` | Servidor dev |
| `pnpm build` | Build producao |
| `pnpm test` | Jest (59 testes) |
| `pnpm seed-plans` | Seed pricing_plans (3 tiers) |
| `pnpm seed-demo` | Seed 20 sessoes chat demo |

## Pontos de atencao
- `ignoreBuildErrors: true` — erros TS nao bloqueiam build
- `matcher: []` no middleware — nunca executa
- `strict: false` no tsconfig — tipos relaxados
- Colunas legadas no schema: `stripeCustomerId`, `subscriptionId`, `supabaseId` (ainda no banco, nao usadas)
- Google Calendar private key precisa de `replace(/\\n/g, "\n")` (ja tratado)
