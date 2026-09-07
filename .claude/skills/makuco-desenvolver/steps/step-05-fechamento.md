# Step 5: Closeout

## MANDATORY RULES

- This is the **terminal step** of `makuco-desenvolver` — there is no `step-06`. It ends in a summary to the user, not a route to another step file.
- A **fully-complete PBI is never marked done on a red build/type-check, nor on an open quality-gate finding.** Before completion, step 2b runs the Build-tier gate for every repo the PBI touched **and** the full quality gate (`makuco-quality-gate` at scope `full` — the gates that scope runs are listed only in that skill's `## Scoped invocation` table, never here). A non-zero build or an unresolved finding blocks done-marking unless it is an explicitly-confirmed pre-existing failure recorded as a Blocker. A gate reported as SKIP (tool unavailable) does not block, but is always reported.
- Memory (decisions/blockers/lessons/deferred ideas) is recorded into `.makuco/STATE.md`. Primary path: delegate the write to the memory skill (`makuco-memory`) **if it is installed in this project** — discover its presence at runtime, never assume it exists just because this skill's own docs mention it. Fallback: write directly into `.makuco/STATE.md` yourself, under that file's own sections (Decisions Log / Blockers / Lessons Learned / Deferred Ideas) — no branding, no project-specific naming baked in.
- Status sync with an external tracker is **one-directional: local → tracker, never the reverse.** This step pushes the locally-known outcome (PBI done, or still in progress) onto the configured work-item. It never reads the tracker's current state back and lets it overwrite anything in `sessao-dev.md` or `.makuco/STATE.md`.
- **Never move a work item to its terminal/closed/finalized state without explicit user confirmation** — closing/finalizing a card is high-visibility and must be a deliberate, confirmed action, never automatic. The gate itself (prompt, options, decline behaviour) is owned and worded canonically by the Azure DevOps integration skill; this step invokes it and honors the outcome, it does not re-specify it. Non-terminal transitions (in-progress) need no confirmation.
- Status sync only runs when `sessao-dev.md`'s `modo` is `ado` (i.e. `.makuco/integrations/azure-devops.yml` is configured). When `modo` is `local-only`, skip this entirely — no error, no apology, just skip.
- Never hardcode a tracker org/project name, a literal integration-tool name, or a work-item state name here — resolve the integration skill and its state names from `.makuco/integrations/azure-devops.yml`, exactly as step-01 already did to read the item.
- A HANDOFF record is only written when the PBI is **not** fully done (some tasks in `task.md` remain, or the user is explicitly pausing mid-PBI). When every task is complete, there is nothing to resume — mark the PBI done instead of writing a handoff.
- Close `sessao-dev.md`'s frontmatter last, after memory, handoff/done-marking, and status sync all landed — never mark the session closed before its trailing effects actually happened.

---

## SEQUENCE

### 1. Confirm entry state

From `{pasta_pbi}/sessao-dev.md`, confirm `stepsCompleted` includes `[1, 2, 3, 4]` and `proxima_fase: 'fechamento'`. If either is missing, step-04 didn't actually finish its pass — go back to it rather than closing out a session that isn't ready.

### 2. Determine the session outcome

Read `{pasta_pbi}/task.md`'s checklist:

- **Every task checked off** (or quick-mode's single deliverable landed): the PBI is **fully complete**.
- **Some tasks remain** (the user stopped mid-pass, hit a blocker step-04 couldn't resolve, or explicitly asked to pause): the PBI is **pausing mid-flight**.

If it's ambiguous whether the user wants to stop here or go back and finish the remaining tasks, ask before proceeding:

> "Ainda restam tasks pendentes em `task.md`. Quer encerrar a sessão aqui (deixando um handoff para retomar depois) ou voltar ao passo 4 para concluir?"

**STOP — wait for the answer if genuinely ambiguous.** If the invocation already made "wrap up now" explicit, proceed without asking.

### 2b. Final quality gate (fully-complete PBIs only)

When the outcome is **fully complete**, two things run before the PBI is marked done: each touched repo's **Build-tier** gate, then the **full quality gate**. Skip this whole step when the outcome is *pausing mid-PBI* — a handoff, not a completion, is being written.

#### 2b.1 — Build-tier gate, per touched repo

Run each touched repository's Build-tier gate — even if no individual task declared a `build` gate. Per-task gates frequently run only the test tier, and some test runners transpile loosely without full type-checking, so a compile/type error can survive every per-task gate and only surface at build time. This is the PBI-level safety net that catches it.

For **each repository touched by this PBI**:

1. Look up the Build-tier command in that repo's `TESTING.md` (Gate Check Commands). If it defines a build / compile / type-check command (e.g. `npm run build`, `tsc`, `mvn compile`, `go build`), run it.
2. If `TESTING.md` names none but the project clearly has one (a `build` script in `package.json`, a compiler config like `tsconfig.json`), run that.
3. **Non-zero exit = the PBI is NOT done.** Either fix it and re-run, or — if it is a genuinely pre-existing failure unrelated to this PBI (confirm via `git stash` that it reproduces without this PBI's changes) — record it as a Blocker in step 3 and report it in the summary. Never mark the PBI complete on a red build without this explicit pre-existing determination.
4. If the project has no build/type-check step at all (interpreted project with only a test tier), skip this gate — note it, don't fabricate one.

#### 2b.2 — Full quality gate

The per-task loop in step-04 ran only the cheap gates on each task's own diff. The expensive ones were deferred to here, where they run once against the PBI's accumulated diff. Read [references/quality-gate.md](../references/quality-gate.md) for the split and the degradation rules; it is the routing contract, and this step does not restate the gate definitions.

Invoke the `makuco-quality-gate` **skill** at scope **`full`**, passing the list of files the whole PBI changed (`git diff --name-only` against the PBI's base). Invoking it means loading that skill in this context — never spawn a `makuco-*` agent to run the gate. **Which gates scope `full` runs is defined only by that skill's `## Scoped invocation` table** — never enumerate them here, and never drop one because this step doesn't mention it. What this step adds on top of the scope, for the gates that scope does run, for this flow only:

- **Gate 1 (static analysis)** — already covered by 2b.1's Build-tier run for each repo. Report that result; do **not** re-run build+lint.
- **Gate 2 (tests & coverage)** — the threshold for this flow is ≥80% line coverage measured **on the PBI's changed files**, not on the whole project.
- **Gate 3 (complexity)** — `complexity-check`'s `path` argument only sets the analyzer's root, so filter the returned findings to the changed-file list.
- **Gate 5 (SonarQube)** — **mandatory whenever `sonar-project.properties` exists in the repo root.** Run `sonar-run`, then `get-sonar-issues` with `projectKey` read from that file's `sonar.projectKey` and `filters.directories` scoped to the directories the PBI touched. Only issues, hotspots, and duplication **newly introduced by this PBI** count. Never skip this gate because it is slow — it is the one gate the per-task loop deliberately does not run.
- **Gate 6 (checklist verification)** — the checklist for this flow is `{pasta_pbi}/task.md`'s "Done when" items plus `{pasta_pbi}/spec.md`'s Requirement Traceability table. Every item must be genuinely satisfied by the code, not just checked off.

Then:

- **Unresolved finding = the PBI is NOT done.** Fix it and re-run the affected gate, or — if it is genuinely pre-existing and unrelated to this PBI (same `git stash` determination as 2b.1 step 3) — record it as a Blocker in step 3 and report it in the summary.
- **A gate that could not run** (`makuco-quality-gate` not installed, `makuco-mcp` unavailable, Docker missing, `SONAR_URL`/`SONAR_TOKEN` not configured) is reported as **SKIP with its reason** per `quality-gate.md`'s degradation cascade. A SKIP does not block done-marking — but it is never reported as PASS and never silently omitted from the summary.
- Carry the per-gate PASS/FAIL/SKIP result forward into step 7's summary table.

### 3. Record memory

Gather what surfaced during steps 1–4 that's worth remembering beyond this single session:

- **Decisions** — architectural/implementation choices with lasting effect (e.g. a routing divergence noted in step-04's Step 0, a `SPEC_DEVIATION` marker added during implementation, a quick-mode-vs-full-loop call).
- **Blockers** — anything that stopped or slowed a task and wasn't fully resolved (a missing specialist skill, an ambiguous CA that needed a stop-and-ask, an environment/dependency issue, a pre-existing build or quality-gate failure accepted in step 2b, a gate reported as SKIP because its tooling was unavailable).
- **Lessons learned** — anything discovered about the codebase, test setup, or process that would help a future session avoid repeating the same investigation.
- **Deferred ideas** — anything raised during spec/task generation or implementation that was explicitly pushed out of this PBI's scope.

Check for a skill that owns this kind of persistent memory (`makuco-memory`) installed in this project:

- **Installed:** hand it the gathered items and let it follow its own event→action rules to write them into `.makuco/STATE.md`. Do not duplicate its write by also writing the same entries directly.
- **Not installed:** write directly into `.makuco/STATE.md` yourself, appending (never overwriting existing content) under sections shaped like:
  - `## Recent Decisions` — one entry per decision: title, date, decision, reason, trade-off, impact.
  - `## Active Blockers` — one entry per unresolved blocker: discovered date, impact, workaround (if any), resolution path.
  - `## Lessons Learned` — one entry per lesson: context, problem, solution, what it prevents next time.
  - `## Deferred Ideas` — one line per idea, tagged with which PBI/feature it was captured during.

  If `.makuco/STATE.md` doesn't exist yet, create it with just these sections populated — don't invent unrelated sections or port branding/terminology from any other project.

Skip this step's write entirely only if steps 1–4 produced genuinely nothing worth remembering (rare) — don't pad `.makuco/STATE.md` with empty-content entries.

### 4. Write a handoff, or mark the PBI done

Based on the outcome from step 2:

- **Pausing mid-PBI:** produce a handoff record — via `makuco-memory` if it owns handoff records too (same install-check as step 3), or written directly to `.makuco/HANDOFF.md` (overwriting any previous content there, it is a snapshot of the *current* pause, not a log) if the skill isn't installed. Either way, the record covers:
  - PBI identification (`titulo`, `item_id`/`ado_id` if any, `pasta_pbi`).
  - Completed so far: which tasks in `task.md` are checked off.
  - In progress: the specific task that was interrupted, and where (file/line if applicable).
  - Pending: the remaining tasks in dependency order.
  - Blockers: anything already logged in step 3 that's still open.
  - Context: current git branch, any uncommitted changes (there should be none if step-04's one-task-one-commit discipline held — flag it if there are), and a pointer back to `.makuco/STATE.md` for the fuller decision/blocker history.
- **Fully complete:** no handoff needed. Instead, note the completion plainly in `.makuco/STATE.md`'s current-work marker (if that convention is in use) so a future session doesn't go looking for a handoff that doesn't exist.

### 5. Sync status to the tracker (ado mode only)

Read `modo` from `sessao-dev.md`:

- **`local-only`:** skip this step entirely. No message needed beyond what's already in the final summary (step 7).
- **`ado`:** invoke the Azure DevOps integration skill configured in `.makuco/integrations/azure-devops.yml` (resolved by name/entry point from that config, never hardcoded) to push the outcome from step 2 onto the work item, mapped through that config's own states:
  - Fully complete → the config's "done"/equivalent state. **This is a terminal transition — CONFIRM with the user before applying it** (see below).
  - Pausing mid-PBI → the config's "in progress"/equivalent state (or leave it as whatever "in progress" already is if no better state fits — never push "done" for partial work). Non-terminal → no confirmation needed.

  **Confirm before finalizing (MANDATORY).** The integration skill owns this gate — its "Confirm before closing / finalizing" section is the canonical wording, prompt, and options. Let it run; do not restate or improvise a variant of it here, and never push a terminal state that hasn't cleared it. The one consequence this step adds on top: if the user declines, the tracker state stays untouched **and the decline is noted in the closing summary** (step 7).

  This is a **write only**: read nothing from the tracker to reconcile back into `sessao-dev.md`, `task.md`, or `.makuco/STATE.md`. If the push fails (auth, network, stale item), report it plainly to the user and continue closing out the local session anyway — a failed remote sync never blocks local closeout.

### 6. Close `sessao-dev.md`

The `status` written here depends on the outcome classified back in step 2 — the same
fully-complete vs. pausing-mid-PBI split that drove the handoff record and the tracker sync:

- **Fully complete:**

  ```yaml
  status: 'done'
  stepsCompleted: [1, 2, 3, 4, 5]
  proxima_fase: 'concluida'   # cleared of any next-step name — this session has nothing left to route to
  ```

- **Pausing mid-PBI:**

  ```yaml
  status: 'paused'
  stepsCompleted: [1, 2, 3, 4]   # step 5 did not close the PBI — do not claim it did
  proxima_fase: 'implementar'    # or whatever phase the work actually stopped in
  ```

`paused` is the state-contract counterpart of the handoff record: it says the work has saved
state to come back to, which is exactly what the handoff file holds. The makuco engine keeps
deriving this PBI as work — resuming, not starting over — and keeps it out of the completed
count. `done` is the only value that counts the PBI as finished, so never write it for partial
work, for the same reason the tracker sync above never pushes a terminal remote state for a
partial pass.

Leave every other field (`item_id`, `ado_id`, `pasta_pbi`, `skills_necessarias`, `riscos`, etc.) as already recorded — step 5 only ever appends/closes, never rewrites history from earlier steps.

### 7. Present the closing summary

There is no next step file to route to inside this skill — but for a **fully-complete** PBI the work is not reviewed yet, and green tests plus a passing quality gate are not a review. Point the user at `makuco-code-review` (PBI mode, on this `pasta_pbi`) as the next action; it validates each acceptance criterion against the code and returns APROVADO or NECESSITA CORREÇÕES, and a NECESSITA CORREÇÕES comes back here for the affected tasks. Not installed → say so and note that the PBI is closing unreviewed; never block on it.

A **paused** PBI gets no such pointer — there is nothing complete to review yet.

Present the summary:

> "## ✅ Desenvolvimento Concluído — {titulo}
>
> **PBI:** `{pasta_pbi}`
> **Status:** {Concluída — todas as {N} tasks implementadas | Pausada — {X}/{N} tasks concluídas}
>
> ### Commits realizados:
> {lista ou contagem de commits desta sessão, um por task, per RED→GREEN→VERIFY→COMMIT}
>
> [se concluída:] ### Quality Gate:
>
> | Gate | Status | Detalhe |
> | --- | --- | --- |
> | {uma linha por gate do escopo `full`, na ordem da tabela `## Scoped invocation` do `makuco-quality-gate` — nenhum gate do escopo fica fora} | APROVADO/REPROVADO/PULADO | {evidência: comandos rodados, cobertura % nos arquivos alterados, maior complexidade no diff, issues/hotspots/duplicação novos, itens de checklist aprovados/total, ou o motivo do PULADO} |
>
> {para cada PULADO: o motivo — skill não instalada, MCP indisponível, Docker ausente, SONAR_URL/SONAR_TOKEN não configurados}
> {para cada achado aceito como pré-existente: o que é e por que não bloqueou}
>
> [se houver:] ### Itens adiados:
> {lista de deferred ideas registradas em `.makuco/STATE.md`}
>
> ### Memória:
> {registrado via `makuco-memory` | registrado diretamente em `.makuco/STATE.md`} — decisões, blockers e lições desta sessão.
>
> [se `modo: ado`:] ### Tracker:
> {Status sincronizado local→tracker: work item movido para '{estado aplicado}'. | Finalização recusada — work item mantido em '{estado atual}'. | Sync falhou: {motivo} — work item não atualizado.}
>
> [se pausada:] ### Retomar depois:
> Handoff salvo em `.makuco/HANDOFF.md` (ou via `makuco-memory`) — {resumo de uma linha do que falta}.
>
> [se concluída:] ### Próximo passo:
> A PBI está implementada, mas ainda **não revisada** — gate verde não é review. Rode `makuco-code-review` nesta PBI (`{pasta_pbi}`) para validar os critérios de aceite contra o código. Se o veredito for NECESSITA CORREÇÕES, volte para cá nas tasks apontadas."

---

## SUCCESS METRICS

- Entry state confirmed (`stepsCompleted` includes `[1, 2, 3, 4]`, `proxima_fase: 'fechamento'`) before doing anything else
- Session outcome correctly classified as fully complete vs. pausing mid-PBI, based on `task.md`'s actual checklist state — not assumed
- For a fully-complete PBI, the Build-tier gate ran green for every touched repo before done-marking (step 2b.1) — or a red result was confirmed pre-existing and logged as a Blocker; a fully-complete PBI was never marked done on an unexplained red build
- The full quality gate ran at scope `full` with the PBI's changed-file list (step 2b.2), Gate 1 reusing 2b.1's Build-tier result instead of re-running build+lint; every finding was either resolved or confirmed pre-existing and logged as a Blocker
- Gate 5 (SonarQube) was never skipped for cost when `sonar-project.properties` existed — `sonar-run` then `get-sonar-issues` ran with `projectKey` from `sonar.projectKey` and `filters.directories` scoped to the PBI's directories; only newly-introduced issues/hotspots/duplication were treated as blocking
- Any gate that could not run was reported as SKIP with its reason (skill absent, MCP unavailable, Docker missing, Sonar credentials unset) — never reported as PASS, never omitted from the summary, and never used as grounds to block done-marking
- Decisions, blockers, lessons learned, and deferred ideas from steps 1–4 captured into `.makuco/STATE.md` — via `makuco-memory` when installed (checked at runtime, never assumed), via direct append following the generalized Decisions/Blockers/Lessons/Deferred-Ideas record shapes when it isn't
- A handoff record produced only when work is pausing mid-PBI, never when the PBI is fully done; a fully-done PBI marked as such instead
- Tracker status sync attempted only when `modo: ado`; skipped silently (no error) when `modo: local-only`
- A terminal/finalized-state transition ran through the integration skill's own confirm-before-finalize gate before being pushed (never applied automatically, never re-worded locally); a declined confirmation left the tracker state untouched and was reported in the closing summary
- Tracker sync is strictly local→tracker: the outcome determined locally is pushed to the work item; nothing read back from the tracker overwrites `sessao-dev.md`, `task.md`, or `.makuco/STATE.md`
- A failed tracker sync is reported but never blocks the rest of closeout
- No literal tracker org/project name, integration-tool name, or work-item state name hardcoded anywhere in this step — all resolved from `.makuco/integrations/azure-devops.yml` at runtime
- `sessao-dev.md` closed last, only after memory/handoff/sync already landed — `status: 'done'` + `stepsCompleted: [1, 2, 3, 4, 5]` + `proxima_fase` cleared to a terminal marker when fully complete; `status: 'paused'` with `stepsCompleted` and `proxima_fase` left at where the work actually stopped when pausing
- `status: 'done'` never written for partial work — same rule as the terminal tracker state, and the field the makuco engine counts as a finished PBI
- A closing summary presented to the user covering PBI status, commits made, the quality-gate result table (fully-complete PBIs), deferred items, where memory was recorded, tracker sync result (if applicable), and handoff pointer (if pausing) — with no further step file to route to
