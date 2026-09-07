# Step 4: Feature Documentation (PRD)

## MANDATORY RULES

- A Feature is a complete strategic delivery (e.g. a dashboard, a whole module) — business-level, not a code architecture doc
- Focus on business — do not descend into technical/code architecture
- Fill every mandatory section
- Content is assembled here; `makuco-copy-writer` (stage=feature) is who actually writes `feature.md` + `decisions.md`
- Vocabulary (affected dimension, item types) comes from `MAKUCO.md` / `makuco-product-context` config — never hardcode a project's domain terms

---

## GOAL OF THIS STEP

Produce the official Feature document — the PRD — that:
1. Clearly defines what will be delivered
2. Documents business rules and product decisions
3. Serves as the contract between business and development
4. Is recorded locally (and, when a tracker integration exists, referenced there)

---

## SEQUENCE

### 1. Collect missing information

Based on the brainstorming (step-02a or step-02b), identify gaps and ask the user what hasn't been defined yet. At minimum confirm:

- Final Feature title (may differ from the initial topic)
- The affected dimension(s), if relevant to this project (read the label/options from `MAKUCO.md` / `makuco-product-context`; skip the section entirely if not applicable)
- Explicit scope: what is IN and what is OUT

### 2. Ask where the business rules go

The rules were consolidated in the brainstorming and exist now — this is the moment the user
can decide where they are documented, and the answer is recorded so it is asked **once** per
analysis.

Read `rn_placement` from `sessao.md` first. **Filled → skip this section entirely** (a resumed
session never re-asks). Empty → ask:

> "Consolidei as regras de negócio desta feature. Onde você quer que elas fiquem documentadas?
>
> **[1] Na feature** — uma lista `RN-NN` única no `feature.md`, governando todos os PBIs. É o
> padrão até aqui.
>
> **[2] No PBI** — cada regra fica no `pbi.md` do PBI que ela governa, ao lado dos critérios de
> aceite que a verificam. Quem desenvolve lê a regra sem sair do item.
>
> Digite 1 ou 2."

**STOP — wait for the selection.**

Record in `sessao.md`: `rn_placement: 'feature'` or `rn_placement: 'pbi'`.

Neither is more correct — it is how the person works. Two teams asked for `pbi` because whoever
develops opens the PBI and had to navigate to the feature to find the rule governing the item
in front of them.

**When `pbi`:** also record the consolidated rules in `sessao.md` under `business_rules`, one
entry per rule, keeping the `RN-NN` id assigned here:

```yaml
business_rules:
  - id: 'RN-01'
    rule: '{regra clara e objetiva}'
  - id: 'RN-02'
    rule: '{regra clara e objetiva}'
```

They have to survive the step boundary: step-05 is what distributes them across the PBIs, and
without this field they would only exist in this conversation. Ids are assigned **once**, here,
and never renumbered downstream — they are the link between the rule and the acceptance
criterion that covers it.

### 3. Assemble the PRD content

Assemble the PRD content matching the sections `makuco-artifact-feature` expects (the single source of truth for the `feature.md` structure — do not duplicate it here):

- **Problema / Oportunidade** and **Solução Proposta** — from the brainstorming synthesis
- **{dimensão} Afetados** / **Tipos de {item} Envolvidos** — only if the project's config defines this vocabulary; omit otherwise
- **Regras de Negócio** — obeys the `rn_placement` recorded above: with `feature`, the
  consolidated `RN-NN` list; with `pbi`, the section carries only the pointer to the PBIs
  (see `makuco-artifact-feature`'s rule for the two shapes). The section never disappears —
  a PRD with no such heading reads as "this feature has no business rules"
- **Escopo IN/OUT**, **Critérios de Sucesso**, **Premissas e Decisões**
- **Decisões Chave** — summary table; full detail goes to `decisions.md`
- **Alternativas Consideradas e Rejeitadas** — fed by the brainstorming (step-02a/02b) — what was explored and discarded
- **Dependências**, **Referências** (link `discovery.md` if this came from DESCOBERTA mode)

Assemble the companion `decisions.md` content: one `DEC-NN` entry per relevant decision surfaced in the brainstorming (Contexto / Opções avaliadas / Escolha / Motivo / Impactos).

### 4. Validate with the user

Present the assembled content:

> "Feature documentada. Revise abaixo. Algum ajuste antes de salvar?
> [conteúdo montado]
> **[S]** Salvar | **[Ajustar X]** para corrigir algo"

**STOP — wait for confirmation or adjustments.**

### 5. Hand off to `makuco-copy-writer`

Pass:
- **Content** — the validated `feature.md` content + the `decisions.md` content
- **Target path** — `{feature_folder}/feature.md` (copy-writer also writes `{feature_folder}/decisions.md` per the `makuco-artifact-feature` contract)
- **Status field** — `feature_prd_artifact = {feature_folder}/feature.md`
- **Metadata** — `stage: feature`, `feature: {feature_slug}`, feature directory `{feature_folder}` (no `pbi` field — feature-level)
- **Current stage** — a human-readable label (e.g. `"Feature PRD (makuco-analisar)"`)

If a tracker integration exists (`.makuco/integrations/azure-devops.yml`), also update the tracker's Feature-equivalent work item with the PRD content once the local files are saved — this step never writes tracker state before the local files exist.

### 6. Evolve `decisions.md` later if needed

If a later step (e.g. step-05 revealing a new high-level decision) surfaces something decision-worthy, return to `decisions.md` and add a new `DEC-NN` entry through the same `makuco-copy-writer` (stage=feature) hand-off — `feature.md#Decisões Chave` only receives a one-line summary of the new entry.

### 7. Update session frontmatter

Update `sessao.md`:
- `stepsCompleted`: append `4` (i.e. `[1, 2, 3, 4]` for DESCOBERTA, `[1, 2, 4]` for SOLUÇÃO)
- `rn_placement`: the choice from section 2, if it was not already recorded there
- `business_rules`: the consolidated rules, **only** under `rn_placement: pbi` — step-05 reads
  this field to distribute them

This appends to the field named above and nothing else. `status` stays `analyzing` — only
`step-03-gate` (No-Go) and `step-06-fechamento` (closeout) ever change it.

Load `./step-05-pbis.md`.

---

## SUCCESS METRICS

- All mandatory sections filled
- Affected dimension(s) made explicit when the project's config defines them
- IN/OUT scope defined
- At least 1 success criterion with a metric
- `feature.md` + `decisions.md` written via `makuco-copy-writer` (stage=feature)
- Rejected alternatives documented in `feature.md`
- `decisions.md` has at least one `DEC-01` entry
- Business-rule placement asked **once** and recorded in `sessao.md` (`rn_placement`), and not
  re-asked on a resumed session
- Under `rn_placement: pbi`, `business_rules` recorded in `sessao.md` with the `RN-NN` ids
  assigned here, and `feature.md` carrying the pointer instead of the list
