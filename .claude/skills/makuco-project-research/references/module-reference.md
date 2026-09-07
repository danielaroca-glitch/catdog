# Module Reference

**Purpose:** Document what one module/service/package *does for the business*, grouped by business area.

**Size limit:** 1,500 tokens (~900 words) per module

**Extract from:**

- A **path listing** of the module's controllers/handlers/routes, jobs and consumers. The business areas come from their **names**, not from their contents — `ContratoAprovacaoController`, `MargemReservaController`, `FolhaFechamentoJob` already tell you the areas before a single file is opened.
- Up to **8** of those files, opened as **one representative per business area** — read for **intent**, never to inventory signatures
- The module's manifest and dependencies (who it talks to)
- The team's reference docs declared in `research.referencias` (see [reference-docs-reconciliation.md](reference-docs-reconciliation.md))

**Input cap:** 12 files per module (at most 8 of them source), 4 searches, 25 results each.

```bash
git -C <repo> ls-files '<module-path>' | grep -Ei '(controller|handler|resource|route|job|scheduler|consumer|listener)' | head -60
```

A module with 41 controllers is **one listing plus up to 8 reads**, never 41 reads. If the listing exceeds 60 lines, group by the name prefix and open one file per group. Opening every handler is the single most expensive mistake available in this skill.

Template and guidance for documenting a module in `<CODEBASE_DIR>/modules/<slug>.md`.

`<slug>` is the module's directory name, lowercased and kebab-cased. One file per module — or one file for a cohesive group of modules (shared libraries, a family of small processors) when splitting them adds no information.

## Template

```markdown
# <module-name>

`<caminho/no/repo>`

[Um parágrafo: o que este módulo resolve para o negócio e por que ele existe separado dos demais.]

## Capacidades

### Gestão de contratos

- Consulta e lista contratos com filtros por convênio, matrícula e competência.
- Cria contratos de empréstimo, refinanciamento e portabilidade.
- Aprova contratos em lote.
- Gerencia suspensão judicial de contratos.

### Margem

- Calcula e consulta a margem consignável disponível por matrícula.
- Reserva, confirma e cancela reserva de margem.

### Folha de pagamento

- Registra o fechamento mensal e apura divergências entre folha e sistema.
- Exporta a consignação mensal para a fonte pagadora.

## Fronteiras

**Expõe:** API REST consumida por `consignet-react` e `integracao-api-banco`; eventos Kafka de migração de contrato.

**Consome:** `core` (entidades compartilhadas), Oracle (esquema `CSG`), Redis (cache de convênios do usuário), Keycloak (autenticação).

## Evidência

- `contrato/src/main/java/**/controller/` — 41 controllers agrupados nas áreas acima
- `contrato/pom.xml` — dependências de `core`, `common-session`
- `INDEX.md` §`csg-mxt-backend`/`contrato` — ✓ confere com o código
```

## Field Guidance

- **Parágrafo de abertura**: business framing. "Núcleo de negócio: tudo que envolve o ciclo de vida do contrato de consignação" beats "Spring Boot module with controllers and services".
- **Capacidades**: group by **business area** (`### Gestão de contratos`, `### Margem`, `### Relatórios`), then one bullet per capability, phrased as what the system does. Nest one level when an area has clear sub-groups; never more.
- **Fronteiras**: 3–6 short bullets or two prose lines. Name only **stable public contracts** — a REST surface, a Kafka topic, a table schema, a shared library. Do not list internal classes.
- **Evidência**: what you actually listed and what you actually opened — say which. `41 controllers agrupados nas áreas acima` records a *listing*; a path with no count records a *read*. Plus the reference-doc section you reconciled against and its verdict. This is what makes a refresh cheap: a later pass re-checks these paths instead of re-deriving the module.

## Depth rule — capabilities, not endpoints

Write what the module **does**, never its call surface:

| Write this | Not this |
|------------|----------|
| Aprova contratos em lote. | `POST /contratos/aprovacao-massiva` — body `{ids: number[]}` |
| Consulta a margem disponível por matrícula. | `MargemController.consultar(String matricula)` |
| Envia notificações push agendadas aos colaboradores. | `AvisoPushNotificationScheduler` → tópico `ENVIA_AVISO_NOTIFICACAO_PUSH` → `FCMService` |

Named technical inventories (scheduler lists, consumer/topic tables, step-by-step pipelines) do **not** belong here. When a named element is genuinely part of the module's public contract, it goes in `## Fronteiras` as one line — the rest stays in `integrations.md` / `architecture.md`, which own that kind of detail.

## Rules

- **Omit empty sections** instead of writing "não se aplica" — same discipline as `concerns-reference.md`.
- Do not create a file for a trivial module (a shared utility library, a thin wrapper). One row in the `OVERVIEW.md` module map is enough; group cohesive libraries into a single doc if they deserve one at all.
- Every capability must be traceable to something you read. Unverifiable claims taken from a reference doc must be marked `⚠` and reported in the `OVERVIEW.md` `## Divergências` section — never silently promoted to a bullet.
- Keep the module's business language (Portuguese domain terms like *convênio*, *margem*, *averbação*) exactly as the code and the team use it. Do not translate domain vocabulary.
