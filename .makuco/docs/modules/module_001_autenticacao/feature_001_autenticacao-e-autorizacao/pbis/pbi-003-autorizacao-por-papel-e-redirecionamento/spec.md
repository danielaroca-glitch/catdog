# Autorização por papel e redirecionamento pós-login — Dev Spec

**Parent Feature**: `../../feature.md` (Autenticação e Autorização) — ver `decisions.md#DEC-01` (Supabase Auth + tabela `profiles`) e `decisions.md#DEC-02` (cliente Supabase efêmero por chamada para auth de usuário final — **não se aplica aqui**: esta PBI só *lê* `profiles` via o singleton admin, mesmo padrão já usado por `RegisterUseCase`, nunca autentica um usuário final contra o GoTrue).
**Work-item**: nenhum (local-only) · **PBI**: pbi-003-autorizacao-por-papel-e-redirecionamento

## Scope

Guard de autorização por papel no backend (lê `profiles` a cada requisição autenticada) + redirecionamento pós-login por papel e bloqueio de rota administrativa no frontend. O conteúdo real das áreas administrativa/cliente é de módulos futuros — aqui só o mecanismo de entrada e bloqueio.

## Nota de arquitetura — sessão em memória exige checagem client-side, não middleware

Per decisão da `pbi-002` (`.makuco/STATE.md`), tokens vivem só em memória do React (`SessionContext`), nunca em cookie/`localStorage`. O Next.js `middleware.ts` roda no edge/servidor e não tem acesso a esse estado — **não pode** decidir proteção de rota. A proteção client-side (componente que verifica o papel em `SessionContext` e redireciona/bloqueia) cobre a UX (CA-02), mas não é uma fronteira de segurança por si só — qualquer endpoint real de admin **precisa** do guard no backend (CA-03), que é a fronteira de verdade.

## Out of Scope

| Item | Reason |
| --- | --- |
| Conteúdo real da área administrativa (cadastro de animais, gestão de solicitações) | Módulos futuros — `EXPERIENCE.md` desta PBI marca como `[NOTE FOR UX]`, fora do escopo |
| Conteúdo real da área do cliente | Idem |
| Middleware Next.js de proteção de rota | Sessão em memória não é acessível no edge — ver Nota de arquitetura acima |
| Gestão de papéis (promover/rebaixar usuário) | Não pedido pelos CAs; `role` é seedado manualmente hoje (ver `feature.md`, Out) |

---

## Acceptance Criteria

Fonte: `pbi.md` (`analisar`). Tratados como imutáveis — normalizados aqui, não re-derivados.

1. **AUTZ-01** — WHEN o login é bem-sucedido THEN o sistema SHALL redirecionar o usuário à área correspondente ao seu papel (admin → área administrativa; adotante → área do cliente) (CA-01, RN-04).
2. **AUTZ-02** — WHEN um usuário autenticado sem papel `admin` tenta acessar uma rota administrativa THEN o sistema SHALL bloquear o acesso e exibir a página de acesso negado, sem revelar se a rota existe além disso (CA-02).
3. **AUTZ-03** — WHEN uma requisição autenticada chega a um endpoint protegido por papel THEN o backend SHALL ler o papel do usuário na tabela `profiles` via guard, a cada requisição — nunca cacheado no token nem em memória do processo (CA-03).

## Edge Cases

Surgidos ao escrever esta spec — não presentes nas CA originais.

- **AUTZ-04** — WHEN uma requisição chega a um endpoint protegido sem `Authorization: Bearer <token>` THEN o backend SHALL retornar 401, antes de qualquer checagem de papel.
- **AUTZ-05** — WHEN o `access_token` apresentado é inválido, malformado ou expirado THEN o backend SHALL retornar 401 genérico — mesmo padrão de erro de auth já estabelecido em `pbi-002` (sem detalhe interno vazado).
- **AUTZ-06** — WHEN um usuário autenticado (token válido) sem papel `admin` chama um endpoint `admin`-only THEN o backend SHALL retornar 403 — distinto de 401 (401 = "quem é você", 403 = "sei quem você é, mas não pode").

## Cenários e2e

| ID | Requisitos verificados | Cenário |
| --- | --- | --- |
| E2E-01 | AUTZ-01 | Login com usuário `adotante` redireciona à área do cliente. |
| E2E-02 | AUTZ-01 | Login com usuário `admin` redireciona à área administrativa. |
| E2E-03 | AUTZ-02 | Usuário `adotante` acessa `/admin` diretamente pela URL e vê a página de acesso negado, não o conteúdo administrativo. |
| E2E-04 | AUTZ-03, AUTZ-06 | Requisição a endpoint `admin`-only com token de usuário `adotante` retorna 403. |
| E2E-05 | AUTZ-03 | Requisição a endpoint `admin`-only com token de usuário `admin` retorna 200. |
| E2E-06 | AUTZ-04, AUTZ-05 | Requisição a endpoint protegido sem token (401) e com token inválido/malformado (401). |

**E2E-01 — Login redireciona adotante à área do cliente**
- **Dado** um usuário `adotante` com conta confirmada
- **Quando** ele faz login com credenciais corretas
- **Então** é redirecionado a `/cliente` (placeholder), sem tela intermediária

**E2E-04 — Endpoint admin-only bloqueia adotante**
- **Dado** um usuário `adotante` autenticado (token válido)
- **Quando** ele chama `GET /admin/ping`
- **Então** recebe 403

**Fora do e2e**: nenhum requisito desta PBI é uma regra pura sem travessia de camada — guard + endpoint sempre cruzam a fronteira HTTP, então todos os requisitos têm cobertura e2e direta ou (para os testes do guard isolado, ex. parsing de JWT malformado) unitária complementar, não substituta.

---

## Requirement Traceability

| Requirement ID | Source | Phase | Status |
| --- | --- | --- | --- |
| AUTZ-01 | CA-01 (original) | Tasks | Pending |
| AUTZ-02 | CA-02 (original) | Tasks | Pending |
| AUTZ-03 | CA-03 (original) | Tasks | Pending |
| AUTZ-04 | Edge case | Tasks | Pending |
| AUTZ-05 | Edge case | Tasks | Pending |
| AUTZ-06 | Edge case | Tasks | Pending |

**ID format:** `AUTZ-NN`

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** 6 total, 6 a mapear em `task.md`, 0 unmapped.

---

## Success Criteria

- [ ] Toda CA (original + edge case) tem Requirement ID e mapeia para ao menos uma task
- [ ] Todo Requirement ID que descreve um fluxo de usuário aparece num cenário `E2E-NN`
- [ ] Nada aqui duplica o Problem Statement/Goals da feature pai — referencia em vez de copiar
