# Glossário do ScheduleClinic
> Guia de aprendizado para iniciantes — conceitos explicados no contexto deste projeto.

---

## Índice
1. [A Estrutura do Projeto](#1-a-estrutura-do-projeto)
2. [Next.js e App Router](#2-nextjs-e-app-router)
3. [TypeScript](#3-typescript)
4. [Banco de Dados e ORM](#4-banco-de-dados-e-orm)
5. [Supabase e Autenticação](#5-supabase-e-autenticação)
6. [Validação com Zod](#6-validação-com-zod)
7. [Componentes e UI](#7-componentes-e-ui)
8. [Estilização com Tailwind CSS](#8-estilização-com-tailwind-css)
9. [Variáveis de Ambiente](#9-variáveis-de-ambiente)
10. [Fluxo completo de uma requisição](#10-fluxo-completo-de-uma-requisição)

---

## 1. A Estrutura do Projeto

```
scheduleclinic/
├── src/
│   ├── app/          ← Páginas da aplicação (rotas)
│   ├── components/   ← Peças reutilizáveis da interface
│   ├── db/           ← Tudo relacionado ao banco de dados
│   ├── lib/          ← Funções auxiliares e configurações
│   └── types/        ← Definições de tipos TypeScript
├── .env.example      ← Modelo das variáveis de ambiente
├── package.json      ← "Receita" do projeto (dependências e scripts)
└── drizzle.config.ts ← Configuração do ORM
```

**Por que organizar assim?**
Separar por responsabilidade facilita encontrar e alterar código sem quebrar outras partes. Cada pasta tem um propósito claro:
- `app/` sabe onde o usuário está (URL)
- `components/` sabe como as coisas parecem
- `db/` sabe como os dados são guardados
- `lib/` contém ferramentas compartilhadas

---

## 2. Next.js e App Router

**Next.js** é um framework (conjunto de ferramentas) construído sobre o React que facilita criar aplicações web completas — tanto o que o usuário vê (frontend) quanto a lógica do servidor (backend).

### App Router
A pasta `src/app/` define as páginas do site automaticamente pela estrutura de pastas:

```
src/app/
├── layout.tsx              → Layout raiz (envolve tudo)
├── dashboard/
│   ├── layout.tsx          → Layout do dashboard (adiciona a Sidebar)
│   └── page.tsx            → Página /dashboard
└── auth/
    └── login/
        └── page.tsx        → Página /auth/login
```

**Analogia:** imagine o projeto como um prédio. O `layout.tsx` raiz é a estrutura do prédio (paredes, elevador). O `layout.tsx` do dashboard é um andar específico com decoração própria. O `page.tsx` é um quarto dentro desse andar.

### Server vs Client Components

No topo do arquivo `Sidebar.tsx` você vê:
```typescript
"use client";
```

Isso diz ao Next.js onde o código roda:

| | Server Component | Client Component |
|---|---|---|
| **Roda em** | No servidor (nuvem) | No navegador do usuário |
| **Acessa banco?** | Sim, diretamente | Não (usa API) |
| **Tem interatividade?** | Não | Sim (cliques, estados) |
| **Marcação** | Nenhuma (padrão) | `"use client"` no topo |

A `Sidebar` é Client Component porque usa `usePathname()` — um hook que precisa saber qual URL o usuário está, o que só é possível no navegador.

---

## 3. TypeScript

TypeScript é JavaScript com um sistema de **tipos** — você declara o formato que os dados devem ter, e o computador avisa quando você usa algo errado.

### Exemplo deste projeto (`src/types/index.ts`):

```typescript
// Sem TypeScript (JavaScript puro):
const clinic = {
  name: "Clínica Saúde",
  rating: "cinco estrelas"  // Bug! deveria ser número, mas ninguém avisa
};

// Com TypeScript:
interface Clinic {
  name: string;     // texto
  rating: number;   // obrigatoriamente número
}

const clinic: Clinic = {
  name: "Clínica Saúde",
  rating: "cinco estrelas"  // ERRO em tempo de desenvolvimento ← o editor já avisa
};
```

### Tipos importantes neste projeto:

**`UserRole`** — os papéis que um usuário pode ter:
```typescript
type UserRole = "patient" | "clinic_admin" | "professional";
// O | significa "OU" — só esses três valores são permitidos
```

**`AppointmentStatus`** — os estados de uma consulta:
```typescript
type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
```

**`interface`** — define a "forma" de um objeto complexo:
```typescript
interface Appointment {
  id: string;
  patientId: string;    // chave que aponta para um usuário
  date: Date;
  status: AppointmentStatus;  // usa o tipo de cima
  patient?: User;       // o ? significa "opcional"
}
```

---

## 4. Banco de Dados e ORM

### O que é um banco de dados?
É onde os dados são guardados de forma permanente. Este projeto usa **PostgreSQL** — um banco de dados relacional, onde os dados ficam em tabelas (como planilhas) relacionadas entre si.

### O que é um ORM?
ORM (Object-Relational Mapping) é uma camada que permite usar código TypeScript para trabalhar com o banco, sem escrever SQL diretamente.

**Sem ORM (SQL puro):**
```sql
SELECT * FROM appointments WHERE patient_id = '123' AND status = 'confirmed';
```

**Com Drizzle ORM:**
```typescript
const appts = await db.select()
  .from(appointments)
  .where(and(
    eq(appointments.patientId, '123'),
    eq(appointments.status, 'confirmed')
  ));
```

Ambos fazem a mesma coisa, mas o segundo tem autocomplete, verificação de tipos e é mais seguro.

### O Schema (`src/db/schema.ts`)

O schema é o "projeto arquitetônico" do banco — define as tabelas e colunas:

```typescript
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),  // ID único gerado automaticamente
  patientId: uuid("patient_id")
    .notNull()
    .references(() => users.id),                // Chave estrangeira → aponta para users
  date: date("date").notNull(),
  status: appointmentStatusEnum("status")
    .notNull()
    .default("pending"),                        // Valor padrão ao criar
});
```

### Relações entre tabelas

As tabelas se conectam por **chaves estrangeiras** (foreign keys):

```
users ←──────────── appointments ──────────→ professionals
  ↑                      ↓                        ↑
  └──── pre_anamnesis ───┘                clinics ┘
```

Uma consulta (`appointment`) sempre pertence a:
- Um paciente (`patient_id → users.id`)
- Uma clínica (`clinic_id → clinics.id`)
- Um profissional (`professional_id → professionals.id`)

### Migrations

Quando você muda o schema, precisa atualizar o banco também. As migrations são arquivos que registram essas mudanças em ordem, como um histórico:

```bash
npm run db:generate  # Cria o arquivo de migration
npm run db:migrate   # Aplica as mudanças no banco
```

---

## 5. Supabase e Autenticação

**Supabase** é um serviço que fornece:
- Banco de dados PostgreSQL na nuvem
- Sistema de autenticação (login/logout)
- APIs automáticas
- Armazenamento de arquivos

### Client vs Server Client (`src/lib/supabase.ts`)

O projeto tem dois "clientes" Supabase com propósitos diferentes:

```typescript
// Para o navegador (componentes Client)
export function createClient() {
  return createBrowserClient(url, key);
}

// Para o servidor (Server Components, API Routes)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();  // lê cookies da requisição HTTP
  return createServerClient(url, key, { cookies: ... });
}
```

**Por que dois clientes?**
Segurança. O cliente do servidor pode fazer operações privilegiadas (ler dados de qualquer usuário). O cliente do navegador só pode fazer o que o usuário autenticado tem permissão.

### Cookies e Sessão

Quando o usuário faz login, o Supabase guarda um **token de sessão** em um cookie (um pequeno arquivo no navegador). A cada página visitada, esse cookie é enviado automaticamente, provando que o usuário está autenticado.

---

## 6. Validação com Zod

**Zod** é uma biblioteca para validar dados — garantir que o que o usuário digitou é válido antes de salvar no banco.

```typescript
// Definindo as regras (src/lib/validations.ts):
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

// Usando na prática:
const resultado = loginSchema.safeParse({ email: "abc", password: "123" });

if (!resultado.success) {
  console.log(resultado.error.issues);
  // [{ message: "E-mail inválido", path: ["email"] },
  //  { message: "Mínimo 6 caracteres", path: ["password"] }]
}
```

### Zod + TypeScript = tipos gratuitos

```typescript
// O Zod gera o tipo TypeScript automaticamente:
export type LoginInput = z.infer<typeof loginSchema>;
// Equivale a: { email: string; password: string }
```

Isso evita duplicação — você define as regras uma vez e tem validação + tipagem.

### Validação em camadas

```
Usuário digita no formulário
        ↓
  Zod valida no frontend (feedback imediato)
        ↓
  Dados enviados ao servidor
        ↓
  Zod valida novamente no servidor (segurança)
        ↓
  Salva no banco de dados
```

---

## 7. Componentes e UI

### O que é um componente?

Um componente é um pedaço reutilizável da interface. Em vez de repetir o mesmo HTML em várias páginas, você cria um componente e usa em qualquer lugar.

```typescript
// Componente (src/components/layout/Sidebar.tsx):
export function Sidebar() {
  return <aside>...</aside>;
}

// Usando em outra página:
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />           {/* ← componente reutilizável */}
      <main>{children}</main>
    </div>
  );
}
```

### Radix UI + shadcn/ui

Este projeto usa **Radix UI** como base para componentes acessíveis (Dialog, Select, Checkbox, etc.) e **shadcn/ui** como camada de estilo sobre eles.

**Analogia:** O Radix UI é o motor de um carro (funciona bem, mas sem carroceria). O shadcn/ui é a carroceria estilizada. Você dirige o carro, não precisa conhecer o motor em detalhes.

### React Hook Form

Para formulários, usamos **React Hook Form** — gerencia o estado dos campos, erros e submissão:

```typescript
const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),  // conecta com a validação Zod
});

// No JSX:
<input {...register("email")} />
{errors.email && <span>{errors.email.message}</span>}
```

---

## 8. Estilização com Tailwind CSS

**Tailwind CSS** é uma forma de estilizar usando classes utilitárias diretamente no HTML, em vez de criar arquivos CSS separados.

```html
<!-- CSS tradicional: você cria uma classe .card e define estilos em .css -->
<div class="card">Conteúdo</div>

<!-- Tailwind: você aplica os estilos diretamente como classes -->
<div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-md">
  Conteúdo
</div>
```

### Classes comuns neste projeto:

| Classe | O que faz |
|--------|-----------|
| `flex` | Exibe elementos em linha (flexbox) |
| `grid grid-cols-4` | Grade com 4 colunas |
| `p-6` | Padding (espaço interno) de 24px |
| `text-sm font-bold` | Texto pequeno e negrito |
| `rounded-2xl` | Bordas arredondadas |
| `hover:bg-gray-100` | Muda cor ao passar o mouse |
| `hidden md:block` | Escondido no mobile, visível no desktop |

### A função `cn()` (`src/lib/utils.ts`)

```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Combina classes condicionalmente sem conflitos:

```typescript
// Em vez disso (problemático):
className={`base-class ${active ? "bg-blue-500" : "bg-gray-200"}`}

// Use isso (limpo e seguro):
className={cn("base-class", active ? "bg-blue-500" : "bg-gray-200")}
```

---

## 9. Variáveis de Ambiente

Variáveis de ambiente guardam informações sensíveis (senhas, chaves de API) fora do código.

```bash
# .env.local (NUNCA enviar para o Git!)
NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:senha@db.supabase.co:5432/postgres
```

### Prefixo `NEXT_PUBLIC_`

| Variável | Disponível em |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Servidor E navegador (visível ao usuário) |
| `DATABASE_URL` | Apenas no servidor (segura) |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas no servidor (NÃO expor) |

**Regra:** Nunca use variáveis sem `NEXT_PUBLIC_` em componentes Client, senão vão aparecer vazias.

### `.env.example`

Arquivo commitado no Git com os nomes das variáveis (sem os valores reais), para que outros desenvolvedores saibam o que precisam configurar.

---

## 10. Fluxo completo de uma requisição

Para entender como tudo se conecta, veja o caminho de um **agendamento de consulta**:

```
1. USUÁRIO acessa /booking no navegador
        ↓
2. Next.js encontra src/app/booking/page.tsx
        ↓
3. COMPONENTE renderiza formulário
        ↓
4. Usuário preenche e clica "Agendar"
        ↓
5. React Hook Form coleta os dados
        ↓
6. ZOD valida os dados no frontend
        → Se inválido: mostra erros nos campos
        ↓
7. Dados válidos são enviados ao servidor (Server Action)
        ↓
8. ZOD valida novamente no servidor
        ↓
9. SUPABASE verifica se o usuário está autenticado
        ↓
10. DRIZZLE ORM salva no banco PostgreSQL
        ↓
11. RESEND envia e-mail de confirmação
        ↓
12. Usuário é redirecionado para /dashboard
```

---

## 12. Emails e o pipeline de build (Fase 5)

### Como funciona o envio de email
1. `src/lib/email/client.ts` — cria o cliente Resend e tem `sendEmail` que **nunca lança erro** (email falhar não pode quebrar o agendamento)
2. `src/lib/email/templates.ts` — HTML dos emails com estilos **inline** (clientes de email não suportam CSS externo)
3. `src/lib/email/notifications.ts` — busca dados no banco e dispara os emails
4. Integrado no `createAppointment` — após salvar a consulta, envia confirmação + notificação

### Cron jobs (lembretes 24h)
Um "cron" é uma tarefa que roda em horários agendados. O lembrete:
- Roda 1x por dia (configurado no `vercel.json`: `"schedule": "0 9 * * *"` = 9h todo dia)
- Busca consultas de amanhã que ainda não receberam lembrete
- Marca `reminderSentAt` após enviar (**idempotência** — nunca envia duas vezes)
- Protegido por `CRON_SECRET` (só o agendador pode chamar)

### O bug do "site dos anos 2000" — pipeline de build CSS
Esse foi um caso clássico de aprendizado. A página carregava sem **nenhum** estilo. Causa: o Tailwind precisa de uma cadeia de ferramentas para funcionar:

```
globals.css (@tailwind)  →  PostCSS  →  Tailwind plugin  →  CSS final
                              ↑
                   postcss.config.mjs (a "cola")
```

Faltavam 3 peças:
1. **`postcss.config.mjs`** não existia → o Next.js nunca chamava o Tailwind → zero CSS gerado
2. **`tailwindcss-animate`** não instalado → o `tailwind.config.ts` falhava ao carregar
3. **`@import` de fontes na ordem errada** → CSS exige `@import` antes de qualquer outra regra

**Lição:** o HTML e o JS funcionavam (status `200`), mas o CSS estava silenciosamente quebrado. Testar só com código HTTP não pega isso — **abrir no navegador é insubstituível**.

### Bloqueio de IP (Resend + Cloudflare)
O provedor de internet do Brasil às vezes bloqueia faixas de IP da Cloudflare. O `api.resend.com` tinha dois IPs: um bloqueado (`104.20.x`) e um livre (`172.66.x`). Solução em dev: fixar o IP livre no arquivo `hosts` do Windows. Em produção (Vercel) não há esse problema.

---

## Dicionário Rápido

| Termo | Significado simples |
|-------|-------------------|
| **Component** | Peça reutilizável da interface (botão, card, sidebar) |
| **Props** | Dados que você passa para um componente (como argumentos de função) |
| **State** | Dados que mudam dentro de um componente (ex: campo preenchido) |
| **Hook** | Função especial do React que começa com `use` (usePathname, useState) |
| **Schema** | Estrutura/formato esperado dos dados |
| **Migration** | Script que atualiza a estrutura do banco de dados |
| **Foreign Key** | Campo que aponta para um registro em outra tabela |
| **ORM** | Ferramenta que deixa você usar código em vez de SQL |
| **API Route** | Endpoint no servidor que o frontend pode chamar |
| **Server Action** | Função do servidor chamada diretamente do componente React |
| **Cookie** | Pequeno arquivo salvo no navegador (usado para sessão) |
| **Token** | Chave temporária que prova que você está autenticado |
| **Enum** | Lista de valores possíveis para um campo |
| **Type inference** | TypeScript deduz o tipo automaticamente a partir do código |
| **Environment variable** | Configuração externa ao código (senhas, URLs) |
| **Slug** | Versão de texto amigável para URL (ex: "Clínica ABC" → "clinica-abc") |

---

## 11. Conceitos das Fases 2 e 3 (Dashboard, Appointments e Booking)

### Server Actions
Funções que rodam **no servidor** mas são chamadas diretamente do código React, sem você criar uma API manualmente. Marcadas com `"use server"`.

```typescript
// src/app/booking/actions.ts
"use server";

export async function createAppointment(input) {
  const user = await getCurrentUser();   // roda no servidor, seguro
  if (!user) return { ok: false, needsAuth: true };
  // ... insere no banco
  return { ok: true, appointmentId: created.id };
}
```

No componente cliente, você chama como uma função normal — o Next.js cuida da comunicação:
```typescript
const result = await createAppointment({ clinicId, professionalId, date, startTime });
```

**Por que é seguro?** A lógica sensível (verificar login, inserir no banco) nunca vai para o navegador. O cliente só recebe o resultado.

### Fluxo de dados: Server Component → Client Component
```
Server Component (page.tsx)          Client Component (Widget.tsx)
  busca dados do banco        →        recebe via props
  (getCurrentUser, queries)            interage (cliques, estado)
                                       chama Server Actions
```

Exemplo real: a página da clínica (`[slug]/page.tsx`) é Server Component — busca a clínica e profissionais no banco. Passa os dados para o `BookingWidget` (Client Component), que gerencia a seleção de horário e chama a action.

### `revalidatePath` — atualizar o cache
Quando uma Server Action muda dados, o Next.js precisa saber para recarregar a página:
```typescript
await db.update(appointments).set({ status });
revalidatePath("/appointments");  // "essa página mudou, recarregue os dados"
```

### Algoritmo de slots (a lógica complexa)
Em `src/lib/booking.ts`, `getAvailableSlots` decide quais horários aparecem. Um slot está disponível quando **todas** as condições valem:
1. O dia da semana está nos dias de trabalho do profissional
2. Está dentro do horário de trabalho (excluindo o almoço)
3. Não há outra consulta já marcada naquele horário
4. Não é um horário no passado (se a data é hoje)

```
08:00 ✅  08:30 ✅  09:00 ❌(ocupado)  09:30 ✅
12:00 ⬜(almoço)  ...  13:00 ✅
```

### Proteção contra "double-booking"
Dois pacientes podem clicar no mesmo horário ao mesmo tempo. Por isso a action **re-verifica** se o slot ainda está livre antes de inserir:
```typescript
const conflict = await db.select()...where(mesmo profissional, data, horário, não cancelado);
if (conflict.length > 0) return { ok: false, error: "Esse horário acabou de ser ocupado." };
```

### Connection Pooler vs Conexão Direta (a saga do `.env.local`)
O Supabase oferece duas formas de conectar ao banco:

| | Conexão Direta | Connection Pooler |
|---|---|---|
| **Host** | `db.xxx.supabase.co` | `aws-1-sa-east-1.pooler.supabase.com` |
| **Porta** | 5432 | 5432 (session) ou 6543 (transaction) |
| **Rede** | IPv6 (muitas redes não têm) | IPv4 (funciona em qualquer lugar) |
| **Uso** | migrations locais | app em runtime |

**Lição aprendida:** o app deve usar o **pooler** (IPv4) no `DATABASE_URL`. A conexão direta falha com `ENOTFOUND` em redes IPv4. E a senha do pooler é a mesma "Database password" do projeto.

### `prepare: false`
O pooler em modo transaction não suporta "prepared statements" do Postgres. Por isso o `src/db/index.ts` usa `postgres(url, { prepare: false })`.

### Open Redirect (segurança no `?next=`)
Quando um paciente tenta agendar sem login, ele vai para `/auth/login?next=/booking/clinica`. Após logar, volta para onde estava. Mas validamos que `next` é um caminho interno, para evitar que um atacante redirecione para um site malicioso:
```typescript
const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
```
