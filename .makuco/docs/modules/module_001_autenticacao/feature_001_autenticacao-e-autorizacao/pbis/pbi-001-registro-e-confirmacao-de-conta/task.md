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

## Correções da Review — Rodada 1 (achados bloqueantes)

Tasks adicionadas após `review.md` rodada 1 (veredito NECESSITA CORREÇÕES). Não são novos requisitos REG-NN — são correções de achados #1 (critical) e #2 (major) do review. Independentes entre si (arquivos distintos), podem rodar em paralelo.

### T11: Habilitar CORS no backend [P]

**What**: `bootstrap()` em `main.ts` passa a chamar `app.enableCors()`, liberando a origem do frontend, para que o `fetch` do navegador (bloqueado hoje) funcione de verdade.
**Where**: `services/backend/src/main.ts`, `services/backend/.env` / `.env.example` (nova var `FRONTEND_URL`)
**Depends on**: None
**Reuses**: N/A
**Requirement**: Achado #1 (critical) de `review.md` rodada 1

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' })` chamado antes de `app.listen`
- [x] `FRONTEND_URL` documentada em `.env.example` (sem valor real)
- [x] Teste de integração comprova que a resposta inclui o header `Access-Control-Allow-Origin` correto

**Status**: ✅ Concluída — commit `ef24a84`. `configureApp` extraído para `src/configure-app.ts` (não em `main.ts`) porque `main.ts` executa `bootstrap()` como efeito colateral no escopo do módulo — importar dele para o teste subiria um segundo servidor real e colidiria de porta (`EADDRINUSE`), achado durante a própria implementação. (Nota histórica: T11 e T12 rodaram em paralelo sem isolamento de worktree e foram commitados juntos por engano em `c775898`; esse commit foi desfeito via `git reset --soft` e reaplicado como dois commits limpios — este é um deles. Lição registrada em `.makuco/STATE.md`.)

**Tests**: integration (Supertest — request com header `Origin` simulando o frontend, assert no header de resposta)
**Gate**: full

**Commit**: `fix(backend): habilita CORS para a origem do frontend`

---

### T12: Rate limiting no endpoint de registro [P]

**What**: Adiciona `@nestjs/throttler` e aplica um guard de rate limit em `POST /auth/register`, para impedir criação em massa de contas e sondagem de e-mails via respostas 409 repetidas.
**Where**: `services/backend/src/app.module.ts` (registra `ThrottlerModule` globalmente), `services/backend/src/auth/auth.controller.ts` (ou guard global — decisão da implementação)
**Depends on**: None
**Reuses**: N/A
**Requirement**: Achado #2 (major) de `review.md` rodada 1

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `@nestjs/throttler` instalado e configurado (limite razoável, ex.: 5 requisições/minuto por IP)
- [x] `POST /auth/register` retorna 429 ao exceder o limite
- [x] Demais endpoints não ficam bloqueados pelo mesmo limite (guard aplicado só no endpoint via `@UseGuards`/`@Throttle`, não globalmente via `APP_GUARD`)

**Status**: ✅ Concluída — commit `1195afc`. (Nota histórica: T11 e T12 rodaram em paralelo sem isolamento de worktree e ambos fizeram `git add`/commit quase ao mesmo tempo no mesmo working tree, misturando os dois no mesmo commit `c775898` por engano; esse commit foi desfeito via `git reset --soft` e reaplicado como dois commits limpios — este é um deles. Lição registrada em `.makuco/STATE.md` para usar `isolation: worktree` da próxima vez que tasks paralelas envolverem commits.)

**Tests**: integration (Supertest — N+1 requisições rápidas ao endpoint, assert 429 na última)
**Gate**: full

**Commit**: `fix(backend): adiciona rate limiting ao endpoint de registro`

---

## Correções da Review — Rodada 2 (achado bloqueante)

Task adicionada após `review.md` Rodada de revisão 2 (veredito NECESSITA CORREÇÕES). Não é um novo requisito REG-NN — é a correção do achado #1 (major) da rodada 2, exposto pela própria correção de T12 (rate limiting).

### T13: Documentar decisão de trust proxy no rate limiting

**What**: `ThrottlerGuard` identifica o cliente por `req.ip`, que sem `app.set('trust proxy', ...)` reflete o IP do proxy (não do cliente real) atrás de qualquer reverse proxy/load balancer, colapsando todos os usuários no mesmo balde de rate limit. Decisão do usuário: **não configurar trust proxy agora** — este projeto ainda não tem nenhuma topologia de deploy definida. Documentar essa decisão explicitamente (não deixar a ausência de config parecer um descuido) em `configure-app.ts`, provar por teste que `req.ip` resolve corretamente o IP do socket direto (cenário sem proxy, que é o único cenário real hoje — dev local), e registrar a decisão em `STATE.md` para ser revisitada quando a infra real for definida.
**Where**: `services/backend/src/configure-app.ts` (comentário de decisão, sem chamada a `app.set('trust proxy', ...)`), `.makuco/STATE.md` (registro da decisão)
**Depends on**: None
**Reuses**: N/A
**Requirement**: Achado #1 (major) de `review.md` Rodada de revisão 2

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] Comentário em `configure-app.ts` explica a decisão: sem proxy confiável conhecido hoje, `trust proxy` não é configurado; a decisão deve ser revisitada quando uma topologia de deploy real for definida (referenciando o achado #1 da rodada 2 e este registro em STATE.md)
- [x] Teste de integração comprova que, numa conexão direta (sem proxy), o `ThrottlerGuard`/`req.ip` identifica corretamente o IP do socket do cliente (cenário atual do projeto) — `test/trust-proxy.e2e-spec.ts`, comprovando adicionalmente que um `X-Forwarded-For` forjado não é confiável (não contorna o rate limit)
- [x] `.makuco/STATE.md` registra a decisão (sem proxy confiável hoje; revisitar na PBI de infra/deploy)

**Tests**: integration (Supertest — requisições diretas sem header `X-Forwarded-For`, comprovando que o tracker do throttler resolve o IP do socket)
**Gate**: full

**Status**: ✅ Concluída — commit `c359e61`. Quality gate per-task (escopo `per-task`): Gate 0 PASS, Gate 1 PASS (reaproveitado do build+lint), Gate 3 SKIP (Docker indisponível) com checagem manual PASS, Gate 4 PASS. Nenhum achado bloqueante.

**Commit**: `docs(backend): documenta decisão de não configurar trust proxy (achado #1 rodada 2)`

---

## Correções da Review — Rodada 3 (achado bloqueante)

Task adicionada após `review.md` Rodada de revisão 3 (veredito NECESSITA CORREÇÕES). Não é um novo requisito REG-NN — é a correção do achado #1 (major) da rodada 3. Tratada como quick-mode (1 arquivo, sem nova dependência, sem decisão de design).

### T14: Fazer o teste de trust proxy exercitar `configureApp()`

**What**: `test/trust-proxy.e2e-spec.ts` montava a app de teste manualmente (`app.useGlobalPipes(new ValidationPipe())`) em vez de chamar `configureApp(app)` — provava o comportamento default do Express/Nest, não a configuração real de produção, não travando uma futura regressão dentro de `configureApp()`.
**Where**: `services/backend/test/trust-proxy.e2e-spec.ts`
**Depends on**: None
**Reuses**: `configureApp` (já existe em `services/backend/src/configure-app.ts`)
**Requirement**: Achado #1 (major) de `review.md` Rodada de revisão 3

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `test/trust-proxy.e2e-spec.ts` importa e chama `configureApp(app)` no `beforeAll`, no mesmo ponto de `test/cors.e2e-spec.ts` (antes de `app.init()`), em vez de montar `ValidationPipe` manualmente
- [x] Teste continua passando com a mesma asserção (429 na 6ª tentativa com `X-Forwarded-For` forjado)

**Status**: ✅ Concluída — commit `b766162`. Quality gate per-task (escopo `per-task`): Gate 0 PASS, Gate 1 PASS (reaproveitado do build+lint), Gate 3 SKIP (Docker indisponível) com checagem manual PASS, Gate 4 PASS. Nenhum achado bloqueante.

**Tests**: integration (mesmo teste de `test/trust-proxy.e2e-spec.ts`, agora exercitando `configureApp()` real)
**Gate**: full

**Commit**: `fix(backend): faz o teste de trust proxy exercitar configureApp() real`

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
| T13: Documentar decisão de trust proxy | 1 decisão documentada + 1 teste | ✅ Granular |

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
| T13 | None | Task isolada, sem diagrama próprio (correção pontual de review) | ✅ Match |

Nenhuma task `[P]` depende de outra `[P]` na mesma fase (T1/T2 independentes; T5/T8 cada um depende só de uma raiz de fase diferente). T13 é independente e não roda em paralelo com nada (task única desta rodada).

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
| T13 | Backend — configuração de bootstrap | integration | integration | ✅ OK |

Nenhuma violação — `Tests: none` usado apenas em T1/T2, onde a matriz também diz `none` (scaffolding puro).
