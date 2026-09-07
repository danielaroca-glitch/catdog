# Step 2: Context

## MANDATORY RULES

- **Load the full current content of every changed file**, not only the diff. Passes 3–7 are written expecting it, and pass 2's removed-behaviour check is impossible without it.
- **Never rely on the conversation** for requirements. If `spec.md` or a task file is missing, say so — do not reconstruct it from memory.
- **Read, never rewrite.** Every artifact opened here belongs to an upstream step.
- **Missing context splits two ways, and the split is not negotiable.** Missing *convention* context — the `<CODEBASE_DIR>` docs — degrades the review: warn once, record it, continue. Missing *requirement* context in PBI mode — `spec.md` or the reviewed task file — **stops the flow**: there is nothing left to measure compliance against, and a review that invents the criteria it is checking is worse than no review.
- Communicate in **PT-BR**.

---

## GOAL OF THIS STEP

Have in hand everything the seven passes need, loaded once, so no pass has to go looking for it — and know which context is missing, so the report can say so.

---

## SEQUENCE

### 1. The code under review

**Build the per-pass file sets first, then read.** The classification is the one in
[step-03 §2b](step-03-passes.md) — source vs. test vs. prose vs. data, and which passes each
file feeds. Doing it here instead of there is what stops the expensive read from happening for
files no pass needs in full: pass 7 judges placement, naming and dependency direction, and for
that the path plus the diff already say everything. Reading twenty full bodies to hand nineteen
of them to a pass that wanted paths is the waste this ordering removes.

So, for every file in `arquivos_alterados`:

- **Always**: its repo-relative path and its diff hunks.
- **Full current content**: only for the files that at least one pass judges whole — source that
  passes 3 or 6 will see, the source under test for pass 4, and anything handling input, secrets
  or external calls for pass 5.

For files whose enclosing functions extend beyond the hunks, that is exactly the point — a bug in an untouched line of a touched function is in scope, because the change re-exposed it. That is why the read is *narrowed by pass*, never by hunk: a file that a pass judges is read whole, always.

Record `arquivos_por_passe` alongside `arquivos_alterados` — step-03 reuses it instead of
classifying twice.

### 2. The PBI artifacts (PBI mode)

Read from `pasta_pbi` and `feature_folder`:

| Artifact                       | Why                                                                  |
| ------------------------------ | -------------------------------------------------------------------- |
| `spec.md`                      | Acceptance criteria and edge cases — the substance of pass 1.        |
| `task.md`                      | Each reviewed task's `Where`, `Done when`, `Tests` — pass 2's scope. |
| `sessao-dev.md`                | Which tasks and commits belong to this round; recorded deviations.   |
| `DESIGN.md` / `EXPERIENCE.md`  | Present only when a task touched UI — the dual contract for pass 2d. |

When any task implements UI, also consult `makuco-artifact-reference` to locate `{feature_dir}/references/references.md` and read it: it is the visual target the implementation was working against.

Note any `SPEC_DEVIATION` markers left in the code by `makuco-desenvolver`. They are declared divergences with a stated reason — read the reason before treating one as a finding. An undeclared divergence is a finding; a declared one is a judgement call about whether the reason holds.

### 3. The project conventions

Resolve `<CODEBASE_DIR>` from step-01 and read in this order, which is budgeted deliberately:

1. `OVERVIEW.md` — the module map. It tells you which module the changed files belong to.
2. That module's `modules/<slug>.md` — the boundaries this change has to respect. **Never enumerate the whole `modules/` folder**; read the one the change lands in.
3. `conventions.md`, `architecture.md`, `structure.md`, `testing.md` — the four files pass 7 measures against and pass 3 uses for naming and ubiquitous language.

Missing or empty: warn once —

> Os docs de codebase estão ausentes/incompletos em `{caminho}`. O pass 7 vai derivar os padrões direto do código (`makuco-project-research`), e os achados de convenção ficam menos precisos.

— record it for the report, and continue.

### 4. Prior round (round > 1)

Load the previous round's `critical` and `major` findings from `review.md`. Each one gets checked explicitly in step-03: fixed, partially fixed, or still open. A re-review that does not answer that question is not a re-review.

### 5. Sanity check

Before spending the fan-out, confirm three things:

- The changed files actually exist and are readable. A path in the diff that does not resolve means the scope was built against the wrong ref.
- PBI mode: at least one acceptance criterion maps to at least one reviewed task. If none do, the spec and the tasks are disconnected — raise it now, it is a finding in itself.
- The context volume is manageable. When the full content of the changed files is very large, say so and confirm the user wants a single round rather than silently truncating what the subagents receive. Truncated context produces confident findings about code nobody read.

### 6. Record

Update `sessao-review.md`: `stepsCompleted: [1,2]`, `proxima_fase: passes`, plus any context gaps found here so the report can state them.

---

## SUCCESS METRICS

- `arquivos_por_passe` built **before** any full body was read, and recorded for step-03 to reuse.
- Diff loaded for every file in `arquivos_alterados`; full content loaded for the files at least
  one pass judges whole — and **not** for the ones no pass needs whole.
- PBI mode: `spec.md` and the reviewed task file(s) read, or their absence reported to the user and the flow stopped.
- `<CODEBASE_DIR>` files read in the budgeted order, or their absence warned once and recorded.
- `modules/` was not enumerated wholesale.
- Round > 1: the previous round's blocking findings are loaded and ready to be re-checked.
- Context gaps recorded in the session, so the report can state what the review did not have.
- `stepsCompleted: [1,2]`.
