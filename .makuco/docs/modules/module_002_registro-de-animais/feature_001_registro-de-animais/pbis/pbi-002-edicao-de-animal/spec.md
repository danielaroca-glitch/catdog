# Edição de animal — Dev Spec

**Parent Feature**: `../../feature.md` (Registro de animais)
**Work-item**: local-only · **PBI**: pbi-002-edicao-de-animal

## Scope

Endpoint administrativo para editar um animal existente (nome e/ou espécie) e a tela mínima de admin que o consome — incluindo, por gap identificado e confirmado com o usuário, uma listagem de animais (`GET /animals` + página `/admin/animais`), já que nenhuma feature do roadmap prevê como o admin descobre qual animal editar. Essa listagem é reusada pela próxima PBI (`pbi-003-inativacao-de-animal`).

## Out of Scope

| Item | Reason |
| --- | --- |
| Upload/gestão de foto do animal | Mesmo escopo de `pbi-001-alta-de-animal` |
| CRUD de espécies | Módulo futuro "Registro de espécies" (DEC-02) |
| Inativação/reativação de animal | PBI própria (`pbi-003-inativacao-de-animal`) — a listagem aqui só linka para edição |
| Filtros/busca na listagem de animais | Fora do CA desta PBI; listagem é simples, sem paginação/filtro |

---

## Acceptance Criteria

Source: PBI artifact (`../pbi.md`, CA-01 a CA-05). Tratados como imutáveis — normalizados aqui.

1. EDICAO-01: WHEN um administrador autenticado envia uma atualização de nome e/ou espécie para um animal existente THEN o sistema SHALL aplicar a mudança e retornar o animal atualizado.
2. EDICAO-02: WHEN a atualização informa uma espécie válida (existente na tabela de espécies) THEN o sistema SHALL trocar a espécie associada.
3. EDICAO-03: WHEN a atualização informa uma espécie que não existe na tabela THEN o sistema SHALL rejeitar com erro claro, sem aplicar nenhuma mudança.
4. EDICAO-04: WHEN o animal alvo está inativo THEN o sistema SHALL permitir a edição normalmente (RN-02).
5. EDICAO-05: WHEN um usuário não autenticado tenta editar um animal THEN o sistema SHALL rejeitar com erro de autenticação (reusa `JwtAuthGuard`).
6. EDICAO-06: WHEN um usuário autenticado sem papel admin tenta editar um animal THEN o sistema SHALL rejeitar com erro de autorização (reusa `RolesGuard`/`@Roles('admin')`).

## Edge Cases

- EDICAO-07: WHEN o `id` do animal na URL é um UUID válido mas não corresponde a nenhum animal THEN o sistema SHALL responder 404.
- EDICAO-08: WHEN o `id` do animal na URL não é um UUID bem-formado THEN o sistema SHALL responder 400 (via `ParseUUIDPipe`, nível de framework).
- EDICAO-09: WHEN a atualização não informa nenhum campo (nem `name` nem `species_id`) THEN o sistema SHALL rejeitar com erro de validação — nada a atualizar.
- EDICAO-10 (gap confirmado com o usuário): WHEN um administrador consulta a lista de animais THEN o sistema SHALL retornar todos os animais (id, name, species_id, active), para que a tela de edição (e a futura tela de inativação, `pbi-003`) tenham como descobrir qual animal referenciar.

## Cenários e2e

| ID | Requisitos verificados | Cenário |
| --- | --- | --- |
| E2E-01 | EDICAO-01, EDICAO-02 | Admin edita nome e espécie de um animal existente — sucesso |
| E2E-02 | EDICAO-03 | Admin tenta trocar para espécie inexistente — 400, nada muda |
| E2E-03 | EDICAO-05, EDICAO-06 | Sem token e papel `adotante` — 401 e 403 |
| E2E-04 | EDICAO-04 | Admin edita um animal já inativo — sucesso |
| E2E-05 | EDICAO-07 | Admin edita um id inexistente (UUID válido) — 404 |
| E2E-06 | EDICAO-10 | Admin lista os animais cadastrados — recebe todos com seus campos |

**E2E-01 — Edição com sucesso**
- **Dado** um admin autenticado e um animal + duas espécies já seedadas
- **Quando** ele envia `PATCH /animals/:id` com novo `name` e novo `species_id`
- **Então** recebe 200 com o animal atualizado refletindo as mudanças

**E2E-02 — Espécie inexistente**
- **Dado** um admin autenticado e um animal existente
- **Quando** ele envia `PATCH /animals/:id` com um `species_id` que não existe
- **Então** recebe 400 e o animal permanece com os dados originais

**E2E-03 — Autorização**
- **Dado** uma requisição sem token, e uma requisição de um usuário `adotante`
- **Quando** cada uma tenta `PATCH /animals/:id`
- **Então** a primeira recebe 401 e a segunda recebe 403

**E2E-04 — Edição de animal inativo**
- **Dado** um admin autenticado e um animal com `active: false`
- **Quando** ele envia `PATCH /animals/:id` com um novo `name`
- **Então** recebe 200 com o `name` atualizado, `active` permanece `false`

**E2E-05 — Id inexistente**
- **Dado** um admin autenticado
- **Quando** ele envia `PATCH /animals/:id` com um UUID válido que não corresponde a nenhum animal
- **Então** recebe 404

**E2E-06 — Listagem**
- **Dado** um admin autenticado e ao menos um animal cadastrado
- **Quando** ele envia `GET /animals`
- **Então** recebe 200 com um array incluindo esse animal

**Fora do e2e** — verificado por teste unitário:

| Requisito | Por que não é e2e |
| --- | --- |
| EDICAO-08 | Comportamento de framework (`ParseUUIDPipe`) — já coberto pelos testes do próprio Nest; não repetimos aqui |
| EDICAO-09 | Regra de validação pura no use case, sem travessia de camada — unitário já cobre |

---

## Requirement Traceability

| Requirement ID | Source | Phase | Status |
| --- | --- | --- | --- |
| EDICAO-01 | CA-01 (original) | T1, T2, T5 | Verified |
| EDICAO-02 | CA-02 (original) | T1, T2, T5 | Verified |
| EDICAO-03 | CA-03 (original) | T1, T2 | Verified |
| EDICAO-04 | CA-04 (original) | T1, T2 | Verified |
| EDICAO-05 | CA-05 (original) | T2 | Verified |
| EDICAO-06 | CA-05 (original) | T2 | Verified |
| EDICAO-07 | Edge case | T1, T2 | Verified |
| EDICAO-08 | Edge case | T2 | Verified |
| EDICAO-09 | Edge case | T1 | Verified |
| EDICAO-10 | Gap confirmado com o usuário | T3, T4, T6 | Verified |

**ID format:** `EDICAO-NN`

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** 10 total, 10 mapped a `task.md`, 0 unmapped.

---

## Success Criteria

- [x] Todo CA (original + edge cases) tem Requirement ID e mapeia para ao menos uma task
- [x] Todo Requirement ID que descreve um fluxo de usuário aparece em um cenário `E2E-NN`, ou na tabela "Fora do e2e" com o motivo
- [x] Nada aqui duplica o Problema/Solução do `feature.md` pai — só referencia
