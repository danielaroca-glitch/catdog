# Alta de animal — Tasks

**Spec**: `spec.md` (same folder)
**Status**: Approved

**Convenção de nomenclatura**: identificadores técnicos (tabelas, colunas, rotas, código) em inglês, mesmo padrão já usado em `profiles`/`role`/`user_id` (módulo de Autenticação) — vocabulário de negócio (espécie/animal) fica em PT-BR nos artefatos e na UI.

---

## Execution Plan

### Phase 1: Schema (Sequential)

```
T1
```

### Phase 2: Backend domain (Sequential — cada um consome o anterior)

```
T1 → T2 → T3 → T4
```

### Phase 3: Frontend (Sequential — AD-004, backend antes de frontend)

```
T4 → T5 → T6
```

---

## Task Breakdown

### T1: Migration — tabelas `species` e `animals`

**What**: Cria a migration SQL com as tabelas `species` (id, name, created_at) e `animals` (id, name, species_id FK, active default true, created_at), RLS habilitado em ambas (sem policy permissiva — todo acesso passa pela API NestJS com a service-role key, mesmo padrão de acesso do `profiles`), e um seed inicial de 4-5 espécies comuns (ex.: Cachorro, Gato, Ave, Outro).
**Where**: `services/backend/supabase/migrations/20260910190000_create_species_and_animals.sql`
**Depends on**: None
**Reuses**: Padrão de `services/backend/supabase/migrations/20260907120000_create_profiles.sql` (idempotente, RLS, comentário de cabeçalho)
**Requirement**: ALTA-01, ALTA-02, ALTA-03

**Tools**:
- MCP: NONE
- Skill: `makuco-backend` (per `gap-routing.md`)

**Done when**:
- [ ] Arquivo SQL criado, idempotente (`if not exists` / `on conflict do nothing` no seed)
- [ ] `species.name` único; `animals.species_id` com FK `references species(id)`; `animals.active` `not null default true`
- [ ] Usuário aplicou a migration manualmente no SQL Editor do Supabase (dependência externa confirmada com o usuário — ver `spec.md`)

**Tests**: none — camada de schema, sem tipo de teste definido em `testing.md`; validada indiretamente pelos testes e2e de T4, depois de aplicada.
**Gate**: none (arquivo SQL, sem código TypeScript a compilar/testar nesta task)

**Status**: ✅ Done — migration aplicada manualmente pelo usuário no SQL Editor do Supabase, confirmada pelo e2e de T4 rodando contra o banco real. Commit: `70bf2ca` (bundlado com T4 por conveniência de staging).

---

### T2: `SpeciesService.exists`

**What**: Serviço que verifica se um `species_id` existe na tabela `species` — reusável por esta PBI e por `pbi-002-edicao-de-animal` (RN-04 se aplica às duas).
**Where**: `services/backend/src/species/species.service.ts`, `services/backend/src/species/species.module.ts`
**Depends on**: T1 (schema)
**Reuses**: Padrão de injeção de `SUPABASE_CLIENT` já usado em `ProfileRoleLookup` (`services/backend/src/auth/profile-role.lookup.ts`)
**Requirement**: ALTA-03

**Tools**:
- MCP: NONE
- Skill: `makuco-backend`

**Done when**:
- [ ] `SpeciesService.exists(speciesId: string): Promise<boolean>` implementado
- [ ] Gate check passes: `npm run test` (services/backend)
- [ ] Test count: suíte cresce em pelo menos 2 testes (existe / não existe), nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): adiciona SpeciesService.exists`

**Status**: ✅ Done — 3/3 testes unit passando. Commit: `da0d8f6`.

---

### T3: `CreateAnimalDto` + `CreateAnimalUseCase`

**What**: DTO de criação (`name` obrigatório, `species_id` obrigatório e UUID válido) + use case que valida a espécie via `SpeciesService.exists` antes de persistir o animal com `active: true`.
**Where**: `services/backend/src/animals/dto/create-animal.dto.ts`, `services/backend/src/animals/use-cases/create-animal.use-case.ts`
**Depends on**: T2
**Reuses**: Padrão de DTO com `class-validator` de `services/backend/src/auth/dto/login.dto.ts`; padrão de use case de `services/backend/src/auth/use-cases/login.use-case.ts`
**Requirement**: ALTA-01, ALTA-02, ALTA-03, ALTA-06, ALTA-07

**Tools**:
- MCP: NONE
- Skill: `makuco-backend`

**Done when**:
- [ ] DTO rejeita `name` vazio/ausente (ALTA-06) e `species_id` mal formado (ALTA-07) via `class-validator`
- [ ] Use case rejeita `species_id` inexistente com uma exceção clara (ALTA-03), sem persistir nada
- [ ] Use case persiste o animal com `active: true` em caso de sucesso (ALTA-01, ALTA-02)
- [ ] Gate check passes: `npm run test` (services/backend)
- [ ] Test count: suíte cresce em pelo menos 5 testes, nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): adiciona CreateAnimalUseCase`

**Status**: ✅ Done — 8/8 testes unit passando (DTO + use case). Commit: `785825f`.

---

### T4: `AnimalsController` + `AnimalsModule` + e2e

**What**: `POST /animals` atrás de `JwtAuthGuard` + `RolesGuard`/`@Roles('admin')` (nível de classe, mesma lição do `AdminController`), retornando o animal criado; módulo registrado em `AppModule`. Inclui o e2e real cobrindo E2E-01/02/03 de `spec.md`.
**Where**: `services/backend/src/animals/animals.controller.ts`, `services/backend/src/animals/animals.module.ts`, `services/backend/src/app.module.ts` (modifica), `services/backend/test/animals-create.e2e-spec.ts`
**Depends on**: T3
**Reuses**: Padrão de guards de `services/backend/src/admin/admin.controller.ts` (`@Roles('admin')` na classe); padrão de e2e real de `services/backend/test/admin-ping.e2e-spec.ts` (cria usuário admin + adotante, login real)
**Requirement**: ALTA-01, ALTA-02, ALTA-03, ALTA-04, ALTA-05

**Tools**:
- MCP: NONE
- Skill: `makuco-backend`

**Done when**:
- [ ] E2E-01, E2E-02, E2E-03 de `spec.md` implementados e passando contra o Supabase real (migration de T1 já aplicada)
- [ ] Gate check passes: `npm run test:e2e` (services/backend)
- [ ] Test count: suíte e2e cresce em pelo menos 4 testes (sucesso, sem espécie, espécie inexistente, sem token, papel errado), nenhum teste removido

**Tests**: e2e (E2E-01, E2E-02, E2E-03)
**Gate**: full

**Commit**: `feat(backend): adiciona endpoint POST /animals`

**Status**: ✅ Done — E2E-01/02/03 (5 testes) passando contra o Supabase real. Aproveitado para exportar `ProfileRoleLookup` de `AuthModule` (evita uma 3ª instância duplicada, como em `AdminModule`). Commit: `70bf2ca`.

---

### T5: `lib/api/animals.ts` — client `createAnimal`

**What**: Função `createAnimal` que chama `POST /animals` com o token da sessão atual, espelhando o contrato do backend (T4).
**Where**: `services/frontend/src/lib/api/animals.ts`
**Depends on**: T4
**Reuses**: Padrão de `services/frontend/src/lib/api/auth.ts` (`ApiError`, tratamento de resposta)
**Requirement**: ALTA-01

**Tools**:
- MCP: NONE
- Skill: `makuco-frontend`

**Done when**:
- [ ] `createAnimal` envia `name`+`species_id`, propaga erro 400/401/403 como `ApiError`
- [ ] Gate check passes: `npm run test` (services/frontend)
- [ ] Test count: suíte cresce em pelo menos 3 testes (sucesso, 400, 401/403), nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): adiciona cliente createAnimal`

**Status**: ✅ Done — 3/3 testes unit passando. Commit: `d403f37`. Adicionado `GET /species` (fora do plano original) + cliente `listSpecies` para o formulário de T6 poder listar espécies — ver nota em T6.

---

### T6: `AnimalForm` + página `/admin/animais/novo`

**What**: Formulário de cadastro (nome + seleção de espécie) reusando primitivas shadcn/ui, mesmo padrão visual de `RegisterForm`/`LoginForm`; página server component em `/admin/animais/novo` protegida por `RequireRole role="admin"` (já existente).
**Where**: `services/frontend/src/components/animals/animal-form.tsx`, `services/frontend/src/app/admin/animais/novo/page.tsx`
**Depends on**: T5
**Reuses**: `services/frontend/src/components/auth/register-form.tsx` (padrão de formulário com `react-hook-form`+`zod`); `services/frontend/src/components/auth/require-role.tsx` (proteção de rota, sem alteração)

**Requirement**: ALTA-08

**Tools**:
- MCP: NONE
- Skill: `makuco-frontend`

**Done when**:
- [ ] Submeter sem campo obrigatório exibe erro de validação e não chama `createAnimal` (ALTA-08)
- [ ] Submissão válida chama `createAnimal` (T5) e exibe confirmação
- [ ] Gate check passes: `npm run test` (services/frontend)
- [ ] Test count: suíte cresce em pelo menos 3 testes, nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): adiciona formulário de cadastro de animal`

**Status**: ✅ Done — 2/2 testes unit passando. Gap identificado durante a implementação e confirmado com o usuário: o plano original não previa como o formulário saberia quais espécies existem — resolvido com um `GET /species` novo (backend) + `listSpecies` (frontend), fora do escopo original das 6 tasks. Seletor implementado com `<select>` nativo, não Radix `Select` (`components/ui/select.tsx`, gerado via shadcn e depois removido) — trava em jsdom mesmo com polyfills de `hasPointerCapture`/`scrollIntoView`. Commit: `c5cfb19`.

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1

Phase 2 (Sequential — cada task consome a anterior):
  T1 ──→ T2 ──→ T3 ──→ T4

Phase 3 (Sequential — AD-004, backend antes de frontend):
  T4 ──→ T5 ──→ T6
```

Nenhuma task marcada `[P]`: a PBI é pequena (6 tasks) e cada uma consome diretamente a anterior — não há trabalho genuinamente independente a paralelizar sem criar acoplamento artificial.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Migration species+animals | 1 arquivo SQL | ✅ Granular |
| T2: SpeciesService.exists | 1 serviço | ✅ Granular |
| T3: CreateAnimalDto + CreateAnimalUseCase | 2 arquivos coesos (DTO+use case do mesmo endpoint) | ✅ OK (coeso) |
| T4: AnimalsController + módulo + e2e | 1 endpoint + seu wiring | ✅ Granular |
| T5: lib/api/animals.ts | 1 função de API | ✅ Granular |
| T6: AnimalForm + página | 1 componente + 1 página que só o renderiza | ✅ OK (coeso) |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Nenhuma seta de entrada | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Schema (SQL, sem camada NestJS) | Não coberto pela matrix | none | ✅ OK |
| T2 | Backend — serviço | unit | unit | ✅ OK |
| T3 | Backend — caso de uso/regra de negócio | unit | unit | ✅ OK |
| T4 | Backend — endpoint/controller (fluxo completo via HTTP) | integration (e2e real, mesmo padrão já usado no projeto) | e2e | ✅ OK |
| T5 | Frontend — cliente de API | unit | unit | ✅ OK |
| T6 | Frontend — componente | unit | unit | ✅ OK |
