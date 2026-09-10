# Alta de animal — Dev Spec

**Parent Feature**: `../../feature.md` (Registro de animais)
**Work-item**: local-only · **PBI**: pbi-001-alta-de-animal

## Scope

Endpoint administrativo para cadastrar um novo animal (nome + espécie obrigatória, vinda de uma tabela própria seedada) e a tela mínima de admin que o consome. Ver `../../feature.md` para o problema/solução completos da feature.

## Out of Scope

| Item | Reason |
| --- | --- |
| Upload/gestão de foto do animal | Não pedido por nenhum CA; fora do escopo IN de `feature.md` |
| CRUD de espécies (criar/editar/inativar espécie) | Módulo futuro "Registro de espécies" (DEC-02 de `decisions.md`) — aqui a tabela só é lida, nunca escrita pelo admin |
| Edição/Inativação de animal | PBIs próprias (`pbi-002-edicao-de-animal`, `pbi-003-inativacao-de-animal`) |
| Vitrine pública (listar/filtrar animais) | Módulo futuro "Lista pública de animais disponíveis" |

---

## Acceptance Criteria

Source: PBI artifact (`../pbi.md`, CA-01 a CA-04) da `makuco-analisar`. Tratados como imutáveis — normalizados aqui, não re-derivados.

1. ALTA-01: WHEN um administrador autenticado envia nome + dados básicos + uma espécie existente na tabela de espécies THEN o sistema SHALL criar o animal, persistir status ativo, e retornar confirmação de sucesso com o registro criado.
2. ALTA-02: WHEN a requisição de criação não informa espécie THEN o sistema SHALL rejeitar com erro de validação claro, sem persistir nenhum registro.
3. ALTA-03: WHEN a requisição informa uma espécie que não existe na tabela de espécies THEN o sistema SHALL rejeitar com erro claro, sem persistir nenhum registro.
4. ALTA-04: WHEN um usuário não autenticado tenta criar um animal THEN o sistema SHALL rejeitar com erro de autenticação (reusa `JwtAuthGuard`, nenhum mecanismo novo).
5. ALTA-05: WHEN um usuário autenticado sem papel admin tenta criar um animal THEN o sistema SHALL rejeitar com erro de autorização (reusa `RolesGuard`/`@Roles('admin')`, nenhum mecanismo novo).

## Edge Cases

Surfaced while writing this spec — not present no CA original.

- ALTA-06: WHEN o nome do animal é vazio/ausente THEN o sistema SHALL rejeitar a criação com erro de validação (campo obrigatório).
- ALTA-07: WHEN `especie_id` não é um UUID bem-formado THEN o sistema SHALL rejeitar com erro de validação, sem consultar o banco com um valor malformado.
- ALTA-08: WHEN o admin submete o formulário sem preencher um campo obrigatório THEN a tela SHALL exibir a mensagem de validação correspondente e não enviar a requisição.

## Cenários e2e

| ID | Requisitos verificados | Cenário |
| --- | --- | --- |
| E2E-01 | ALTA-01 | Admin autenticado cria um animal com espécie válida — sucesso, animal ativo |
| E2E-02 | ALTA-02, ALTA-03 | Admin tenta criar sem espécie e com espécie inexistente — ambos rejeitados, nada persistido |
| E2E-03 | ALTA-04, ALTA-05 | Requisição sem token e requisição de um usuário `adotante` — ambas rejeitadas (401/403) |

**E2E-01 — Alta com sucesso**
- **Dado** um admin autenticado e uma espécie já seedada no banco
- **Quando** ele envia `POST /animais` com nome + `especie_id` válido
- **Então** recebe 201 com o animal criado, `ativo: true`

**E2E-02 — Espécie ausente/inexistente**
- **Dado** um admin autenticado
- **Quando** ele envia `POST /animais` sem `especie_id`, e depois com um `especie_id` que não existe
- **Então** ambas as respostas são 400, e nenhum animal é persistido

**E2E-03 — Autorização**
- **Dado** uma requisição sem token, e uma requisição de um usuário com papel `adotante`
- **Quando** cada uma tenta `POST /animais`
- **Então** a primeira recebe 401 e a segunda recebe 403

**Fora do e2e** — verificado por teste unitário, deliberadamente não duplicado aqui:

| Requisito | Por que não é e2e |
| --- | --- |
| ALTA-06 | Regra de validação pura (DTO), sem travessia de camada — unitário do DTO/controller já cobre |
| ALTA-07 | Regra de validação pura (formato de UUID) — unitário já cobre |
| ALTA-08 | Comportamento client-side puro do formulário — unitário de componente (RTL) já cobre |

---

## Requirement Traceability

| Requirement ID | Source | Phase | Status |
| --- | --- | --- | --- |
| ALTA-01 | CA-01 (original) | T3, T4 | Verified |
| ALTA-02 | CA-02 (original) | T3, T4 | Verified |
| ALTA-03 | CA-02 (original) | T2, T3, T4 | Verified |
| ALTA-04 | CA-03 (original) | T4 | Verified |
| ALTA-05 | CA-03 (original) | T4 | Verified |
| ALTA-06 | Edge case | T3 | Verified |
| ALTA-07 | Edge case | T3 | Verified |
| ALTA-08 | Edge case | T6 | Verified |

**ID format:** `ALTA-NN`

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** 8 total, 8 mapped to `task.md`, 0 unmapped.

**Nota de dependência externa (resolvida)**: esta PBI precisou de 2 tabelas novas no Supabase real (`species`, `animals`) via migration SQL (mesmo padrão de `services/backend/supabase/migrations/20260907120000_create_profiles.sql`). Sem acesso automatizado ao Postgres do projeto nesta sessão (sem `DATABASE_URL`/CLI linkado), o usuário aplicou a migration manualmente no SQL Editor do dashboard do Supabase — confirmado pelos e2e reais de T4 passando contra o banco.

---

## Success Criteria

- [x] Todo CA (original + edge cases) tem Requirement ID e mapeia para ao menos uma task
- [x] Todo Requirement ID que descreve um fluxo de usuário aparece em um cenário `E2E-NN`, ou na tabela "Fora do e2e" com o motivo
- [x] Nada aqui duplica o Problema/Solução do `feature.md` pai — só referencia
