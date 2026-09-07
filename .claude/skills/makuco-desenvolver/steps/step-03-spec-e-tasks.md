# Step 3: Spec & Tasks

## MANDATORY RULES

- `spec.md` and `task.md` are written **directly by this skill**, inside `{pasta_pbi}` — the PBI's own canonical folder from step-01/02. Never through any canonical-docs authoring skill, and never touching this project's tracker-sync artifact — those are working state for this flow, not canonical product docs.
- The PBI's acceptance criteria are immutable (`ca_imutaveis: true`, set in step-02) — normalize and structure them here, never re-derive or silently override them.
- `spec.md` follows the format in [references/specify.md](../references/specify.md); `task.md` follows the format in [references/tasks.md](../references/tasks.md). Both formats ship with this skill — apply them as-is, don't reinvent the structure here.
- Every task that touches backend, frontend, or UI code gets its specialist skill recorded in its `Tools` field, resolved per [references/gap-routing.md](../references/gap-routing.md) — never guessed, never a hardcoded stack keyword.
- Backend tasks are ordered before frontend tasks within the same PBI (AD-004) — regardless of the order they were first drafted in.
- A UI gap (frontend task, no existing `DESIGN.md`/`EXPERIENCE.md` pair for this PBI) blocks emitting frontend tasks until `makuco-ux` produces that pair — or, if `makuco-ux` isn't installed, a warning is issued and generic task generation proceeds anyway. Never block delivery on a missing specialist skill.
- Run all three mandatory pre-approval validation checks from `tasks.md` before showing anything to the user — Granularity, Diagram-Definition Cross-Check, Test Co-location. Any failing check must be fixed before presenting, not shown with a caveat.
- **STOP for explicit user approval** of the generated `spec.md` + `task.md` before routing to implementation. Nothing gets implemented off the back of this step alone.

---

## SEQUENCE

### 1. Read session state and confirm loaded context

From `{pasta_pbi}/sessao-dev.md`, confirm `artifacts_loaded`, `ca_imutaveis: true`, and `stepsCompleted` include `[1, 2]`. If something step-02 was supposed to load is missing from `artifacts_loaded` and looks needed here, load it now rather than restarting step-02.

### 2. Generate `spec.md`

Follow [references/specify.md](../references/specify.md) end to end:

1. Load the existing CA (from the tracker work-item in ado mode, or from this PBI's own `pbi.md` in local-only mode) — already loaded in step-02, treated as fixed.
2. Normalize each CA into `WHEN [event/action] THEN system SHALL [behavior]`. Anything that can't be rewritten this way is too vague — stop and flag it to the user instead of guessing a shape for it.
3. Surface edge cases the original CA didn't cover (boundaries, empty/huge input, error paths, unexpected input) as their own WHEN/THEN/SHALL lines.
4. Assign a unique Requirement Traceability ID to every CA and every edge case (`[PBI-SLUG]-[NUMBER]`).
5. Derive the **e2e scenarios** from the requirements above, before any code exists. Every Requirement ID that describes a user flow gets an `E2E-NN` scenario naming the ids it verifies; every id that does **not** goes in the "Fora do e2e" table with the reason. Write them in the project's own test vocabulary, read from `TESTING.md` — the given/when/then of the template is the fallback for a project without one.

   This is the step's own reason to exist: written at coding time, the e2e test mirrors what was built; written here, it verifies what was agreed, and the developer starts knowing exactly what has to pass. Do **not** decide the test *type* here (that is the coverage matrix in section 3) — decide the *scenario*.
6. Write `{pasta_pbi}/spec.md` using the template in `specify.md` — Scope, Out of Scope, Acceptance Criteria, Edge Cases, Cenários e2e, Requirement Traceability, Success Criteria. Reference the parent feature's artifacts and `sessao-dev.md` by path; never re-paste their content.
7. Confirm with the user that the normalized CA + surfaced edge cases + e2e scenarios are **complete** — this replaces the "approve the discovery" checkpoint that doesn't apply here (the CA already exist). If the user flags something as incomplete, revise before moving to tasks.

### 3. Load the project's own test-coverage convention

Look for a `TESTING.md` (or equivalent) already summarized in step-02 from `.makuco/docs/codebase/*` — its location varies by project, don't assume a fixed path. Its Test Coverage Matrix and Parallelism Assessment drive:

- which tasks must co-locate tests (never a separate task) and at which gate tier (quick/full/build)
- which tasks can be marked `[P]` for parallel execution

If no such convention exists (greenfield project, or it lives somewhere step-02 didn't find), ask the user what test types and gate commands apply before drafting tasks.

### 4. Derive the stack→skill map for this PBI

Per [references/gap-routing.md](../references/gap-routing.md) Step 1: read `.makuco/docs/codebase/*` to build this session's task-domain → specialist-skill map (backend / frontend / UI). This map is derived fresh here — never cached from a previous session, never hardcoded in this step.

If `.makuco/docs/codebase/*` is missing or too thin to route confidently, prefer asking the user which layers map to which domain over guessing — a wrong routing decision cascades into the wrong specialist skill's conventions being applied later.

### 5. Break the PBI into atomic tasks

Follow [references/tasks.md](../references/tasks.md)'s process:

1. Review `spec.md` (just written) as the source for every task's `Requirement` field.
2. Break the PBI into atomic tasks — one task = one component, one function, one API endpoint, or one file change. Co-locate each task's required tests per the coverage matrix loaded in step 3 — tests are never a separate task.
3. Define `Depends on` for each task.
4. Route each task's `Tools`/`Skill` field using the map derived in step 4 above. A task spanning more than one domain (e.g. a full-stack task) records every skill that applies.
5. Group tasks into execution phases; mark `[P]` only where dependencies and test parallel-safety both allow it.

**Safety valve:** if, while listing tasks, the breakdown grows past roughly 5 phases or the dependency graph becomes hard to state cleanly in one diagram, stop and reconsider before finishing the listing — either the PBI's scope has drifted wider than one unit of work (a signal to go back to `makuco-analisar`, not to keep splitting tasks here), or the tasks themselves need regrouping into cleaner phases. This should rarely trigger, since one PBI is already a bounded unit of work by the time this step runs — but state the check explicitly rather than skipping it.

### 6. Apply the ordering rule (AD-004)

When building the execution plan/dependency graph, place every backend-domain task ahead of every frontend-domain task in the same PBI, regardless of the order they were first drafted in.

### 7. Apply the UI-gap rule before emitting frontend tasks

For any task routed to the frontend/UI domain: check whether `{pasta_pbi}` already contains **both** `DESIGN.md` and `EXPERIENCE.md` (per what step-02 loaded into `artifacts_loaded`).

- **Both present:** route straight to the frontend specialist skill for those tasks — no need to re-invoke the UX skill.
- **Either missing, and the UX specialist skill is installed:** invoke it now, before finalizing or emitting any frontend task in `task.md`. Wait for it to produce the `DESIGN.md`/`EXPERIENCE.md` pair, then use that pair as the contract for those tasks.
- **Either missing, and the UX specialist skill is not installed:** warn the user once that this PBI's frontend tasks will proceed without a design/experience contract, and generate them generically instead. Never block on this.

### 8. Run the three mandatory pre-approval validation checks

Before presenting anything to the user, per `tasks.md`:

1. **Task Granularity Check** — every task is one component/function/endpoint/file change; anything broader gets split.
2. **Diagram-Definition Cross-Check** — every task's `Depends on` field has a matching arrow in the execution diagram and vice versa; no `[P]`-marked task depends on another `[P]` task in the same phase.
3. **Test Co-location Validation** — every task's `Tests` field matches what the coverage matrix (step 3) requires for the code layer(s) it touches; `Tests: none` is only valid when the matrix says so, or no such convention exists and the user confirmed no tests are expected.

Any ❌ in any check means restructuring the tasks and re-running the checks — never present a failing check to the user with a request to approve anyway. Include both validation tables in what gets presented.

### 9. Write `task.md`

Write `{pasta_pbi}/task.md` using the template in `tasks.md` — Execution Plan (phased diagram), Task Breakdown (What/Where/Depends on/Reuses/Requirement/Tools/Done when/Tests/Gate/Commit per task), Parallel Execution Map, and both validation tables from step 8.

### 10. Present spec + tasks and stop for approval

> "**spec.md** e **task.md** gerados para **{titulo}** (`{pasta_pbi}`):
>
> 📋 `spec.md` — {N} critérios de aceite (+ {M} edge cases), todos com Requirement ID
> 📋 `task.md` — {N} tasks em {N} fases · skills envolvidas: {lista de skills_necessarias}
>
> Backend antes de frontend, conforme AD-004. {Nota sobre makuco-ux, se invocado ou se ausente e ignorado.}
>
> Checks de validação: Granularidade ✅ · Diagrama×Dependências ✅ · Co-localização de testes ✅
>
> Revise os arquivos. Aprova para avançar à implementação? **[S]** Sim | **[Ajustar X]**"

**STOP — wait for explicit approval before routing to step-04.** Do not begin implementation off an implicit approval unless the user's original invocation already made continuation of this whole run explicit.

### 11. Update `sessao-dev.md`

```yaml
spec_construido: true
total_tasks: {N}
skills_necessarias: ['{aggregated set of specialist skills used across every task in task.md}']
stepsCompleted: [1, 2, 3]
proxima_fase: 'implementar'
```

This updates the fields shown above and nothing else. `status` stays `developing` — only
`step-01-identificar` (seed) and `step-05-fechamento` (`done`/`paused`) ever write it.

### 12. Route to the next step

Load `./step-04-implementar.md`.

---

## SUCCESS METRICS

- `spec.md` written directly to `{pasta_pbi}/spec.md`, following `references/specify.md`'s format — CA normalized to WHEN/THEN/SHALL, edge cases surfaced, every line with a Requirement Traceability ID
- `Cenários e2e` present in `spec.md` **before** any task is written: every requirement that
  describes a user flow either has an `E2E-NN` scenario naming it, or a line in the "Fora do
  e2e" table saying why not — no requirement silently uncovered, no scenario invented later at
  coding time
- `task.md` written directly to `{pasta_pbi}/task.md`, following `references/tasks.md`'s format — atomic tasks with What/Where/Depends on/Reuses/Requirement/Tools/Done when/Tests/Gate/Commit, `[P]` markers only where dependency + test parallel-safety both allow
- Neither file goes through any canonical-docs authoring skill, and neither touches this project's tracker-sync artifact — both are this skill's own working state
- Every backend/frontend/UI task's `Tools` field carries the specialist skill resolved via `references/gap-routing.md`, derived fresh from `.makuco/docs/codebase/*` — no hardcoded stack keyword
- `skills_necessarias` in `sessao-dev.md` aggregates the full set of specialist skills used across `task.md`
- Backend tasks ordered before frontend tasks in the same PBI (AD-004)
- Any frontend task without an existing `DESIGN.md`/`EXPERIENCE.md` pair triggers `makuco-ux` first (if installed) before that task is finalized/emitted — or a warning + generic generation if not installed, never a block
- Safety valve stated and checked when the task breakdown grows past ~5 phases or its dependency graph gets hard to state cleanly
- All three mandatory validation checks (Granularity, Diagram-Definition Cross-Check, Test Co-location) run and pass before presenting to the user
- Explicit user approval obtained before routing to `step-04-implementar.md`
- `sessao-dev.md` updated: `spec_construido: true`, `total_tasks`, `skills_necessarias`, `stepsCompleted: [1, 2, 3]`, `proxima_fase: 'implementar'`
