# Step 2: Load Context

## MANDATORY RULES

- Load every artifact already produced upstream — never assume it was already read earlier in this session
- Never reopen or redo Specify/discovery work — that was `makuco-analisar`'s job; this step only loads what already exists
- `feature.md` / `decisions.md` / `discovery.md` / `pbis.md` / the PBI's own `pbi.md` / `DESIGN.md` / `EXPERIENCE.md` are the primary source of analysis — never copy their content verbatim into a future `spec.md`; reference them by path instead
- `.makuco/STATE.md` and `.makuco/docs/codebase/*` are loaded and summarized here, not duplicated — later steps (spec reuse analysis, gap-routing) read them by reference
- The PBI's own acceptance criteria are immutable / source of truth (`ca_imutaveis: true`) — never silently override them with what the parent `feature.md` says
- Report to the user everything that was loaded and everything that was missing, and why each gap is fine or not, before advancing

---

## SEQUENCE

### 1. Read `sessao-dev.md`

Load `{pasta_pbi}/sessao-dev.md`, seeded in step-01. Extract `item_id`, `ado_id`, `titulo`, `slug`, `tipo`, `pasta_pbi`, `feature_folder`, `modo`.

### 2. Load the parent feature's artifacts

Inside `{feature_folder}` (the same folder `makuco-analisar` wrote into), load — each one only if present:

| File | When | Contains |
| --- | --- | --- |
| `discovery.md` | If DESCOBERTA mode was used upstream | Broad brainstorming, problem exploration, Go/No-Go rationale |
| `feature.md` | Almost always | The PRD — problem, solution, business rules, scope, key decisions, rejected alternatives |
| `decisions.md` | Almost always | Detailed decision log with context and rejected alternatives |
| `pbis.md` | Almost always | The full PBI breakdown for the feature — dependencies, rationale, discarded PBIs |

Record each file actually found in `artifacts_loaded`. A missing `discovery.md` is expected whenever the upstream analysis ran in SOLUÇÃO mode — not a gap. A missing `feature.md`/`decisions.md`/`pbis.md` in **ado mode** is not an error either — see step 4 below.

### 3. Load this PBI's own artifacts

Inside `{pasta_pbi}` (this specific PBI's folder under `{feature_folder}/pbis/pbi-NNN-slug/`), load — each one only if present:

- `pbi.md` — this PBI's own delivery description, acceptance criteria, and INVEST validation, as recorded by `makuco-analisar`. It may also carry a `Regras de Negócio` section: the analysis session asks where the rules are documented, so they are **either** here **or** in `feature.md`, never split across both. Read whichever exists and treat it as the same input — `spec.md` references the `RN-NN` ids either way, and re-deriving a rule that is already written is how two versions of the same rule start to disagree
- `DESIGN.md` — UI identity/tokens/components, only produced when this PBI touched UI and `makuco-ux` ran during analysis
- `EXPERIENCE.md` — flows/states/interactions/accessibility, same condition as `DESIGN.md`

Record each one found in `artifacts_loaded`. Missing `DESIGN.md`/`EXPERIENCE.md` means this PBI either doesn't touch UI or `makuco-ux` wasn't invoked upstream — not an error here; step-03 is responsible for detecting a UI gap and invoking `makuco-ux` itself if still needed before implementation.

### 4. Handle the ado-only case

If `modo: ado` and none of the folders/files in steps 2–3 exist at all — i.e. there is no local `makuco-analisar` folder for this item whatsoever (a pure ADO-only PBI with no upstream local analysis) — this is a **valid, non-error state**:

- Set `artifacts_loaded: ['ado-only']`
- Rely on whatever the ado work-item itself carried (title, description, acceptance criteria field) from step-01
- Proceed to step 5 without treating this as a gap to fix

Do not attempt to fabricate or reconstruct a local feature/PBI folder in this case.

### 5. Load project memory and codebase knowledge

Load, if present:

- `.makuco/STATE.md` — the project's persistent memory (past decisions, blockers, deferred ideas, lessons)
- `.makuco/docs/codebase/*` — produced by `makuco-project-research`. **Resolve this path via `makuco-workspace-detection`'s "Codebase-context resolution":** when this PBI's work targets a repo under `repos/<name>/`, load that repo's `repos/<name>/.makuco/docs/codebase/*`; otherwise (or if it's absent) fall back to the root location. Never error on a missing per-repo dir — fall back. Follow that skill's **"Reading order inside `CODEBASE_DIR`"**:
  1. `OVERVIEW.md` — the repo's business role and **module map**. Read it first when present.
  2. Use the map (or the paths the PBI touches) to identify the **one** module this PBI lands in, then read only `modules/<slug>.md`. Never enumerate the `modules/` folder.
  3. The technical files (`stack.md`, `structure.md`, `architecture.md`, `conventions.md`, `integrations.md`, `concerns.md`, `testing.md`) as needed.

Summarize what each says in a few lines for your own working context — do **not** transcribe their content into any artifact this skill writes. Later steps (`step-03-spec-e-tasks.md`'s reuse analysis, gap-routing to a specialist skill) read these by path, not by copy.

If `.makuco/docs/codebase/*` is missing or incomplete, note it as a gap: gap-routing and reuse analysis in step-03 will have less to work with, but this step does not stop for it — do not trigger `makuco-project-research` from here; that is a decision for the user or a later step, never assumed automatically.

A **missing module doc** (`modules/<slug>.md` absent, or its map row shows `—`) is **not** a gap in the same sense: it means that module has not been researched yet. Note it, work from the technical files and the real code, and let step-03 decide whether to suggest researching that one module. Same rule: never trigger research from here.

### 6. Treat acceptance criteria as immutable — check for conflicts

The PBI's own acceptance criteria — from the work-item (ado mode) or from `pbi.md` (local-only mode) — are the **source of truth** for this development session. Set `ca_imutaveis: true` unconditionally.

Compare them against whatever `feature.md` (the PRD) states for this PBI, when `feature.md` was loaded:

- **Consistent, or `feature.md` simply doesn't go into this level of detail:** proceed — `feature.md` is background context, not a competing source of truth.
- **Genuinely conflicting** (the PRD states something the PBI's own CAs contradict): **STOP**. Do not silently pick one side. Present both to the user:

  > "Os critérios de aceite da PBI **{titulo}** divergem do que `feature.md` descreve:
  >
  > **CA da PBI (fonte de verdade):**
  > {lista dos CAs}
  >
  > **O que `feature.md` diz:**
  > {trecho conflitante}
  >
  > Como devo prosseguir? **[P]** Seguir os CAs da PBI (padrão) | **[F]** Seguir o `feature.md` | **[A]** Ajustar antes de decidir"

  **STOP — wait for the user's decision before continuing.**

### 7. Present the loaded/missing summary

> "Contexto carregado para **{titulo}** (`{pasta_pbi}`):
>
> ✅ Carregados: {lista de artifacts_loaded}
> ⚠️ Ausentes: {lista do que não foi encontrado, com nota se é esperado ou não}
>
> **Fonte primária de análise:** `{feature_folder}` (quando existir)
> **Memória do projeto:** `.makuco/STATE.md` {carregado/ausente}
> **Conhecimento de codebase:** `.makuco/docs/codebase/*` {carregado/ausente/incompleto}
>
> Critérios de aceite tratados como imutáveis (fonte de verdade da PBI).
>
> Pronto para gerar spec e tasks? **[S]** Sim | **[Ajustar X]**"

**STOP — wait for confirmation before advancing**, unless the user's original invocation already made continuation implicit for this whole run.

### 8. Update `sessao-dev.md`

Update the frontmatter:

```yaml
artifacts_loaded: ['{list of every file actually found}']   # or ['ado-only']
ca_imutaveis: true
stepsCompleted: [1, 2]
proxima_fase: 'spec-e-tasks'
```

This updates the fields shown above and nothing else. `status` stays `developing` — only
`step-01-identificar` (seed) and `step-05-fechamento` (`done`/`paused`) ever write it.

### 9. Route to the next step

Load `./step-03-spec-e-tasks.md`.

---

## SUCCESS METRICS

- `{feature_folder}` artifacts loaded when present: `feature.md`, `decisions.md`, `discovery.md` (only if DESCOBERTA), `pbis.md`
- This PBI's own `pbi.md` (and `DESIGN.md`/`EXPERIENCE.md` if this PBI touched UI) loaded from `{pasta_pbi}`
- `ado-only` correctly recognized as a valid, non-error state when `modo: ado` and no local analysis folder exists at all
- `.makuco/STATE.md` and `.makuco/docs/codebase/*` loaded and summarized, never transcribed verbatim into any artifact
- No Specify/discovery work redone — this step only loads what already exists
- Acceptance criteria treated as immutable (`ca_imutaveis: true`); any genuine conflict with `feature.md` stopped for explicit user decision
- Clear loaded/missing summary presented to the user before advancing
- `sessao-dev.md` updated: `artifacts_loaded`, `ca_imutaveis`, `stepsCompleted: [1, 2]`, `proxima_fase: 'spec-e-tasks'`
- Correct routing to `step-03-spec-e-tasks.md`
