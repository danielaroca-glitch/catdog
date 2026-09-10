# Login e sessão com refresh token — Tasks

**Spec**: `spec.md` (mesma pasta)
**Status**: Draft

---

## Execution Plan

### Phase 1: Fundação backend (Parallel OK)

```
T1 [P] ─┐
T3 [P] ─┼──→ (fase 2)
T5 [P] ─┘
```

### Phase 2: Caso de uso de login (Sequential — depende de T1)

```
T1 ──→ T2
```

### Phase 3: Endpoints (Sequential — depende de T2, T3)

```
T2, T3 ──→ T4
```

### Phase 4: Fundação frontend (Parallel OK — só começa após Fase 3, AD-004)

```
T6 [P]
T7 [P]
```

### Phase 5: Integração frontend (Parallel OK — depende de T4, T6/T7)

```
T6, T4 ──→ T8
T7, T4 ──→ T9
```

---

## Task Breakdown

### T1: LoginDto [P]

**What**: DTO de login (email, senha) com validação via `class-validator`, mesmo padrão de `RegisterDto`.
**Where**: `services/backend/src/auth/dto/login.dto.ts`, `services/backend/src/auth/dto/login.dto.spec.ts`
**Depends on**: None
**Reuses**: `services/backend/src/auth/dto/register.dto.ts` (padrão de decorators)
**Requirement**: LOGIN-05

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `email` (`@IsEmail`), `senha` (`@IsNotEmpty`) validados
- [x] Payload inválido rejeitado pelo `ValidationPipe` global (400) antes de qualquer chamada ao Supabase

**Status**: ✅ Concluída — commit `ad0b0a2`. Quality gate per-task: Gate 0/1/4 PASS, Gate 3 SKIP (Docker indisponível) com checagem manual PASS. Nenhum achado bloqueante.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): adiciona LoginDto`

---

### T3: RefreshDto + RefreshUseCase [P]

**What**: DTO de refresh (`refresh_token`) e caso de uso que chama `supabase.auth.refreshSession({ refresh_token })`, propagando sucesso (novo par de tokens) ou falha (token reutilizado/inválido → 401).
**Where**: `services/backend/src/auth/dto/refresh.dto.ts`, `services/backend/src/auth/use-cases/refresh.use-case.ts`, `services/backend/src/auth/use-cases/refresh.use-case.spec.ts`
**Depends on**: None
**Reuses**: `SUPABASE_CLIENT` (`services/backend/src/supabase/supabase.provider.ts`) — mesmo client já usado por `RegisterUseCase`, sem key/config nova
**Requirement**: LOGIN-03, LOGIN-06

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `refreshSession()` bem-sucedido retorna `{ access_token, refresh_token, expires_in }`
- [x] `refreshSession()` com token já rotacionado/inválido lança `UnauthorizedException` (401) — não expõe detalhe interno do erro do Supabase
- [x] Não reimplementa lógica própria de rotação/família de token — só propaga o resultado nativo do Supabase (ver nota de arquitetura em `spec.md`)

**Status**: ✅ Concluída — commit `b396a6c`. `refresh.dto.ts` não recebeu `.spec.ts` dedicado (campo único com decorators padrão, sem lógica custom como o `@Match` de `RegisterDto`) — decisão razoável, não é uma lacuna. Quality gate per-task: Gate 0/1/4 PASS, Gate 3 SKIP (Docker indisponível) com checagem manual PASS. Nenhum achado bloqueante.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): adiciona RefreshUseCase`

---

### T5: Confirmar Refresh Token Rotation no dashboard Supabase [P]

**What**: Confirmar (manualmente, no dashboard) que "Refresh Token Rotation" + detecção de reuso está habilitada no projeto Supabase (Authentication → Sessions) — pré-condição operacional para LOGIN-03. Não é código.
**Where**: N/A (configuração externa ao repositório)
**Depends on**: None
**Reuses**: N/A
**Requirement**: LOGIN-03

**Tools**:
- Skill: NONE

**Done when**:
- [x] Usuário confirmou (em chat, com screenshot do dashboard) que "Detect and revoke potentially compromised refresh tokens" está habilitado e "Refresh token reuse interval" = 10s
- [x] E2E-05 (abaixo) passa — a falha inicial não era a configuração desligada; era o teste presumir reuso tolerado por tempo, quando na verdade (tokens v2 do GoTrue) a tolerância de 1 geração (`counterDifference == 1`) é incondicional e só o reuso de 2+ gerações, combinado com o intervalo de 10s sem refresh recente da sessão, é rejeitado — ver comentário de arquitetura em `auth-refresh.e2e-spec.ts`

**Tests**: none (não é código)
**Gate**: none

**Commit**: N/A (nenhuma mudança de código; confirmação registrada em `STATE.md`)

---

### T2: LoginUseCase

**What**: Caso de uso de login — chama `supabase.auth.signInWithPassword()`; distingue "e-mail não confirmado" (`EmailNotConfirmedException`) de credenciais inválidas (mensagem genérica, sem indicar qual campo está errado).
**Where**: `services/backend/src/auth/use-cases/login.use-case.ts`, `services/backend/src/auth/exceptions/email-not-confirmed.exception.ts`, `services/backend/src/auth/use-cases/login.use-case.spec.ts`
**Depends on**: T1
**Reuses**: `SUPABASE_CLIENT`; mesmo padrão de detecção de erro por `code`/mensagem de `RegisterUseCase` (ver `isEmailAlreadyExists`)
**Requirement**: LOGIN-01, LOGIN-02, LOGIN-04

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] Login com credenciais corretas de conta confirmada retorna `{ access_token, refresh_token, expires_in }`
- [x] Login com e-mail não confirmado lança `EmailNotConfirmedException` (mapeada para 403, com um código de erro que o frontend usa para mostrar a opção de reenvio — reaproveita o botão/cooldown já existente na tela de confirmação pendente da pbi-001)
- [x] Login com email ou senha incorretos lança `UnauthorizedException` com mensagem genérica ("E-mail ou senha incorretos."), idêntica para os dois casos

**Status**: ✅ Concluída — commit `3a1c50d`. `EmailNotConfirmedException` estende `ForbiddenException`, expõe `code` como propriedade da instância e no corpo da resposta (`{ code, message }`) via `super()`, para o frontend checar `response.body.code === 'email_not_confirmed'`. `isEmailNotConfirmed` segue o mesmo padrão de `isEmailAlreadyExists`/`RefreshUseCase` (checa `error.code`, fallback de regex na mensagem). Quality gate per-task: Gate 0/1/4 PASS (eslint teve 2 erros de formatação no spec, corrigidos via `--fix`), Gate 3 SKIP (Docker indisponível) com checagem manual PASS. Nenhum achado bloqueante.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): adiciona LoginUseCase`

---

### T4: Endpoints POST /auth/login e POST /auth/refresh

**What**: Adiciona os dois endpoints ao `AuthController`, registra `LoginUseCase`/`RefreshUseCase` em `AuthModule`, aplica rate limiting (`@Throttle`) em `/auth/login` (mesmo padrão de `/auth/register`, achado #2 da review da pbi-001).
**Where**: `services/backend/src/auth/auth.controller.ts` (modifica), `services/backend/src/auth/auth.controller.spec.ts` (modifica), `services/backend/src/auth/auth.module.ts` (modifica), `services/backend/test/auth-login.e2e-spec.ts` (novo), `services/backend/test/auth-refresh.e2e-spec.ts` (novo)
**Depends on**: T2, T3
**Reuses**: `ThrottlerModule` já registrado globalmente em `app.module.ts` (pbi-001); `configureApp()` para CORS/ValidationPipe nos testes e2e (mesmo padrão de `cors.e2e-spec.ts`/`trust-proxy.e2e-spec.ts`)
**Requirement**: LOGIN-01, LOGIN-02, LOGIN-03, LOGIN-04, LOGIN-06, LOGIN-08

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `POST /auth/login` — E2E-01 (sucesso), E2E-02 (e-mail não confirmado), E2E-03 (credenciais inválidas) passam contra o Supabase real
- [x] `POST /auth/refresh` — E2E-04 (refresh válido emite novo par) passa
- [x] E2E-05 (reuso de refresh token invalida a sessão) — passa. A falha original (201 em vez de 401) não era "Refresh Token Rotation" desabilitada (dashboard confirmado habilitado, ver T5) nem questão de tempo isolada: o teste presumia reuso tolerado por uma janela de tempo simples, mas o GoTrue (tokens v2) tolera incondicionalmente o reuso do token imediatamente anterior (`counterDifference == 1`, proteção contra perda de resposta de rede) — só rejeita reuso de 2+ gerações atrás, e mesmo assim só fora do "Refresh token reuse interval" (10s) contado a partir do último refresh da sessão. `auth-refresh.e2e-spec.ts` reescrito com uma rotação intermediária + espera de 12s após ela, não antes do reuso.
- [x] `@UseGuards(ThrottlerGuard)` + `@Throttle` em `/auth/login` (mesmo limite de `/auth/register`, 5/min) — E2E-06 (6ª tentativa em 60s recebe 429)
- [x] `/auth/refresh` **não** tem rate limiting (renovação automática legítima não deve esbarrar nisso)

**Status**: ✅ Concluída — commit `817f5cc` (endpoints) + fix de E2E-05 nesta sessão. Unit: 37/37 passando. E2E: 14/14 passando (`auth-refresh.e2e-spec.ts` corrigido). Quality gate per-task: Gate 0/1/4 PASS (eslint/prettier limpos no spec reescrito), Gate 3 SKIP (Docker indisponível) com checagem manual PASS (nenhuma migração/infra nova nesta task). Nenhum achado bloqueante aberto.

**Tests**: integration
**Gate**: full

**Commit**: `feat(backend): adiciona endpoints de login e refresh`

---

### T6: LoginForm + rota /login [P]

**What**: Componente de formulário de login (email, senha) e a rota `/login`, seguindo `DESIGN.md`/`EXPERIENCE.md` desta PBI (herdam tokens da pbi-001 — nenhuma decisão visual nova).
**Where**: `services/frontend/src/components/auth/login-form.tsx`, `services/frontend/src/components/auth/login-form.test.tsx`, `services/frontend/src/app/login/page.tsx`
**Depends on**: None
**Reuses**: Padrão de `register-form.tsx` (Field/Controller do shadcn, não o `Form` clássico); `Alert` neutro já usado em `confirmacao-pendente/page.tsx` para o aviso de e-mail não confirmado
**Requirement**: LOGIN-05 (validação client-side espelhando o DTO), estados de `EXPERIENCE.md` (envio em andamento, credenciais inválidas, e-mail não confirmado)

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [x] Campos email/senha; submit desabilitado enquanto algum campo está vazio (per `EXPERIENCE.md`)
- [x] Botão "Entrar" mostra spinner e desabilita durante o envio
- [x] Foco automático no campo email ao carregar (per `EXPERIENCE.md` — Primitivas de Interação)
- [x] Labels associados aos campos; erro anunciado via `aria-live="polite"` (Piso de Acessibilidade)

**Status**: ✅ Concluída — commit `d6479ca`. `LoginForm` segue o padrão de `register-form.tsx` (react-hook-form + `Controller`/`Field`/`FieldLabel`/`FieldError` do shadcn, zod schema espelhando `LoginDto`); aceita `onSubmit` opcional (testável sem `fetch`), integração real com `POST /auth/login` fica para T8. Rota `/login` é página fina, mesmo padrão de `confirmacao-pendente/page.tsx`. Nenhum token visual novo — reutiliza `Card`/`Button`/`Field*`/`text-destructive` já existentes. Unit: 4 novos testes (20/20 na suíte do frontend). Quality gate per-task: Gate 0/1/3/4 PASS.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): adiciona LoginForm e rota /login`

---

### T7: Contexto de sessão (tokens em memória) [P]

**What**: Contexto React que guarda `access_token`, `refresh_token` e `expires_at` **em memória** (não `localStorage`, per decisão do usuário) e expõe métodos para definir/limpar a sessão.
**Where**: `services/frontend/src/lib/auth/session-context.tsx`, `services/frontend/src/lib/auth/session-context.test.tsx`
**Depends on**: None
**Reuses**: N/A (primeira vez que a feature precisa de estado de sessão no frontend)
**Requirement**: Suporte a LOGIN-01 (armazenamento do resultado do login) e LOGIN-06/07 (o que o refresh scheduler atualiza)

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [x] `setSession({ access_token, refresh_token, expires_in })` e `clearSession()` funcionam
- [x] Nenhuma chamada a `localStorage`/`sessionStorage` — dado vive só em memória do contexto (perde-se em reload de página; aceitável para o escopo desta PBI, sem "lembrar sessão" declarado em nenhum CA)

**Status**: ✅ Concluída — commit `e8bf7c7`. `SessionProvider`/`useSession` (Context API + `useState`/`useCallback`/`useMemo`), shape de entrada espelha 1:1 `AuthenticatedSession`/`RefreshedSession` do backend para reuso direto por T8/T9; `useSession` fora do provider lança erro explícito. Unit: 7 novos testes (23/23 na suíte do frontend). Quality gate per-task: Gate 0/1/3/4 PASS (Gate 3 via `complexity-check` MCP/Docker, agora disponível).

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): adiciona contexto de sessão`

---

### T8: Conectar LoginForm à API [P]

**What**: `submit` do `LoginForm` chama `POST /auth/login` (nova função `loginUser` em `lib/api/auth.ts`), trata os 3 desfechos (sucesso → `setSession` + navega, e-mail não confirmado → alerta com reenvio, credenciais inválidas → erro genérico), injeta `Authorization: Bearer <access_token>` em requisições futuras via um wrapper de fetch simples.
**Where**: `services/frontend/src/lib/api/auth.ts` (modifica — adiciona `loginUser`), `services/frontend/src/lib/api/auth.test.ts` (modifica), `services/frontend/src/components/auth/login-form.tsx` (modifica)
**Depends on**: T6, T4
**Reuses**: `extractErrorMessage` já existente em `auth.ts` (pbi-001, já corrigido na review para tratar `message: string[]`); botão/cooldown de reenvio de `confirmacao-pendente/page.tsx`
**Requirement**: LOGIN-01, LOGIN-02, LOGIN-04

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [x] Sucesso: `setSession(...)` chamado com o resultado, navega para `/` (placeholder — redirecionamento real por papel é da pbi-003, comentário `// TODO(pbi-003)` no código apontando isso)
- [x] E-mail não confirmado (403 + código específico): mostra alerta neutro com opção de reenvio, sem tratar como erro genérico
- [x] Credenciais inválidas (401): mostra erro genérico, sem indicar qual campo
- [x] Teste mocka `global.fetch` diretamente (não o módulo `auth.ts` inteiro) — lição da review rodada 1 da pbi-001 (achado #4/cobertura real)

**Status**: ✅ Concluída — commit `095d0e0`. `loginUser`/`authenticatedFetch`/`ApiError` (com `code?`) em `auth.ts`, `extractErrorMessage` refatorado sobre `parseErrorBody` compartilhado sem mudar comportamento de `registerUser`. `LoginForm` conectado via `useSession`/`useRouter`. 12 testes novos (6 em `auth.test.ts`, 6 em `login-form.login-api.test.tsx`, novo arquivo espelhando `register-form.register-api.test.tsx`). Unit: 39/39 (na suíte do momento). Quality gate per-task: Gate 0/1/3/4 PASS.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): conecta LoginForm ao endpoint de login`

---

### T9: Renovação automática de sessão [P]

**What**: Agenda a renovação do token (via `POST /auth/refresh`) pouco antes do `expires_at`, atualiza o contexto de sessão com o novo par; se o refresh falhar (token reutilizado/inválido), limpa a sessão e redireciona para `/login` com a mensagem "Sua sessão expirou. Entre novamente." (per `EXPERIENCE.md`).
**Where**: `services/frontend/src/lib/auth/refresh-scheduler.ts`, `services/frontend/src/lib/auth/refresh-scheduler.test.ts`
**Depends on**: T7, T4
**Reuses**: `SessionContext` (T7); `loginUser`/padrão de chamada de `lib/api/auth.ts` (T8) para a chamada a `/auth/refresh`
**Requirement**: LOGIN-06, LOGIN-07

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [x] Agenda `setTimeout` para renovar antes de `expires_at` (com margem, ex. 60s antes)
- [x] Sucesso: contexto atualizado com novo par, próxima renovação reagendada
- [x] Falha (401 do backend): `clearSession()` chamado e usuário redirecionado a `/login?message=...` — **ressalva**: o texto vai como query string, mas nada em `login-form.tsx`/`app/login/page.tsx` lê esse parâmetro e exibe a mensagem na tela; hoje o usuário é redirecionado em silêncio, sem ver "Sua sessão expirou. Entre novamente." Isso não estava no "Where" de T9 (só `refresh-scheduler.ts`), então ficou de fora por escopo — mas deixa LOGIN-07 incompleto ponta a ponta. Ver nota abaixo do checklist.
- [x] Timer limpo ao desmontar (sem leak entre logout e novo login)

**Status**: ⚠️ Concluída com gap — commit `d16f006`. `useRefreshScheduler()` (hook headless), agenda 60s antes de `expires_at`, sucesso reagenda via `setSession`, falha limpa sessão e navega para `/login?message=...`. 4 testes novos (fake timers). Unit: 31/31 (no momento do commit). Quality gate per-task: Gate 0/1/3/4 PASS. **Gap aberto**: nenhuma task do PBI cobre exibir a mensagem de sessão expirada na tela de login — precisa de uma task nova (ex. T10) para `login-form.tsx`/`page.tsx` ler `searchParams.message` e renderizar um `Alert`, senão LOGIN-07 não é satisfeito de ponta a ponta apesar do checkbox acima.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): adiciona renovação automática de sessão`

---

## Parallel Execution Map

```
Fase 1 (Parallel):
  T1 [P]
  T3 [P]
  T5 [P]

Fase 2 (Sequential — após T1):
  T2

Fase 3 (Sequential — após T2, T3):
  T4

Fase 4 (Parallel — após T4, AD-004: backend antes de frontend):
  T6 [P]
  T7 [P]

Fase 5 (Parallel — após T4/T6/T7):
  T8 [P]
  T9 [P]
```

**Parallelismo**: T1/T3/T5 não compartilham arquivo nem estado. T6/T7 idem. T8/T9 tocam arquivos diferentes (`auth.ts`+`login-form.tsx` vs `refresh-scheduler.ts`) e ambos só leem `SessionContext` (T7) — sem escrita concorrente no mesmo módulo.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: LoginDto | 1 DTO | ✅ Granular |
| T3: RefreshDto + RefreshUseCase | 1 DTO + 1 caso de uso, cohesivos (mesmo endpoint) | ✅ Granular |
| T5: Confirmar rotation no dashboard | 1 verificação manual | ✅ Granular |
| T2: LoginUseCase | 1 caso de uso + 1 exceção companheira | ✅ Granular |
| T4: Endpoints login/refresh | 2 endpoints do mesmo controller, cohesivos | ✅ Granular |
| T6: LoginForm + rota | 1 componente + 1 página fina | ✅ Granular |
| T7: Contexto de sessão | 1 contexto | ✅ Granular |
| T8: Conectar LoginForm à API | 1 função de API + wiring do form | ✅ Granular |
| T9: Renovação automática | 1 módulo | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (corpo) | Diagrama mostra | Status |
| --- | --- | --- | --- |
| T1 | None | Fase 1, sem seta de entrada | ✅ Match |
| T3 | None | Fase 1, sem seta de entrada | ✅ Match |
| T5 | None | Fase 1, sem seta de entrada | ✅ Match |
| T2 | T1 | T1 → T2 (Fase 2) | ✅ Match |
| T4 | T2, T3 | T2, T3 → T4 (Fase 3) | ✅ Match |
| T6 | None | Fase 4, sem seta de entrada (só ordenada após Fase 3 por AD-004) | ✅ Match |
| T7 | None | Fase 4, sem seta de entrada | ✅ Match |
| T8 | T6, T4 | T6, T4 → T8 (Fase 5) | ✅ Match |
| T9 | T7, T4 | T7, T4 → T9 (Fase 5) | ✅ Match |

Nenhuma task `[P]` depende de outra `[P]` na mesma fase (T1/T3/T5 independentes; T6/T7 independentes; T8/T9 cada um depende de T4 + uma raiz de fase diferente, não um do outro).

## Test Co-location Validation

| Task | Camada criada/modificada | Matriz exige | Task diz | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend — DTO/validação | unit | unit | ✅ OK |
| T3 | Backend — DTO + caso de uso | unit | unit | ✅ OK |
| T5 | N/A — não é código | N/A | none | ✅ OK (não é um código layer da matriz) |
| T2 | Backend — caso de uso | unit | unit | ✅ OK |
| T4 | Backend — endpoint/controller | integration | integration | ✅ OK |
| T6 | Frontend — componente | unit | unit | ✅ OK |
| T7 | Frontend — contexto/hook | unit | unit | ✅ OK |
| T8 | Frontend — integração com API | unit | unit | ✅ OK |
| T9 | Frontend — módulo de sessão | unit | unit | ✅ OK |

Nenhuma violação — `Tests: none` usado só em T5, que não é código (matriz não se aplica).
