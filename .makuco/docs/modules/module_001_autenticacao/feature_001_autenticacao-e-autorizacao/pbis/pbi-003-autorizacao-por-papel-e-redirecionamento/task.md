# Autorização por papel e redirecionamento pós-login — Tasks

**Spec**: `spec.md` (mesma pasta)
**Status**: Draft

---

## Execution Plan

### Phase 1: Fundação backend (Parallel OK)

```
T1 [P] ─┐
T2 [P] ─┴──→ (fase 2)
```

### Phase 2: RolesGuard (Sequential — depende de T1, T2)

```
T1, T2 ──→ T3
```

### Phase 3: Endpoints (Parallel OK — depende de T1/T2/T3)

```
T3 ──→ T4 [P]
T2 ──→ T5 [P]
T3 ──→ T6 [P]
```

### Phase 4: Frontend (Sequential — só começa após Fase 3, AD-004)

```
T4 ──→ T7 ──→ T8 ──→ T9
```

---

## Task Breakdown

### T1: ProfileRoleLookup [P]

**What**: Provider que lê o papel de um usuário em `profiles` (extraído de `RegisterUseCase.fetchProfileRole`, hoje privado e duplicável) — reusado pelo guard (T3) e pelo login estendido (T4).
**Where**: `services/backend/src/auth/profile-role.lookup.ts`, `services/backend/src/auth/profile-role.lookup.spec.ts`, `services/backend/src/auth/use-cases/register.use-case.ts` (modifica — passa a injetar e usar `ProfileRoleLookup` em vez do método privado), `services/backend/src/auth/use-cases/register.use-case.spec.ts` (modifica), `services/backend/src/auth/auth.module.ts` (modifica — registra o provider)
**Depends on**: None
**Reuses**: `SUPABASE_CLIENT` (singleton, service role) — mesma leitura admin que `RegisterUseCase` já fazia, não é auth de usuário final (DEC-02 não se aplica)
**Requirement**: AUTZ-03

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `ProfileRoleLookup.execute(userId)` retorna o `role` (`admin` | `adotante`) lido de `profiles`
- [x] Lança `InternalServerErrorException` genérica se a linha não existir (mesmo comportamento que `RegisterUseCase` já tinha)
- [x] `RegisterUseCase` usa o provider extraído; nenhum teste existente de `register.use-case.spec.ts` quebra

**Status**: ✅ Concluída — commit `76ce61c`. `UserRole` movido para `profile-role.lookup.ts` (mais fundacional). Quality gate per-task: Gate 0/1/3/4 PASS.

**Tests**: unit
**Gate**: quick

**Commit**: `refactor(backend): extrai ProfileRoleLookup de RegisterUseCase`

---

### T2: JwtAuthGuard [P]

**What**: Guard NestJS que extrai `Authorization: Bearer <token>`, verifica assinatura/expiração localmente com `jsonwebtoken` + `SUPABASE_JWT_SECRET` (sem round-trip ao Supabase), e anexa `request.user = { sub: string }` (o `user_id`). Lança `UnauthorizedException` (401) se o header faltar ou o token for inválido/expirado/malformado.
**Where**: `services/backend/src/auth/guards/jwt-auth.guard.ts`, `services/backend/src/auth/guards/jwt-auth.guard.spec.ts`, `services/backend/package.json` (adiciona `jsonwebtoken` + `@types/jsonwebtoken`)
**Depends on**: None
**Reuses**: `ConfigService` (mesmo padrão de `supabase.provider.ts` para ler env obrigatória)
**Requirement**: AUTZ-04, AUTZ-05

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] Sem header `Authorization` → `UnauthorizedException` (401)
- [x] Token malformado/assinatura inválida → `UnauthorizedException` (401), sem detalhe interno na mensagem
- [x] Token expirado → `UnauthorizedException` (401)
- [x] Token válido → `canActivate` retorna `true`, `request.user.sub` = `sub` do payload do JWT

**Status**: ✅ Concluída — commit `45b73d3`. `SUPABASE_JWT_SECRET` lido uma vez no construtor (fail-fast, mesmo padrão de `supabase.provider.ts`). Quality gate per-task: Gate 0/1/3/4 PASS. Nota: `npm audit` acusa 4 vulnerabilidades high pré-existentes na cadeia `multer`/`@nestjs` (transitiva, não relacionada a esta task) — registrado em `.makuco/STATE.md`, não corrigido aqui (fora de escopo).

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): adiciona JwtAuthGuard (verificação local de JWT)`

---

### T3: RolesGuard + @Roles()

**What**: Guard que lê os papéis exigidos via decorator `@Roles('admin')` (Reflector), busca o papel real do usuário (`ProfileRoleLookup`, usando `request.user.sub` que o `JwtAuthGuard` já populou) e lança `ForbiddenException` (403) se não bater. Endpoint sem `@Roles()` não é afetado (guard vira no-op).
**Where**: `services/backend/src/auth/guards/roles.guard.ts`, `services/backend/src/auth/guards/roles.guard.spec.ts`, `services/backend/src/auth/decorators/roles.decorator.ts`
**Depends on**: T1, T2
**Reuses**: `ProfileRoleLookup` (T1); `request.user.sub` populado por `JwtAuthGuard` (T2) — `RolesGuard` sempre roda DEPOIS de `JwtAuthGuard` na cadeia de guards do endpoint
**Requirement**: AUTZ-03, AUTZ-06

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] Endpoint sem `@Roles()` — guard permite qualquer usuário autenticado (no-op)
- [x] Endpoint com `@Roles('admin')`, usuário com papel `admin` — permite
- [x] Endpoint com `@Roles('admin')`, usuário com papel `adotante` — `ForbiddenException` (403)
- [x] Papel é lido via `ProfileRoleLookup` a cada `canActivate` — nunca cacheado entre requisições (AUTZ-03)

**Status**: ✅ Concluída — commit `9f1f1fb`. 5 testes (incl. um defensivo para `request.user` ausente, sem reimplementar verificação de JWT). Quality gate per-task: Gate 0/1/3/4 PASS. `RolesGuard` não registrado em nenhum controller ainda — wiring fica para T5/T6.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): adiciona RolesGuard e decorator @Roles`

---

### T4: LoginUseCase retorna o papel [P]

**What**: `LoginUseCase.execute` passa a incluir `role` no retorno (usa `ProfileRoleLookup`), para o frontend saber para onde redirecionar sem uma chamada extra.
**Where**: `services/backend/src/auth/use-cases/login.use-case.ts` (modifica), `services/backend/src/auth/use-cases/login.use-case.spec.ts` (modifica), `services/backend/src/auth/auth.controller.spec.ts` (modifica, se o shape de retorno do controller for verificado ali)
**Depends on**: T3 (usa `ProfileRoleLookup`, registrado no module junto com T1; ordem por T3 só por clareza de fase — dependência real é só T1, mas mantido na Fase 3 por já estarem os guards prontos e testados)
**Reuses**: `ProfileRoleLookup` (T1)
**Requirement**: AUTZ-01

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] Login bem-sucedido retorna `{ access_token, refresh_token, expires_in, role }`
- [x] `role` reflete o papel atual em `profiles` no momento do login

**Status**: ✅ Concluída — commit `5e6e011`. Quality gate per-task: Gate 0/1/3/4 PASS.

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): LoginUseCase retorna o papel do usuário`

---

### T5: GET /auth/me [P]

**What**: Endpoint autenticado (`JwtAuthGuard`, sem `@Roles()`) que retorna `{ id, email, role }` do usuário do token atual — usado por qualquer tela que precise reconfirmar o papel sem passar pelo login (ex. reload futuro, se a sessão em memória ainda existir).
**Where**: `services/backend/src/auth/auth.controller.ts` (modifica — novo método `me`), `services/backend/src/auth/auth.controller.spec.ts` (modifica), `services/backend/test/auth-me.e2e-spec.ts` (novo)
**Depends on**: T2
**Reuses**: `ProfileRoleLookup` (T1); `SUPABASE_CLIENT` para ler `email` via `auth.admin.getUserById` (mesmo cliente admin, operação de leitura)
**Requirement**: E2E-06 (AUTZ-04, AUTZ-05 via este endpoint)

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `GET /auth/me` com token válido retorna `{ id, email, role }` (200)
- [x] Sem token → 401 (E2E-06)
- [x] Token inválido/malformado → 401 (E2E-06)

**Status**: ✅ Concluída — commit `3c9f482` (merge `ca31f05`). **Achou e corrigiu um bug cross-cutting em `JwtAuthGuard` (T2)**: o guard original verificava HS256 local com `SUPABASE_JWT_SECRET`, mas o projeto Supabase assina com chave assimétrica (ES256/JWKS) — todo token real era rejeitado. Corrigido trocando para `supabase.auth.getClaims()` (método oficial do SDK, cobre HS256/ES256 automaticamente via WebCrypto contra o JWKS cacheado). Esse mesmo bug foi encontrado de forma independente por T6 (que aplicou um fix próprio via `jose`+JWKS manual); o fix de T5 (`getClaims`) foi adotado no lugar por não exigir dependência nova — ver commit de merge `ca31f05`. Quality gate per-task: Gate 0/1/3/4 PASS.

**Tests**: integration
**Gate**: full

**Commit**: `feat(backend): adiciona GET /auth/me`

---

### T6: GET /admin/ping (endpoint admin-only de demonstração) [P]

**What**: Endpoint mínimo (`JwtAuthGuard` + `RolesGuard`, `@Roles('admin')`) que só prova o mecanismo de autorização por papel — scaffolding reutilizável por módulos futuros que precisarem de um endpoint `admin`-only real (registro de animais, gestão de solicitações). Retorna `{ ok: true }`.
**Where**: `services/backend/src/admin/admin.controller.ts` (novo), `services/backend/src/admin/admin.module.ts` (novo), `services/backend/src/admin/admin.controller.spec.ts` (novo), `services/backend/test/admin-ping.e2e-spec.ts` (novo), `services/backend/src/app.module.ts` (modifica — importa `AdminModule`)
**Depends on**: T3
**Reuses**: `JwtAuthGuard` (T2), `RolesGuard`+`@Roles` (T3)
**Requirement**: AUTZ-02, AUTZ-03, AUTZ-06

**Tools**:
- Skill: `makuco-backend`

**Done when**:
- [x] `GET /admin/ping` com token de usuário `admin` → 200 `{ ok: true }` (E2E-05)
- [x] `GET /admin/ping` com token de usuário `adotante` → 403 (E2E-04)
- [x] `GET /admin/ping` sem token → 401 (E2E-06)

**Status**: ✅ Concluída — commit `f4e9fd3`. Foi o primeiro endpoint real a exercitar `JwtAuthGuard` (T2) contra um token de verdade — achou o bug cross-cutting HS256×ES256 documentado em T5 acima. Quality gate per-task: Gate 0/1/3/4 PASS.

**Tests**: e2e
**Gate**: full

**Commit**: `feat(backend): adiciona GET /admin/ping (endpoint admin-only de demonstração)`

---

### T7: SessionContext guarda o papel

**What**: `SessionContext`/`useSession` passam a guardar `role` junto dos tokens (mesmo padrão em memória, decisão da pbi-002 — nunca `localStorage`/`sessionStorage`).
**Where**: `services/frontend/src/lib/auth/session-context.tsx` (modifica), `services/frontend/src/lib/auth/session-context.test.tsx` (modifica)
**Depends on**: T4 (o shape de retorno do login precisa incluir `role` para este contexto fazer sentido)
**Reuses**: Estrutura de `SessionProvider`/`setSession` já existente (T7 da pbi-002)
**Requirement**: AUTZ-01

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [ ] `setSession({ ..., role })` guarda `role` no estado da sessão
- [ ] `session.role` acessível via `useSession()`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): SessionContext guarda o papel do usuário`

---

### T8: RequireRole + página de Acesso Negado

**What**: Componente `RequireRole` (client) que renderiza `children` se `session.role` bater com o papel exigido, senão renderiza a página de Acesso Negado (`DESIGN.md`: ícone neutro `{colors.muted-foreground}`, não `destructive`; `EXPERIENCE.md`: heading `<h1>` com foco automático, botão único "Voltar para minha área").
**Where**: `services/frontend/src/components/auth/require-role.tsx` (novo), `services/frontend/src/components/auth/require-role.test.tsx` (novo), `services/frontend/src/components/auth/access-denied.tsx` (novo), `services/frontend/src/components/auth/access-denied.test.tsx` (novo)
**Depends on**: T7
**Reuses**: `useSession` (T7); ícones/tokens já estabelecidos em `DESIGN.md` desta PBI e da pbi-001

**Requirement**: AUTZ-02

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [ ] `role` da sessão bate com o exigido → renderiza `children`
- [ ] `role` não bate (ou sessão ausente) → renderiza `AccessDenied`, nunca `children`
- [ ] `AccessDenied` tem `<h1>` com foco automático ao montar (Piso de Acessibilidade)
- [ ] Botão "Voltar para minha área" leva à rota do papel atual do usuário (`/cliente` ou `/admin`, conforme `session.role`) — se não houver sessão, leva a `/login`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): adiciona RequireRole e página de acesso negado`

---

### T9: Redirecionamento por papel + rotas placeholder

**What**: Rotas placeholder `/admin` e `/cliente` (cada uma envolvida por `RequireRole` com o papel correspondente); `LoginForm.submitViaLoginApi` troca o `router.push(HOME_ROUTE)` fixo (comentário `// TODO(pbi-003)`, ver `pbi-002`) por redirecionamento condicional a `/admin`/`/cliente` conforme `session.role` retornado no login.
**Where**: `services/frontend/src/app/admin/page.tsx` (novo), `services/frontend/src/app/cliente/page.tsx` (novo), `services/frontend/src/components/auth/login-form.tsx` (modifica — remove o TODO, usa `role`), `services/frontend/src/components/auth/login-form.test.tsx` (modifica), `services/frontend/src/components/auth/login-form.login-api.test.tsx` (modifica)
**Depends on**: T7, T8
**Reuses**: `RequireRole`/`AccessDenied` (T8); padrão de página fina já usado em `app/login/page.tsx`

**Requirement**: AUTZ-01, AUTZ-02

**Tools**:
- Skill: `makuco-frontend`

**Done when**:
- [ ] Login com `role: 'adotante'` → `router.push('/cliente')` (E2E-01)
- [ ] Login com `role: 'admin'` → `router.push('/admin')` (E2E-02)
- [ ] `/admin` acessado por sessão com `role: 'adotante'` renderiza `AccessDenied`, não o placeholder (E2E-03)
- [ ] `/cliente` acessado por sessão com `role: 'admin'` também é bloqueado por `RequireRole` (simetria — mesma regra nos dois sentidos)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): redireciona por papel e protege rotas /admin e /cliente`

---

## Parallel Execution Map

```
Fase 1 (Parallel):
  T1 [P]
  T2 [P]

Fase 2 (Sequential — após T1, T2):
  T3

Fase 3 (Parallel — após T3, e T2 para T5):
  T4 [P]
  T5 [P]
  T6 [P]

Fase 4 (Sequential — só após Fase 3, AD-004):
  T7 ──→ T8 ──→ T9
```

**Paralelismo**: T1/T2 não compartilham arquivo nem estado (T1 toca `register.use-case.ts`+novo `profile-role.lookup.ts`; T2 toca só o novo `jwt-auth.guard.ts`). T4/T5/T6 tocam arquivos diferentes (`login.use-case.ts` vs `auth.controller.ts` vs `admin/*` novo) — `app.module.ts` só é tocado por T6, sem conflito. T7→T8→T9 é sequencial no frontend porque cada um consome o anterior (contexto → componente de proteção → wiring das rotas).

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: ProfileRoleLookup | 1 provider + refactor de 1 use case | ✅ Granular |
| T2: JwtAuthGuard | 1 guard | ✅ Granular |
| T3: RolesGuard + decorator | 1 guard + 1 decorator, cohesivos | ✅ Granular |
| T4: LoginUseCase retorna papel | 1 modificação pontual | ✅ Granular |
| T5: GET /auth/me | 1 endpoint | ✅ Granular |
| T6: GET /admin/ping | 1 endpoint + module novo, cohesivos | ✅ Granular |
| T7: SessionContext + papel | 1 modificação pontual | ✅ Granular |
| T8: RequireRole + AccessDenied | 2 componentes, cohesivos (um não existe sem o outro) | ✅ Granular |
| T9: Redirecionamento + rotas | 2 páginas finas + 1 wiring, cohesivos (mesma feature de UX) | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (corpo) | Diagrama mostra | Status |
| --- | --- | --- | --- |
| T1 | None | Fase 1, sem seta de entrada | ✅ Match |
| T2 | None | Fase 1, sem seta de entrada | ✅ Match |
| T3 | T1, T2 | T1, T2 → T3 (Fase 2) | ✅ Match |
| T4 | T3 | T3 → T4 (Fase 3) — nota: dependência real é só T1, mantida em T3 por fase | ✅ Match |
| T5 | T2 | T2 → T5 (Fase 3) | ✅ Match |
| T6 | T3 | T3 → T6 (Fase 3) | ✅ Match |
| T7 | T4 | T4 → T7 (Fase 4) | ✅ Match |
| T8 | T7 | T7 → T8 (Fase 4) | ✅ Match |
| T9 | T7, T8 | T7, T8 → T9 (Fase 4) | ✅ Match |

Nenhuma task `[P]` depende de outra `[P]` na mesma fase (T1/T2 independentes; T4/T5/T6 cada uma depende só de fases anteriores, não umas das outras).

## Test Co-location Validation

| Task | Camada criada/modificada | Matriz exige | Task diz | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend — provider | unit | unit | ✅ OK |
| T2 | Backend — guard | unit | unit | ✅ OK |
| T3 | Backend — guard | unit | unit | ✅ OK |
| T4 | Backend — caso de uso | unit | unit | ✅ OK |
| T5 | Backend — endpoint/controller | integration | integration | ✅ OK |
| T6 | Backend — endpoint/controller (fluxo completo via HTTP) | integration | e2e | ✅ OK (e2e é o nível `full` do gate, cobre integration e mais — task explicitamente nomeia o cenário `E2E-NN`) |
| T7 | Frontend — contexto/hook | unit | unit | ✅ OK |
| T8 | Frontend — componente | unit | unit | ✅ OK |
| T9 | Frontend — integração de página/fluxo | unit | unit | ✅ OK |

Nenhuma violação.
