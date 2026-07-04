# RLS Security Audit — MedBook

**Data:** 2026-07-04
**Status:** Correções aplicadas em `0001_rls_security_fixes.sql`

## Problemas Corrigidos

### 1. `triage_messages` SELECT sem filtro por clínica (CRÍTICO)

**Antes:** Admin de qualquer clínica podia ler mensagens de todas as sessões.

**Depois:** SELECT verifica se o admin é owner de uma clínica E se a mensagem pertence a uma sessão associada. Pacientes também podem ver suas próprias mensagens (por email).

### 2. `triage_sessions` SELECT/UPDATE sem escopo (CRÍTICO)

**Antes:** Qualquer clinic admin lia/atualizava todas as sessões de triagem.

**Depois:** Admin só vê sessões quando é owner de uma clínica. Pacientes veem apenas suas sessões (por email).

### 3. DELETE policies ausentes (MÉDIO)

**Antes:** Não era possível limpar dados antigos via RLS.

**Depois:** Adicionadas policies de DELETE para `triage_sessions`, `triage_messages` e `appointments` com verificação de ownership.

## Pendente — Revisão Manual

### `get_my_user_id()` (SECURITY DEFINER)

Essa função está marcada como `SECURITY DEFINER`, o que significa que roda com privilégios do owner (postgres). Se a função retorna `auth.uid()` corretamente, não há problema. Mas deve ser verificada:

```sql
-- Verificar definição da função
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'get_my_user_id';
```

**Esperado:** A função deve retornar o UID do token JWT atual, não de um usuário fixo.

### Rate Limiting para INSERT anônimo

`triage_sessions` e `triage_messages` permitem INSERT sem autenticação. Recomenda-se adicionar rate limiting no application layer (middleware ou API route) para prevenir abuse.

Sugestão: limitar a 5 sessões por IP por hora.

## Tabelas com RLS OK

| Tabela | Status | Observação |
|--------|--------|------------|
| `users` | ✓ | Policies corretas — user só vê/edita próprio perfil |
| `clinics` | ✓ | Leitura pública (intencional), mutação só owner |
| `professionals` | ✓ | Leitura pública (intencional), mutação só owner |
| `pre_anamnesis` | ✓ | Paciente controla, admin/professional leem |
| `appointments` | ✓ | Patient/owner/professional com escopo correto |

## Como Aplicar

```bash
# Gerar migration
pnpm db:generate

# Aplicar (CUIDADO: rode em staging primeiro)
pnpm db:migrate

# Ou via Supabase Dashboard > SQL Editor:
# Copie o conteúdo de 0001_rls_security_fixes.sql e execute
```
