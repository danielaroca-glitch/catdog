# Inativação de animal — Dev Spec

**Parent Feature**: `../../feature.md` (Registro de animais)
**Work-item**: local-only · **PBI**: pbi-003-inativacao-de-animal

## Scope

Inativar/reativar um animal (soft-delete via campo `active`) e o botão de admin que aciona isso. Ver `../../feature.md` para o problema/solução completos da feature.

**Decisão de mecanismo** (o próprio `pbi.md` deixou isso negociável): em vez de um endpoint dedicado (`POST /animals/:id/inativar`), esta PBI estende o `PATCH /animals/:id` já existente (`pbi-002`) para aceitar `active?: boolean` no corpo — mesma rota, mesmo `UpdateAnimalUseCase`, zero endpoint novo. Justificativa: RN-02 já trata inativação como "só um campo do animal", exatamente o que uma atualização parcial genérica já faz; um endpoint dedicado duplicaria guards/validação/e2e sem nenhum ganho de clareza.

## Out of Scope

| Item | Reason |
| --- | --- |
| Exclusão física de animal | Nunca faz parte do escopo desta feature (RN-02) |
| Endpoint dedicado de inativação | Decisão de mecanismo acima — reusa `PATCH /animals/:id` |
| Filtro "só ativos"/"só inativos" na listagem | Fora do CA desta PBI |

---

## Acceptance Criteria

Source: PBI artifact (`../pbi.md`, CA-01 a CA-04). Tratados como imutáveis.

1. INATIVACAO-01: WHEN um administrador autenticado envia `PATCH /animals/:id` com `active: false` para um animal ativo THEN o sistema SHALL marcá-lo inativo, mantendo o registro.
2. INATIVACAO-02: WHEN um administrador autenticado envia `PATCH /animals/:id` com `active: true` para um animal inativo THEN o sistema SHALL reativá-lo.
3. INATIVACAO-03: WHEN um administrador inativa um animal já inativo (ou reativa um já ativo) THEN o sistema SHALL responder com sucesso, sem erro nem estado inconsistente (idempotente).
4. INATIVACAO-04: WHEN um usuário não autenticado tenta inativar/reativar THEN o sistema SHALL rejeitar com erro de autenticação (reusa `JwtAuthGuard`).
5. INATIVACAO-05: WHEN um usuário autenticado sem papel admin tenta inativar/reativar THEN o sistema SHALL rejeitar com erro de autorização (reusa `RolesGuard`/`@Roles('admin')`).

## Edge Cases

- INATIVACAO-06: WHEN o admin clica em "Inativar"/"Reativar" na listagem THEN a tela SHALL atualizar o status exibido para aquele animal sem recarregar a página inteira.

---

## Cenários e2e

| ID | Requisitos verificados | Cenário |
| --- | --- | --- |
| E2E-01 | INATIVACAO-01, INATIVACAO-02 | Admin inativa um animal ativo, depois reativa — sucesso nas duas operações |
| E2E-02 | INATIVACAO-03 | Admin inativa um animal já inativo — sucesso, sem erro |
| E2E-03 | INATIVACAO-04, INATIVACAO-05 | Sem token e papel `adotante` — 401 e 403 |

**E2E-01 — Inativar e reativar**
- **Dado** um admin autenticado e um animal ativo
- **Quando** ele envia `PATCH /animals/:id` com `{ active: false }`, depois `{ active: true }`
- **Então** cada resposta é 200 refletindo o `active` correspondente

**E2E-02 — Idempotência**
- **Dado** um admin autenticado e um animal já inativo
- **Quando** ele envia `PATCH /animals/:id` com `{ active: false }` novamente
- **Então** recebe 200, `active` continua `false`

**E2E-03 — Autorização**
- **Dado** uma requisição sem token, e uma requisição de um usuário `adotante`
- **Quando** cada uma tenta `PATCH /animals/:id` com `{ active: false }`
- **Então** a primeira recebe 401 e a segunda recebe 403 (mesmo guard já validado em `pbi-002`, não repetimos os demais casos de auth aqui)

**Fora do e2e** — verificado por teste unitário/RTL:

| Requisito | Por que não é e2e |
| --- | --- |
| INATIVACAO-06 | Comportamento client-side puro (atualização de estado local) — unitário de componente já cobre |

---

## Requirement Traceability

| Requirement ID | Source | Phase | Status |
| --- | --- | --- | --- |
| INATIVACAO-01 | CA-01 (original) | T1, T2 | Verified |
| INATIVACAO-02 | CA-02 (original) | T1, T2 | Verified |
| INATIVACAO-03 | CA-03 (original) | T1 | Verified |
| INATIVACAO-04 | CA-04 (original) | T1 | Verified |
| INATIVACAO-05 | CA-04 (original) | T1 | Verified |
| INATIVACAO-06 | Edge case | T2 | Verified |

**ID format:** `INATIVACAO-NN`

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** 6 total, 6 mapped a `task.md`, 0 unmapped.

---

## Success Criteria

- [x] Todo CA (original + edge case) tem Requirement ID e mapeia para ao menos uma task
- [x] Todo Requirement ID que descreve um fluxo de usuário aparece em um cenário `E2E-NN`, ou na tabela "Fora do e2e" com o motivo
- [x] Nada aqui duplica o Problema/Solução do `feature.md` pai — só referencia
