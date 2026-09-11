# Edição de animal — Tasks

**Spec**: `spec.md` (same folder)
**Status**: Done — 6/6 tasks. Quality gate full: build/lint/testes ✅ (95 backend + 103 frontend), coverage ✅ (100% backend, 94-98% frontend nos arquivos alterados), complexidade ✅, Sonar ✅ (1 achado major encontrado e corrigido — ternário aninhado — 0 issues/duplicações novas, 95.9% coverage novo).

**Reuso**: `SpeciesService` (`services/backend/src/species/species.service.ts`), guards (`JwtAuthGuard`/`RolesGuard`), `AnimalsController`/`AnimalsModule` (extendidos, não recriados) — todos já existentes de `pbi-001-alta-de-animal`. Sem migration nova.

---

## Execution Plan

### Phase 1: Backend (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Frontend (Sequential — AD-004)

```
T3 → T4 → T5 → T6
```

---

## Task Breakdown

### T1: `UpdateAnimalDto` + `UpdateAnimalUseCase`

**What**: DTO de atualização parcial (`name?`, `species_id?`, ambos opcionais mas ao menos um obrigatório) + use case que valida a espécie (quando informada) via `SpeciesService.exists`, rejeita corpo vazio (EDICAO-09) e distingue "animal não encontrado" (404) de erro genérico.
**Where**: `services/backend/src/animals/dto/update-animal.dto.ts`, `services/backend/src/animals/use-cases/update-animal.use-case.ts`
**Depends on**: None (reusa `SpeciesService` já existente)
**Reuses**: `services/backend/src/animals/dto/create-animal.dto.ts` (padrão de DTO), `services/backend/src/animals/use-cases/create-animal.use-case.ts` (padrão de use case + `AnimalInsertResult`)
**Requirement**: EDICAO-01, EDICAO-02, EDICAO-03, EDICAO-04, EDICAO-07, EDICAO-09

**Tools**:
- MCP: NONE
- Skill: `makuco-backend`

**Done when**:
- [x] DTO aceita `name`/`species_id` opcionais, valida UUID quando `species_id` presente
- [x] Use case rejeita corpo sem nenhum campo (EDICAO-09), sem tocar o banco
- [x] Use case rejeita `species_id` inexistente (EDICAO-03), sem aplicar mudança
- [x] Use case distingue "0 linhas afetadas" (animal não existe, EDICAO-07) de erro genérico de banco
- [x] Gate check passes: `npm run test` (services/backend)
- [x] Test count: suíte cresce em pelo menos 6 testes, nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): adiciona UpdateAnimalUseCase`

---

### T2: `AnimalsController.update` (`PATCH /animals/:id`) + e2e

**What**: Handler `PATCH /animals/:id` no `AnimalsController` já existente (mesmos guards de classe), `@Param('id', ParseUUIDPipe)` para EDICAO-08. E2E cobrindo E2E-01 a E2E-05 de `spec.md`.
**Where**: `services/backend/src/animals/animals.controller.ts` (modifica), `services/backend/src/animals/animals.module.ts` (modifica — registra `UpdateAnimalUseCase`), `services/backend/test/animals-update.e2e-spec.ts`
**Depends on**: T1
**Reuses**: Guards/decorators já na classe `AnimalsController`; padrão de e2e de `services/backend/test/animals-create.e2e-spec.ts`
**Requirement**: EDICAO-01, EDICAO-02, EDICAO-03, EDICAO-04, EDICAO-05, EDICAO-06, EDICAO-07, EDICAO-08

**Tools**:
- MCP: NONE
- Skill: `makuco-backend`

**Done when**:
- [x] E2E-01, E2E-02, E2E-03, E2E-04, E2E-05 de `spec.md` implementados e passando contra o Supabase real
- [x] Gate check passes: `npm run test:e2e` (services/backend)
- [x] Test count: suíte e2e cresce em pelo menos 6 testes, nenhum teste removido

**Tests**: e2e (E2E-01, E2E-02, E2E-03, E2E-04, E2E-05)
**Gate**: full

**Commit**: `feat(backend): adiciona endpoint PATCH /animals/:id`

---

### T3: `ListAnimalsUseCase` + `AnimalsController.list` (`GET /animals`) + e2e

**What**: Handler `GET /animals` (gap confirmado, EDICAO-10) — lista todos os animais (id, name, species_id, active, created_at), mesmos guards admin-only.
**Where**: `services/backend/src/animals/use-cases/list-animals.use-case.ts`, `services/backend/src/animals/animals.controller.ts` (modifica), `services/backend/test/animals-list.e2e-spec.ts`
**Depends on**: T2
**Reuses**: Padrão de `SpeciesService.list()` (mesma forma: `select().order()`); guards já na classe `AnimalsController`
**Requirement**: EDICAO-10

**Tools**:
- MCP: NONE
- Skill: `makuco-backend`

**Done when**:
- [x] E2E-06 de `spec.md` implementado e passando contra o Supabase real
- [x] Gate check passes: `npm run test:e2e` (services/backend)
- [x] Test count: suíte e2e cresce em pelo menos 1 teste, nenhum teste removido

**Tests**: e2e (E2E-06)
**Gate**: full

**Commit**: `feat(backend): adiciona endpoint GET /animals`

---

### T4: `lib/api/animals.ts` — clients `updateAnimal` + `listAnimals`

**What**: Duas funções novas no cliente já existente: `updateAnimal(id, payload, accessToken)` (`PATCH /animals/:id`) e `listAnimals(accessToken)` (`GET /animals`).
**Where**: `services/frontend/src/lib/api/animals.ts` (modifica)
**Depends on**: T3
**Reuses**: `createAnimal`/`ApiError`/`extractErrorMessage` já existentes no mesmo arquivo
**Requirement**: EDICAO-01, EDICAO-10

**Tools**:
- MCP: NONE
- Skill: `makuco-frontend`

**Done when**:
- [x] `updateAnimal` envia PATCH com só os campos informados, propaga erro como `ApiError`
- [x] `listAnimals` retorna o array de animais, propaga erro como `ApiError`
- [x] Gate check passes: `npm run test` (services/frontend)
- [x] Test count: suíte cresce em pelo menos 4 testes, nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): adiciona clientes updateAnimal e listAnimals`

---

### T5: `AnimalForm` — modo de edição

**What**: Estende o `AnimalForm` já existente (T6 de `pbi-001`) para aceitar um modo de edição: recebe um animal existente (`animalToEdit`) para pré-preencher os campos e chamar `updateAnimal` em vez de `createAnimal` no submit.
**Where**: `services/frontend/src/components/animals/animal-form.tsx` (modifica)
**Depends on**: T4
**Reuses**: O próprio `AnimalForm` — extensão, não duplicação
**Requirement**: EDICAO-01, EDICAO-02

**Tools**:
- MCP: NONE
- Skill: `makuco-frontend`

**Done when**:
- [x] Com `animalToEdit` informado, os campos nascem preenchidos com os valores do animal
- [x] Submissão válida em modo edição chama `updateAnimal` (não `createAnimal`) e exibe confirmação
- [x] Modo criação (sem `animalToEdit`) continua funcionando exatamente como antes (regressão)
- [x] Gate check passes: `npm run test` (services/frontend)
- [x] Test count: suíte cresce em pelo menos 2 testes, nenhum teste removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(frontend): adiciona modo de edição ao AnimalForm`

---

### T6: Páginas `/admin/animais` (listagem) e `/admin/animais/[id]/editar`

**What**: Página de listagem (tabela simples: nome, espécie, status, link "Editar") consumindo `listAnimals` + `listSpecies` (para exibir o nome da espécie); página de edição consumindo o animal específico (via `listAnimals` + filtro pelo `id` da rota, já que não há `GET /animals/:id` nesta PBI) e renderizando `AnimalForm` em modo edição.
**Where**: `services/frontend/src/app/admin/animais/page.tsx`, `services/frontend/src/app/admin/animais/[id]/editar/page.tsx`
**Depends on**: T5
**Reuses**: `RequireRole` (proteção de rota, sem alteração); `AnimalForm` (T5)
**Requirement**: EDICAO-01, EDICAO-10

**Tools**:
- MCP: NONE
- Skill: `makuco-frontend`

**Done when**:
- [x] `/admin/animais` lista os animais cadastrados com link para editar cada um
- [x] `/admin/animais/[id]/editar` carrega o animal e renderiza `AnimalForm` pré-preenchido
- [x] Gate check passes: `npm run test` (services/frontend)
- [x] Test count: suíte cresce em pelo menos 2 testes, nenhum teste removido
- [x] `npm run build` (services/frontend) gera as duas rotas sem erro

**Tests**: unit
**Gate**: quick (build confirmado no fechamento da PBI)

**Commit**: `feat(frontend): adiciona páginas de listagem e edição de animal`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Sequential — AD-004, backend antes de frontend):
  T3 ──→ T4 ──→ T5 ──→ T6
```

Nenhuma task `[P]`: mesma razão de `pbi-001` — PBI pequena, cada task consome diretamente a anterior.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: UpdateAnimalDto + UpdateAnimalUseCase | 2 arquivos coesos (DTO+use case do mesmo endpoint) | ✅ OK (coeso) |
| T2: AnimalsController.update + e2e | 1 endpoint + seu teste | ✅ Granular |
| T3: ListAnimalsUseCase + AnimalsController.list + e2e | 1 endpoint + seu teste | ✅ Granular |
| T4: lib/api/animals.ts (2 funções) | 2 funções coesas do mesmo arquivo/domínio | ✅ OK (coeso) |
| T5: AnimalForm (modo edição) | 1 componente (extensão) | ✅ Granular |
| T6: 2 páginas (listagem + edição) | 2 páginas finas do mesmo fluxo | ✅ OK (coeso) |

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
| T1 | Backend — caso de uso/regra de negócio | unit | unit | ✅ OK |
| T2 | Backend — endpoint/controller | integration (e2e real) | e2e | ✅ OK |
| T3 | Backend — endpoint/controller | integration (e2e real) | e2e | ✅ OK |
| T4 | Frontend — cliente de API | unit | unit | ✅ OK |
| T5 | Frontend — componente | unit | unit | ✅ OK |
| T6 | Frontend — página | unit | unit | ✅ OK |
