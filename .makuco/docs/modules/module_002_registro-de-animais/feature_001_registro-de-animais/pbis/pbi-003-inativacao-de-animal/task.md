# Inativação de animal — Tasks

**Spec**: `spec.md` (same folder)
**Status**: Approved

**Reuso**: Estende `UpdateAnimalDto`/`UpdateAnimalUseCase`/`PATCH /animals/:id` já existentes (`pbi-002`) em vez de criar um endpoint novo — ver "Decisão de mecanismo" em `spec.md`.

---

## Execution Plan

### Phase 1: Backend (Sequential)

```
T1
```

### Phase 2: Frontend (Sequential — AD-004)

```
T1 → T2
```

---

## Task Breakdown

### T1: `active` em `UpdateAnimalDto`/`UpdateAnimalUseCase` + e2e

**What**: Adiciona `active?: boolean` (opcional) ao `UpdateAnimalDto` e ao payload de update do `UpdateAnimalUseCase` — nenhuma validação extra necessária (booleano simples, idempotente por natureza do `UPDATE` SQL). E2E cobrindo E2E-01 a E2E-03 de `spec.md`.
**Where**: `services/backend/src/animals/dto/update-animal.dto.ts` (modifica), `services/backend/src/animals/use-cases/update-animal.use-case.ts` (modifica), `services/backend/test/animals-inactivate.e2e-spec.ts`
**Depends on**: None (estende código já existente de `pbi-002`)
**Reuses**: `UpdateAnimalDto`/`UpdateAnimalUseCase`/`AnimalsController.update` inteiros — só adiciona um campo
**Requirement**: INATIVACAO-01, INATIVACAO-02, INATIVACAO-03, INATIVACAO-04, INATIVACAO-05

**Tools**:
- MCP: NONE
- Skill: `makuco-backend`

**Done when**:
- [ ] DTO aceita `active` opcional (`boolean`)
- [ ] Use case inclui `active` no payload de update quando informado
- [ ] E2E-01, E2E-02, E2E-03 de `spec.md` implementados e passando contra o Supabase real
- [ ] Gate check passes: `npm run test` + `npm run test:e2e` (services/backend)
- [ ] Test count: unit cresce em pelo menos 2 testes, e2e cresce em pelo menos 3 testes, nenhum teste removido

**Tests**: unit + e2e (E2E-01, E2E-02, E2E-03)
**Gate**: full

**Commit**: `feat(backend): adiciona campo active a UpdateAnimalDto/UseCase`

---

### T2: Botão inativar/reativar em `AnimalsListView`

**What**: Cada linha da tabela de `/admin/animais` ganha um botão "Inativar"/"Reativar" (conforme o status atual) que chama `updateAnimal(id, { active: !atual }, token)` e atualiza o status exibido na própria lista, sem recarregar a página (INATIVACAO-06).
**Where**: `services/frontend/src/components/animals/animals-list-view.tsx` (modifica)
**Depends on**: T1
**Reuses**: `updateAnimal` (já existente, `pbi-002`); estado local já mantido por `AnimalsListView`
**Requirement**: INATIVACAO-01, INATIVACAO-02, INATIVACAO-06

**Tools**:
- MCP: NONE
- Skill: `makuco-frontend`

**Done when**:
- [ ] Clicar em "Inativar" num animal ativo chama `updateAnimal` com `{ active: false }` e a linha passa a mostrar "Inativo"
- [ ] Clicar em "Reativar" num animal inativo chama `updateAnimal` com `{ active: true }` e a linha passa a mostrar "Ativo"
- [ ] Gate check passes: `npm run test` (services/frontend)
- [ ] Test count: suíte cresce em pelo menos 2 testes, nenhum teste removido
- [ ] `npm run build` (services/frontend) sem erro

**Tests**: unit
**Gate**: quick (build confirmado no fechamento da PBI)

**Commit**: `feat(frontend): adiciona botão de inativar/reativar animal`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1

Phase 2 (Sequential — AD-004):
  T1 ──→ T2
```

Nenhuma task `[P]` — PBI de 2 tasks, T2 depende diretamente de T1.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: active em DTO+UseCase+e2e | 1 campo, mesmo endpoint já existente | ✅ Granular |
| T2: botão inativar/reativar | 1 componente (extensão) | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Nenhuma seta de entrada | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend — caso de uso + endpoint existente | unit + integration (e2e real) | unit + e2e | ✅ OK |
| T2 | Frontend — componente | unit | unit | ✅ OK |
