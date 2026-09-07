# Step 1: Session Setup

## MANDATORY RULES

- Never presume the mode (DESCOBERTA vs SOLUÇÃO) — always ask
- Resolve config (`MAKUCO.md`, tracker integration) before asking anything
- You are a facilitator — confirm, don't invent, the feature title/topic
- Initialize `sessao.md` before routing to the next step, **always including `status`** — it is the state-contract field the makuco engine routes on (see `SKILL.md`)
- Always check for an existing session before creating new directories
- A resumed session whose `sessao.md` has no `status` is repaired here, before routing — never left for a later step

---

## SEQUENCE

### 1. Resolve config

Read `MAKUCO.md`'s YAML frontmatter, key `analise.aprovador` (generic role / name / "nenhum") — never assume a hardcoded person. If the frontmatter or the `analise` key is absent, treat it as "nenhum" and mention to the user that adding `analise.aprovador` to `MAKUCO.md`'s frontmatter lets them name an approver going forward.

Check for `.makuco/integrations/azure-devops.yml`:

- **Present** → tracker work-item creation is available later (step-05); read org/project/type-names when needed.
- **Absent** → do **not** silently go local-only. First **offer to configure the tracker now**:
  > "Sem integração de tracker configurada. Quer configurar o Azure DevOps agora (pergunto sobre organização/projeto) ou seguir local-only nesta análise?"

  **STOP — wait for the answer.** If **configure**: invoke the Azure DevOps integration skill and run its **first-run setup** (org/project + destino (área/sprint) Q&A → writes `.makuco/integrations/azure-devops.yml`; see that skill's "First-run configuration"), after which tracker work-item creation is available in step-05. If **local-only**: docs/PBIs are generated under the canonical path with local ids, no work item is created — the offer can be made again on a future run.

### 2. Get the feature topic

If not already provided in the invocation, ask:

> "Vamos iniciar uma análise. Em uma frase: qual é a oportunidade ou problema que você quer explorar?"

**STOP — wait for the answer before continuing.**

Derive `feature_title` from the answer (ask the user to confirm/refine a short title if the raw answer is long) and `feature_slug` = title in lowercase, spaces→hyphens, special characters removed, max 40 chars.

### 3. Detect an existing session

Search `.makuco/docs/modules/*/*/sessao.md` for a `feature_slug` match (read the frontmatter of any candidate). Also accept a fuzzy title match if the user's topic closely resembles an existing feature.

- **Found, with non-empty `stepsCompleted`:** present it —
  > "Encontrei uma análise em andamento para **[feature_title]** (`[feature_folder]`), no passo [stepsCompleted]. Quer **continuar** de onde parou ou **reiniciar** do zero?"
  **STOP — wait for the decision.** If continue: load `sessao.md`, **repair `status` if absent** (see 3b), then jump to the step indicated by `stepsCompleted`, routing by the **saved `mode`** (`descoberta` → `./step-02a-descoberta.md`, `solucao` → `./step-02b-solucao.md`) — never re-ask the mode, the topic, or the module/numbering, all of which are already in the file. Do not re-ask anything else recorded there either: the destination step recovers its own partial state (e.g. `initial_answers`, `ideation_technique`) from `sessao.md` and skips the questions it already has answers for. If restart: proceed to step 4 below as if nothing existed (do not delete the old folder — create the new session content on top of the existing files, confirming with the user first if this would overwrite discovery/feature/pbis content).
- **Not found:** widen the search once before proceeding — glob `.makuco/docs/modules/*/*/feature.md` for a folder that covers this same feature but has **no** `sessao.md` beside it (an analysis produced by some other flow, invisible to the search above). If one matches the topic, present it and ask whether to continue from that feature or to create a new one anyway. **STOP — wait for the decision.** Nothing matches: proceed to step 4.

### 3b. Repair a tracker written before the state contract

Sessions created by older versions of this skill have no `status` field. The makuco engine
tolerates that as "still analyzing" — which means a finished analysis stays reported as
in-progress forever, and its PBIs never become actionable work. Repair it **here**, on resume,
before routing anywhere:

If the loaded `sessao.md` has **no** `status` field (or it is empty), write the value that
matches what is already recorded in the file:

| Found in `stepsCompleted` | Write |
| --- | --- |
| includes `'reprovado'` | `status: 'rejected'` |
| includes `6` (closeout ran) | `status: 'analyzed'` |
| anything else | `status: 'analyzing'` |

Never ask about this — there is no decision to make. Just say it in one line, so the user
understands why the progress reading jumps:

> "Completei o `status` do tracker desta análise (`{valor}`) — ele foi criado antes do campo existir."

If `status` is already present, leave it exactly as it is: the file's own record wins over
anything inferred from `stepsCompleted`.

### 4. Resolve module and feature numbering

List the existing `module_NNN_name` directories under `.makuco/docs/`. Ask the user:

> "Essa análise pertence a qual módulo? [lista dos módulos existentes] ou **[N] Novo módulo**"

**STOP — wait for the selection.**

- **Existing module:** `feature_NNN` = next sequential number among `feature_NNN_*` directories already inside that module folder (max existing + 1, zero-padded to 3 digits; `001` if none exist).
- **New module:** ask for a short module name, derive its slug, and compute `module_NNN` = next sequential number among all `module_NNN_*` directories under `.makuco/docs/` (max existing + 1, zero-padded to 3 digits). `feature_NNN` starts at `001` inside it.

Set `feature_folder` = `.makuco/docs/modules/module_{NNN}_{module_slug}/feature_{NNN}_{feature_slug}/`.

Present:

> "Pasta local será criada em: `{feature_folder}`"

### 5. Ask the mode

Always ask — never presume, never default:

> "Como você descreveria a situação atual desta oportunidade?
>
> **[1] DESCOBERTA** — Ainda é uma ideia nebulosa. Preciso explorar se vale a pena, entender o problema em profundidade, e validar com o aprovador configurado antes de avançar.
>
> **[2] SOLUÇÃO** — O problema já está claro e bem entendido. Preciso analisar como viabilizá-lo e partir para a documentação.
>
> Digite 1 ou 2."

**STOP — wait for the selection before continuing.**

### 6. Initialize the session

Create the directories and write `sessao.md`:

```bash
mkdir -p "{feature_folder}"
```

`{feature_folder}/sessao.md` frontmatter:

```yaml
---
status: 'analyzing'
stepsCompleted: [1]
feature_id: '{feature_folder local id, e.g. feature_NNN}'
feature_title: '{feature_title}'
feature_slug: '{feature_slug}'
feature_folder: '{feature_folder}'
mode: '{descoberta|solucao}'
rn_placement: ''
business_rules: []
initial_answers: {}
ideation_technique: ''
validation_approved: false
brainstorming_notes: ''
pbis_created: []
ux_proposals: []
---
```

This skill writes `sessao.md` directly (its own session state) — it is **not** a canonical doc artifact and does not go through `makuco-copy-writer`.

`rn_placement` and `business_rules` start empty and are filled by **step-04**, which is where
the consolidated rules first exist and therefore where the user is asked where to document
them. Never ask here: at this point the feature is a one-line topic and the question would be
abstract. Once recorded, the resume rule in section 3 above already covers it — a session
picked up mid-flight never re-asks the placement.

`status: 'analyzing'` is the **state contract** (see `SKILL.md`), not a cosmetic marker: it is the field the makuco engine reads to know this feature has analysis in flight. Only three steps ever write it — this one seeds `analyzing`, `step-03-gate` writes `rejected` on a No-Go, and `step-06-fechamento` writes `analyzed` at closeout. No other step touches it.

`initial_answers` starts empty and is filled by step-02a or step-02b as soon as the user answers that step's opening questions — its keys differ per mode and are defined in each of those step files. Together with `ideation_technique`, it is what lets a step resumed in a brand-new session pick up mid-brainstorming instead of re-asking. Never fill either field here.

### 7. Route to the next step

- **Mode = DESCOBERTA:** load `./step-02a-descoberta.md`
- **Mode = SOLUÇÃO:** load `./step-02b-solucao.md`

---

## SUCCESS METRICS

- Config resolved (`MAKUCO.md` aprovador, tracker integration presence)
- Feature topic confirmed with the user (title + slug), never invented
- Existing session detected and resume offered when applicable — the search glob matches the real depth of the canonical folder (`.makuco/docs/modules/*/*/sessao.md`)
- A resumed tracker missing `status` repaired from its own `stepsCompleted`, announced in one line, never asked about
- On resume, routing follows the saved `mode` and nothing already recorded in `sessao.md` is asked again
- Module/feature numbering resolved without colliding with existing folders
- Mode chosen explicitly by the user (never presumed)
- `sessao.md` initialized with `status: 'analyzing'` and `stepsCompleted: [1]`
- Correct routing to step-02a or step-02b
