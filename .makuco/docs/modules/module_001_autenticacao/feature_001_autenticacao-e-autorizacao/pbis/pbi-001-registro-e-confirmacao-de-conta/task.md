# pbi-001 Tasks — Registro e confirmação de conta

**Spec**: `spec.md` (mesma pasta)
**Status**: Draft

Mapa stack→skill derivado do contexto do projeto (`.makuco/resources/tech_stack_context.md`, `sonar-project.properties`, estrutura `services/backend` + `services/frontend`) — `.makuco/docs/codebase/OVERVIEW.md` ainda não existe (greenfield, `makuco-project-research` não tem código para mapear), mas a divisão é inequívoca: `services/backend` (NestJS) = domínio backend, `services/frontend` (Next.js) = domínio frontend.

---

## Execution Plan

### Phase 1: Foundation (Parallel OK — projetos independentes)

```
T1 [P] ──┐
         ├──→ (Phase 2)
T2 [P] ──┘
```

### Phase 2: Backend core (Sequential)

```
T1 ──→ T3 ──→ T4
```

### Phase 3: Backend business logic

```
        ┌──→ T5 [P] ──┐
T1 ─────┤             ├──→ T6 ──→ T7
T4 ─────┘             │
                       └── (T5 depende só de T1)
```

### Phase 4: Frontend (Sequential — depende do backend pronto, AD-004)

```
T2 ──→ T8 [P] ──┐
T7 ─────────────┼──→ T9 ──→ T10
```

---

## Task Breakdown

### T1: Inicializar projeto NestJS em services/backend [P]

**What**: Scaffold do projeto NestJS (estrutura padrão, TypeScript, ESLint/Prettier, script de testes Jest já incluso pelo CLI do Nest).
**Where**: `services/backend/`
**Depends on**: None
**Reuses**: N/A (primeiro código do backend)
**Requirement**: N/A (infraestrutura de projeto, não uma CA)

**Tools**:
- MCP: `context7` (docs NestJS atualizadas, se necessário)
- Skill: `makuco-backend`

**Done when**:
- [x] `services/backend` contém um projeto NestJS válido (`nest new` ou equivalente), com `package.json`, scripts `start`, `test`, `build`
- [x] `npm run build` executa sem erros

**Status**: ✅ Concluída — commit `47dfcab`. Nota: pinado `@nestjs/cli@11` (não a última v12) para manter o template clássico Jest+ESLint, já que o v12 default mudou para Vitest+oxlint (Node ≥22), divergindo de `.makuco/docs/codebase/testing.md`.

**Tests**: none (scaffolding puro)
**Gate**: build

**Commit**: `chore(backend): inicializa projeto NestJS`

---

### T2: Inicializar projeto Next.js em services/frontend [P]

**What**: Scaffold do projeto Next.js (App Router, TypeScript, Tailwind, shadcn/ui inicializado per `DESIGN.md`).
**Where**: `services/frontend/`
**Depends on**: None
**Reuses**: N/A (primeiro código do frontend)
**Requirement**: N/A (infraestrutura de projeto)

**Tools**:
- MCP: `context7` (docs Next.js/shadcn atualizadas)
- Skill: `makuco-frontend`

**Done when**:
- [x] `services/frontend` contém um projeto Next.js válido com Tailwind e shadcn/ui inicializados
- [x] `npm run build` executa sem erros

**Status**: ✅ Concluída — commit `438d7c5`. Next.js 16 + shadcn CLI 4.21 (preset `base-nova`, base-ui/react em vez de Radix — anotado para as tasks de frontend seguintes). Tokens de marca aplicados em `globals.css` (Tailwind v4 CSS-first, sem `tailwind.config.js`).

**Tests**: none (scaffolding puro)
**Gate**: build

**Commit**: `chore(frontend): inicializa projeto Next.js + shadcn/ui`

---

### T3: Configurar client Supabase no backend

**What**: Módulo/provider NestJS que expõe o client Supabase (admin/service role) configurado a partir de variáveis de ambiente.
**Where**: `services/backend/src/supabase/supabase.module.ts` (+ `supabase.provider.ts`)
**Depends on**: T1
**Reuses**: N/A
**Requirement**: N/A (infraestrutura — habilita REG-02/03)

**Tools**:
- MCP: `context7` (SDK Supabase)
- Skill: `makuco-backend`

**Done when**:
- [x] Client Supabase instanciado a partir de env vars próprias (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) lidas de `.env` via `ConfigService`
- [x] `.env.example` criado documentando as variáveis (sem valores reais)
- [x] Módulo exportável e injetável em outros módulos do Nest

**Status**: ✅ Concluída — commit `cac4b97`. Nota: `SUPABASE_JWT_SECRET` carregado em `.env` mas ainda não consumido por este provider — só é necessário para validar JWTs de usuário (PBI 2), não para o client admin desta tarefa.

**Tests**: unit (teste do provider com env vars mockadas)
**Gate**: quick

**Commit**: `feat(backend): configura client Supabase`

---

### T4: Migration da tabela `profiles` + trigger de criação automática

**What**: Migration SQL criando a tabela `profiles` (id, user_id FK para `auth.users`, role, created_at) e um trigger/function no Supabase que insere a linha em `profiles` com `role = 'adotante'` sempre que um novo usuário é criado em `auth.users`.
**Where**: `services/backend/supabase/migrations/{timestamp}_create_profiles.sql`
**Depends on**: T3
**Reuses**: N/A
**Requirement**: REG-02 (parte de "criar automaticamente uma linha em profiles")

**Tools**:
- MCP: `context7` (Supabase triggers/RLS)
- Skill: `makuco-backend`

**Done when**:
- [x] Tabela `profiles` criada com colunas `id`, `user_id` (FK, unique), `role` (enum/text: `admin`/`adotante`), `created_at`
- [x] Trigger em `auth.users` (`AFTER INSERT`) cria a linha em `profiles` com `role = 'adotante'`
- [x] Migration aplicada com sucesso no projeto Supabase do CatDog (rodada manualmente pelo usuário no SQL Editor, versão idempotente)

**Status**: ✅ Concluída — commit `e88c9e6`. Teste de integração (`test/profiles-trigger.e2e-spec.ts`) passou contra o projeto Supabase real. Efeito colateral corrigido nesta mesma tarefa: `supabase.provider.ts` precisou de um `transport: ws` explícito no client (Node 20 não tem WebSocket nativo, exigido pelo realtime-js do supabase-js) — teste unitário de T3 atualizado de acordo.

**Tests**: integration (teste que cria um usuário via Supabase Auth admin API e verifica a linha criada em `profiles`)
**Gate**: full

**Commit**: `feat(backend): migration da tabela profiles com trigger de signup`

---

### T5: DTO de registro com validação (senha, confirmação, formato de e-mail) [P]

**What**: `RegisterDto` com `class-validator` — nome obrigatório, e-mail válido, senha mínima 8 caracteres, confirmação de senha igual à senha.
**Where**: `services/backend/src/auth/dto/register.dto.ts`
**Depends on**: T1
**Reuses**: N/A
**Requirement**: REG-01, REG-07

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] Validação rejeita senha/confirmação diferentes (REG-01)
- [x] Validação rejeita senha com menos de 8 caracteres (REG-07)
- [x] Validação rejeita e-mail em formato inválido

**Status**: ✅ Concluída — commit `6be5e69`. 10/10 testes passando (5 novos + 5 pré-existentes). `ValidationPipe` global adicionado em `main.ts` (infra reusável pelas próximas tasks).

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): valida DTO de registro`

---

### T6: RegisterUseCase (Supabase signUp + tratamento de e-mail duplicado e falha de profile)

**What**: Caso de uso que chama `supabase.auth.admin.createUser`/`signUp`, trata erro de e-mail já existente sem revelar estado de confirmação (REG-05), e garante consistência caso a criação da linha em `profiles` falhe após o signup (REG-08).
**Where**: `services/backend/src/auth/use-cases/register.use-case.ts`
**Depends on**: T3, T4, T5
**Reuses**: `SupabaseModule` (T3)
**Requirement**: REG-02, REG-05, REG-08

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] Signup bem-sucedido retorna o usuário criado, papel `adotante` confirmado via consulta a `profiles`
- [x] E-mail duplicado retorna erro genérico, sem indicar se a conta existente está confirmada (REG-05)
- [x] Falha simulada na criação da linha em `profiles` (mock) é tratada sem deixar usuário órfão (REG-08)

**Status**: ✅ Concluída — commit `3f0435c`. 15/15 testes passando. Detecção de e-mail duplicado via `error.code === 'email_exists'` (+ fallback regex). REG-08: sem rollback manual necessário — o trigger de DB é transacional com o insert em `auth.users`, documentado no código.

**Tests**: unit (client Supabase mockado)
**Gate**: quick

**Commit**: `feat(backend): implementa RegisterUseCase`

---

### T7: AuthController.register (POST /auth/register) + testes de integração

**What**: Endpoint que recebe `RegisterDto`, chama `RegisterUseCase`, retorna 201 em sucesso e os erros apropriados (400 validação, 409 e-mail duplicado). Cobre também o aviso de falha de envio de e-mail (REG-09).
**Where**: `services/backend/src/auth/auth.controller.ts`
**Depends on**: T5, T6
**Reuses**: `RegisterDto` (T5), `RegisterUseCase` (T6)
**Requirement**: REG-01, REG-02, REG-03, REG-04, REG-05, REG-09 (E2E-01, E2E-02, E2E-03 na camada de API)

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `E2E-01` (fluxo feliz) passa via Supertest: 201, papel `adotante`, e-mail de confirmação disparado
- [x] `E2E-02` (senhas diferentes) passa: 400 com mensagem clara
- [x] `E2E-03` (e-mail duplicado) passa: 409 com mensagem genérica
- [x] REG-09 documentado como limitação conhecida (não bloqueante) — ver nota abaixo

**Status**: ✅ Concluída — commit `109b84b`. 18 unit + 5 e2e testes passando (contra o projeto Supabase real). **REG-09**: Supabase Admin API não expõe se o envio do e-mail de confirmação falhou — documentado com `[NOTA]` no código em vez de inventar um mecanismo de sinalização não especificado. Revisitar se/quando a API expuser esse sinal.

**Tests**: integration (Jest + Supertest) — implementa E2E-01, E2E-02, E2E-03 de `spec.md`
**Gate**: full

**Commit**: `feat(backend): endpoint POST /auth/register`

---

### T8: RegisterForm component com validação client-side [P]

**What**: Formulário de registro (nome, email, senha, confirmação) usando shadcn/ui `Form`/`Input`, validação client-side (senhas coincidem, e-mail válido, senha ≥ 8 caracteres) — conforme `DESIGN.md`/`EXPERIENCE.md` da PBI.
**Where**: `services/frontend/src/components/auth/register-form.tsx`
**Depends on**: T2
**Reuses**: componentes shadcn `Form`, `Input`, `Button`, `Card` (tokens de `DESIGN.md`)
**Requirement**: REG-01, REG-06, REG-07

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [x] Exibe "As senhas não coincidem" no blur/submit quando aplicável (REG-01)
- [x] Bloqueia submit com e-mail em formato inválido (REG-06)
- [x] Bloqueia submit com senha < 8 caracteres (REG-07)
- [x] Segue `DESIGN.md`/`EXPERIENCE.md` da PBI (Card centralizado, botão `{colors.primary}`, erros `{colors.destructive}`)

**Status**: ✅ Concluída — commit `9d5ee57`. 4/4 testes. **Achado importante**: o preset `base-nova` do shadcn não tem mais o componente `Form` clássico — usa `Field`/`FieldError`/`Controller` (react-hook-form) em seu lugar. Anotado para T9/T10 seguirem o mesmo padrão.

**Tests**: unit (Jest + React Testing Library)
**Gate**: quick

**Commit**: `feat(frontend): componente RegisterForm com validação`

---

### T9: Conectar RegisterForm à API de registro

**What**: Submit handler que chama `POST /auth/register`, trata erro 409 (e-mail duplicado, REG-05) exibindo mensagem apropriada, e redireciona para a tela de confirmação pendente em caso de sucesso.
**Where**: `services/frontend/src/components/auth/register-form.tsx` (modifica), `services/frontend/src/lib/api/auth.ts` (novo)
**Depends on**: T8, T7
**Reuses**: `RegisterForm` (T8)
**Requirement**: REG-02, REG-05

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [x] Submit bem-sucedido redireciona para `/registro/confirmacao-pendente`
- [x] Erro 409 exibe mensagem de e-mail já cadastrado
- [x] Estado de loading (spinner no botão) durante o request

**Status**: ✅ Concluída — commit `236a9f3`. 9/9 testes (4 T8 + 5 novos). **Achado**: backend e frontend colidiam na porta 3000 por default — resolvido com `PORT=3001` em `services/backend/.env`/`.env.example` (commit `5dbd024`), consistente com o `NEXT_PUBLIC_API_URL` default assumido pelo frontend.

**Tests**: unit (RTL, fetch mockado)
**Gate**: quick

**Commit**: `feat(frontend): conecta RegisterForm à API`

---

### T10: Tela de Confirmação pendente

**What**: Página que exibe o alerta de sucesso ("Enviamos um e-mail de confirmação para {email}") e o botão "Reenviar confirmação" com cooldown, conforme `EXPERIENCE.md`.
**Where**: `services/frontend/src/app/registro/confirmacao-pendente/page.tsx`
**Depends on**: T9
**Reuses**: componente de alerta shadcn (`{colors.success-sage}` de `DESIGN.md`)
**Requirement**: REG-03, REG-04, REG-09

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [x] Exibe o e-mail informado no registro
- [x] Botão de reenvio com cooldown (desabilitado por um período curto após cada clique)
- [x] Segue `EXPERIENCE.md` (Voz e Tom, estado de sucesso)

**Status**: ✅ Concluída — commit `2d791d9`. 12/12 testes (9 pré-existentes + 3 novos). Email agora viaja via query string (`?email=`) do T9 até esta tela — ajuste retroativo documentado no commit. REG-09: botão de reenvio hoje só reinicia o cooldown visual, sem chamada real de API (endpoint de reenvio não existe ainda — fora do escopo desta feature).

**Tests**: unit (RTL)
**Gate**: quick

**Commit**: `feat(frontend): tela de confirmação pendente`

---

## Parallel Execution Map

```
Phase 1 (Parallel):
  T1 [P] ── (backend)
  T2 [P] ── (frontend)

Phase 2 (Sequential, backend):
  T1 → T3 → T4

Phase 3 (backend, parcialmente paralelo):
  T1 → T5 [P] ──┐
  T4 ───────────┼──→ T6 → T7

Phase 4 (frontend, após backend — AD-004):
  T2 → T8 [P] ──┐
  T7 ───────────┼──→ T9 → T10
```

**Parallelismo:**
- T1/T2: independentes entre si, mesma fase.
- T5: depende só de T1 (não de T3/T4), pode rodar em paralelo à Fase 2 — mas T6 aguarda tanto T4 quanto T5.
- T8: depende só de T2, pode ser preparado em paralelo ao backend, mas T9 aguarda T7 (AD-004 — backend antes de frontend na integração real).

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Inicializar NestJS | 1 scaffold | ✅ Granular |
| T2: Inicializar Next.js | 1 scaffold | ✅ Granular |
| T3: Client Supabase | 1 módulo | ✅ Granular |
| T4: Migration profiles | 1 migration + trigger | ✅ Granular |
| T5: RegisterDto | 1 arquivo/classe | ✅ Granular |
| T6: RegisterUseCase | 1 caso de uso | ✅ Granular |
| T7: AuthController.register | 1 endpoint | ✅ Granular |
| T8: RegisterForm | 1 componente | ✅ Granular |
| T9: Conectar RegisterForm à API | 1 função (submit handler + client de API) | ✅ Granular |
| T10: Tela de confirmação pendente | 1 página | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (corpo) | Diagrama mostra | Status |
| --- | --- | --- | --- |
| T1 | None | Fase 1, sem seta de entrada | ✅ Match |
| T2 | None | Fase 1, sem seta de entrada | ✅ Match |
| T3 | T1 | T1 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T1 | T1 → T5 (Fase 3) | ✅ Match |
| T6 | T3, T4, T5 | T4 → T6, T5 → T6 | ✅ Match |
| T7 | T5, T6 | T6 → T7 | ✅ Match |
| T8 | T2 | T2 → T8 | ✅ Match |
| T9 | T8, T7 | T8 → T9, T7 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |

Nenhuma task `[P]` depende de outra `[P]` na mesma fase (T1/T2 independentes; T5/T8 cada um depende só de uma raiz de fase diferente).

## Test Co-location Validation

| Task | Camada criada/modificada | Matriz exige | Task diz | Status |
| --- | --- | --- | --- | --- |
| T1 | Scaffold (nenhuma lógica) | none | none | ✅ OK |
| T2 | Scaffold (nenhuma lógica) | none | none | ✅ OK |
| T3 | Backend — provider/config | unit | unit | ✅ OK |
| T4 | Backend — migration/trigger (DB) | integration | integration | ✅ OK |
| T5 | Backend — DTO/validação | unit | unit | ✅ OK |
| T6 | Backend — caso de uso | unit | unit | ✅ OK |
| T7 | Backend — endpoint/controller | integration | integration | ✅ OK |
| T8 | Frontend — componente | unit | unit | ✅ OK |
| T9 | Frontend — integração com API | unit | unit | ✅ OK |
| T10 | Frontend — página | unit | unit | ✅ OK |

Nenhuma violação — `Tests: none` usado apenas em T1/T2, onde a matriz também diz `none` (scaffolding puro).
