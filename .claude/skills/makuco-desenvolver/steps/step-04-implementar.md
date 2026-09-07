# Step 4: Implement

## MANDATORY RULES

- Execute `task.md`'s tasks in dependency order, respecting `[P]` parallel groups and the backend-before-frontend ordering (AD-004) already applied when `task.md` was written.
- For every task, **Step 0** runs before any code for that task is read or written: re-check the task's domain against [references/gap-routing.md](../references/gap-routing.md)'s Checkpoint 2 (execute time). If it maps to `makuco-backend`, `makuco-frontend`, or `makuco-ux`, invoke that specialist skill first and follow its handoff/conventions for the rest of the task. If the mapped skill isn't installed, warn once and continue with the generic discipline in [references/implement.md](../references/implement.md) — never block.
- After Step 0, run the rest of [references/implement.md](../references/implement.md)'s loop as-is: RED → GREEN → VERIFY (mandatory gate, tier from `task.md`, commands sourced from the target project's own `TESTING.md`) → Post-Gate review → scoped Quality Gate → atomic Commit. Never skip or weaken either gate.
- The **scoped quality gate runs after the Post-Gate review and before the commit** — `makuco-quality-gate` invoked at scope `per-task` per [references/quality-gate.md](../references/quality-gate.md). An unresolved finding blocks the commit. A gate that can't run is reported as SKIP with its reason and does not block. This carries the same weight as the tier gate: never skipped, never weakened, never run after the commit.
- The quality gate runs **in this context, or in the generic sub-agent running this task's loop** — never by invoking a `makuco-*` agent definition. `makuco-quality-gate` is a skill, not an agent: invoking it means loading that skill here, not spawning an agent to run it.
- One task = one commit. Never batch multiple tasks into one commit, never commit a task that hasn't passed its gate.
- Tests are never modified to make them pass, never deleted, never skipped/disabled to bypass a failure — this file inherits every hard constraint from `implement.md` verbatim.
- Update `task.md`'s checklist and `spec.md`'s Requirement Traceability table after every task, not in a batch at the end.
- If the whole PBI is trivial (≤3 files, one-sentence scope), [references/quick-mode.md](../references/quick-mode.md) may replace this whole per-task loop — same quality bar, less ceremony. This is a judgment call made once, before starting task 1, not per task.

---

## SEQUENCE

### 1. Confirm entry state

From `{pasta_pbi}/sessao-dev.md`, confirm `stepsCompleted` includes `[1, 2, 3]`, `spec_construido: true`, and `total_tasks` and `skills_necessarias` are populated. If any of these is missing, step-03 didn't complete correctly — go back to it rather than improvising a task list here.

### 2. Decide: full per-task loop vs quick mode

Before starting task 1, check whether the whole PBI still fits [references/quick-mode.md](../references/quick-mode.md)'s bar: describable in one sentence, ≤3 files total across every task in `task.md`.

- **Fits:** use quick-mode's process instead of the per-task loop below. Same RED→GREEN→VERIFY→commit discipline, same gate check, just without the full execution-template ceremony per task. Note this choice in `sessao-dev.md` (see step 7 below) and skip to step 6 once quick-mode's single commit lands.
- **Doesn't fit (the normal case for anything that reached full spec+tasks):** continue with the per-task loop below.

### 3. Read the execution plan

Load `{pasta_pbi}/task.md`'s Execution Plan and Parallel Execution Map. This defines the order: phases in sequence, tasks within a `[P]` group eligible for concurrent execution, backend phases before frontend phases (AD-004, already baked into the plan by step-03).

### 4. For each task, in order: run the implementation loop

For every task (or every task in a `[P]` group, handled concurrently per step 5 below):

#### 4.0 — Step 0: re-check specialist routing (execute-time checkpoint)

Per [references/gap-routing.md](../references/gap-routing.md) Checkpoint 2 — this is a **re-check**, not a reuse of the planning-time assignment recorded in `task.md`'s `Tools` field:

1. Re-run the routing check for this specific task against the current codebase state.
2. **Matches the planning-time assignment:** proceed, invoke the mapped skill(s) now, before reading or writing any code for this task.
3. **Diverges** (codebase shifted since step-03, or the planning-time guess was wrong): invoke the newly-derived skill(s) instead, and note the change in the task's entry in `task.md` — never silently keep executing under the stale assignment.
4. **Mapped skill not installed:** warn once, proceed with the generic discipline in `implement.md` — never block.
5. **Maps to no specialist domain** (pure config/docs/infra scripting): skip straight to 4.1.

Follow the invoked skill's own handoff instructions and conventions for the remainder of this task — they take precedence over the generic guidance below wherever they overlap.

#### 4.1 — Run the RED→GREEN→VERIFY→COMMIT loop

Apply [references/implement.md](../references/implement.md) steps 0–10 to this task exactly as written there:

1. State assumptions, files to touch, success criteria (Pre-Implementation).
2. Verify this task's `Depends on` are already done; if blocked, stop and ask rather than reordering silently.
3. **RED** — write the task's `Tests` (per its field in `task.md`) before any implementation; confirm they fail.
4. **GREEN** — minimum implementation to satisfy "Done when"; never modify/weaken/delete/skip the tests written in RED.
5. **VERIFY** — run the gate check at this task's `Gate` tier (quick/full/build), commands sourced from the target project's own `TESTING.md`. Non-zero exit = STOP, fix, re-run. Do not proceed on a red gate.
6. **Post-Gate review** — test count check (no silent deletions), `SPEC_DEVIATION` marker added if implementation diverged from spec/design, altitude read on complexity.
7. **Scoped Quality Gate** — `implement.md` step 7b: invoke `makuco-quality-gate` at scope `per-task` with this task's changed-file list, per [references/quality-gate.md](../references/quality-gate.md). Unresolved finding = fix, re-run, do not commit. Tool unavailable = SKIP with reason, continue.
8. **Commit** — one atomic commit for this task, Conventional Commits 1.0.0, referencing what was done.

### 5. Delegation to sub-agents

Tasks may be executed by sub-agents rather than inline. A "sub-agent" here is a **generic worker** — a plain delegation of this same loop with the payload below. It is never one of the `makuco-*` agent definitions: those belong to a different, agent-driven flow and are never invoked from this skill.

- **`[P]` group:** one sub-agent per task in the group, run concurrently.
- **Sequential tasks:** one sub-agent at a time, in dependency order — or run inline; either is acceptable as long as the loop in step 4 is followed unmodified.

Each sub-agent receives, and only receives:

- That task's own definition from `task.md` (What/Where/Depends on/Reuses/Done when/Tests/Gate) — never other tasks' definitions.
- The relevant coding conventions (the `makuco-code-practices` skill, and the invoked specialist skill's conventions from Step 0, if any).
- The target project's own `TESTING.md`, if it exists.
- [references/quality-gate.md](../references/quality-gate.md) — the sub-agent runs the scoped quality gate itself, as part of the loop, before its own commit. A sub-agent never commits on an open finding.
- Any spec/design context this specific task references (relevant slice of `spec.md`, `DESIGN.md`/`EXPERIENCE.md` if the task is frontend/UI) — not the full session history.

The sub-agent runs the loop in step 4 and reports back: done/blocked/partial, tier-gate result, scoped quality-gate result (per gate, including any SKIP and its reason), commit hash. This orchestrating flow (step-04 itself) keeps all planning and validation — it decides what happens next (proceed, re-route, stop for the user), it never delegates that judgment to the sub-agent.

### 6. After each task completes

1. Mark the task's checkbox complete in `{pasta_pbi}/task.md`.
2. Update `{pasta_pbi}/spec.md`'s Requirement Traceability table: progress the status of every Requirement ID this task satisfies.
3. If implementation diverged from spec/design, confirm the `SPEC_DEVIATION` marker (per `implement.md` step 7) was actually added at the point of divergence — don't just note it in chat.
4. Update `{pasta_pbi}/sessao-dev.md` progressively (see step 7) — do not wait until every task is done to touch it once.

### 7. Update `sessao-dev.md` progressively

After each task (or after the quick-mode commit, if step 2 took that path):

```yaml
stepsCompleted: [1, 2, 3, 4]   # once the first task of this step completes
```

Optionally track finer-grained progress (e.g. a running count of tasks done vs `total_tasks`) in the session file's own notes area if the template supports it — but the frontmatter contract only requires `stepsCompleted` and `proxima_fase` to be accurate at every point, never stale.

When every task in `task.md` for this pass is complete (or quick-mode's single deliverable is done and verified):

```yaml
stepsCompleted: [1, 2, 3, 4]
proxima_fase: 'fechamento'
```

This updates the fields shown above and nothing else. `status` stays `developing` for the whole
of this step, however many tasks land — the pass being finished is not the PBI being finished,
and `step-05-fechamento` is the only place that decides between `done` and `paused`.

### 8. Route to the next step

Load `./step-05-fechamento.md`.

---

## SUCCESS METRICS

- Every task in `task.md` executed in dependency order, respecting `[P]` groups and AD-004 (backend before frontend)
- Step 0 (execute-time gap-routing re-check) run before any code for every single task, even when the result is "no specialist" — never skipped, never assumed from planning time without re-checking
- A diverging routing result at execute time invoked the newly-derived skill and was noted, not silently executed under the stale planning-time assignment
- A missing specialist skill produced a warning and continued with the generic discipline — never blocked a task
- Every task followed RED→GREEN→VERIFY→Post-Gate→Quality Gate→Commit from `implement.md` unmodified — no test weakened, skipped, or deleted; gate check mandatory and non-negotiable at its assigned tier
- The scoped quality gate (`makuco-quality-gate`, scope `per-task`) ran for every task before its commit, with the changed-file list passed explicitly — every finding either resolved, or confirmed pre-existing and deferred to `.makuco/STATE.md`
- A quality gate that couldn't run was reported as SKIP with its reason and did not block; no skipped gate was reported as passing, and no gate was silently omitted
- One atomic commit per task (Conventional Commits 1.0.0); no task committed on a failing tier gate or on an open quality-gate finding; no batched multi-task commits
- `task.md`'s checklist and `spec.md`'s Requirement Traceability table updated after every task, not in a single end-of-pass batch
- `SPEC_DEVIATION` markers present wherever implementation diverged from spec/design
- `sessao-dev.md` kept current throughout (`stepsCompleted`), reaching `stepsCompleted: [1, 2, 3, 4]` and `proxima_fase: 'fechamento'` once the pass is complete
- Quick-mode substitution (when the whole PBI is trivial: ≤3 files, one-sentence scope) considered explicitly before task 1, applied instead of the full loop only when it genuinely fits, same quality bar maintained either way
- Sub-agent delegation, when used, respected scope isolation — each sub-agent received only its own task's definition, relevant conventions, `TESTING.md`, and the spec/design slice it needed — never other tasks' definitions or unrelated session history
- Correct routing to `step-05-fechamento.md`
