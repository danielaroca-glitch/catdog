# Quality Gate Routing

**Goal**: Decide **which** quality gates run **when** during `makuco-desenvolver`'s flow, how each one is scoped to the change at hand, and how the flow degrades when a tool isn't available — without duplicating the gate definitions themselves.

This reference is a **contract**, not a methodology. The gates are defined once, in the `makuco-quality-gate` skill. This file only routes to them.

---

## Why Delegate Instead of Port

`SKILL.md` explains why the spec/task methodology lives **inside** this skill's `references/`: it is not a separate skill, so nothing in the flow can be missing at runtime.

`makuco-quality-gate` is the opposite case. It is a real skill installed alongside this one. Duplicating it here would create a second source of truth for gate definitions and thresholds that would drift. So this skill **invokes** it at runtime, with the same install-check-and-degrade discipline used for the specialist skills in [gap-routing.md](gap-routing.md).

---

## The Split: Per-Task vs. Closeout

The gates are split by cost. Gates that run on local files in seconds run on every task, before every commit. Gates that need a Docker container, a full test run with coverage, or a remote SonarQube server run once, at PBI closeout.

**Which gates each scope runs is defined only in `makuco-quality-gate`'s `## Scoped invocation` table** — `per-task` and `full`. The table below is a convenience map of **gate → file list and cost**; it must stay in sync with that table, and if the two ever disagree, that table wins. Never derive scope membership from here, and never drop a gate because this file doesn't list it.

| Gate | Declared at | File list it applies to |
| --- | --- | --- |
| 0 — Scope Coverage & Diff Analysis | per task (step-04) | that task's diff |
| 1 — Static Analysis (compile + lint) | per task (step-04) | files the task changed |
| 3 — Complexity Analysis | per task (step-04) | `complexity-check` output filtered to the task's files |
| 4 — Code Pattern Compliance | per task (step-04) | files the task changed |
| 2 — Test Execution & Coverage | closeout (step-05 §2b) | the whole PBI's diff |
| 5 — SonarQube Analysis | closeout (step-05 §2b) | the whole PBI's diff |
| 6 — Checklist Verification | closeout (step-05 §2b) | `task.md` + `spec.md` |

At closeout the scope is `full`, so the gates listed above as "per task" run again over the PBI's whole diff — except where step-05 §2b already has their result (Gate 1, from the Build-tier run), which is reported as-is instead of re-run.

**Why Sonar isn't per-task:** `sonar-run` starts a `sonarsource/sonar-scanner-cli` Docker container and, with `sonar.qualitygate.wait=true`, blocks on the server's quality gate. One run per commit would dominate the wall-clock of every task. Running it once against the accumulated PBI diff finds the same new issues.

**Why coverage isn't per-task:** the per-task tier gate already runs the task's own tests. A coverage threshold is only meaningful against the PBI's full set of changed files, which doesn't exist until the last task lands.

---

## Declaring the Scope

`makuco-quality-gate` accepts a scoped invocation (see its own `## Scoped invocation` section). Always declare it explicitly — never leave it to default:

- **Per task** (step-04, before the commit): scope `per-task`, plus the list of files this task changed.
- **At closeout** (step-05 §2b, fully-complete PBIs only): scope `full`, plus the list of files the whole PBI changed.

---

## Scoping Each Gate to the Diff

A gate that reports on untouched code produces noise the task can't act on. Scope every gate:

- **The changed-file list** — `git diff --name-only` against the task's own starting point (per task) or against the PBI's base (at closeout). This list is what gets handed to the skill; it is not re-derived inside a gate.
- **Gate 3 (`complexity-check`)** — the tool's `path` argument only sets the analyzer's root; everything below it gets analyzed, so `path` **does not scope down to individual files**. Pass the narrowest directory containing the changed files, then **filter the returned lines to the changed-file list** — remembering that returned paths are relative to `path`, not to the repo root. Findings outside that list are pre-existing and belong in `.makuco/STATE.md` as deferred ideas, not in this task.
- **Gate 5 (`get-sonar-issues`)** — pass `filters.directories` with the directories touched by the PBI. Compare against what was there before: only issues **newly introduced** by this PBI block closeout.
- **Gate 2 (coverage)** — measure the ≥80% threshold on the PBI's changed files, not on the whole project.

---

## No Double Runs

Gate 1 (static analysis) overlaps with the tier gate the task already ran in VERIFY:

- If the task's tier gate (`quick`/`full`/`build`, commands from the project's own `TESTING.md`) **already ran** compile/type-check and lint, Gate 1 records that result and does **not** re-execute the same commands.
- Gate 1's full build-system discovery (Maven, Gradle, npm, Python, Makefile, CI pipeline parity) only kicks in when `TESTING.md` doesn't define those commands — that is, when there is no tier-gate coverage to reuse.

Likewise at closeout: step-05 §2b's Build-tier run already covers Gate 1 for each touched repo. The closeout invocation reuses that result rather than running build+lint twice.

---

## Degradation — Never Block Delivery

Same principle as [gap-routing.md](gap-routing.md)'s DEV-10: a missing tool degrades the depth of the check, it never halts the task. Cascade, in order:

1. **`makuco-quality-gate` not installed** — warn once, then apply the inline fallback: compile and lint via the project's own scripts, plus these thresholds by hand — cyclomatic complexity ≤10 per function, ≤50 lines per function, ≤500 lines per file. Continue. The fallback is **always inline**; a missing skill is never worked around by invoking a `makuco-*` agent that happens to run the gate.
2. **`makuco-mcp` not available** (no `complexity-check`, no `sonar-run`, no `get-sonar-issues`) — fall back to the same manual thresholds for Gate 3, and report Gate 5 as **SKIP (MCP unavailable)**. Continue.
3. **Docker not available** — `complexity-check` and `sonar-run` both run containers and will fail with a raw spawn error. Treat that as a tooling gap, not a gate failure: report the gate as **SKIP (Docker unavailable)**, record it as a Blocker in `.makuco/STATE.md` at closeout, continue.
4. **`SONAR_URL` / `SONAR_TOKEN` not configured** — `sonar-run` returns `SonarQube URL or token not configured.` without attempting anything. Report Gate 5 as **SKIP (credentials not configured)**. Continue.

**A gate that cannot run is reported as SKIP with its reason — never silently omitted, and never reported as PASS.**

---

## What Blocks

- **Per task:** an unresolved finding from any gate in scope `per-task` **blocks the commit** for that task. Fix it, re-run the gate, then commit. Never commit a task with an open finding.
- **At closeout:** an unresolved finding from any gate **blocks marking the PBI done** — same rule and same escape hatch as step-05 §2b's Build-tier gate. If the finding is genuinely pre-existing and unrelated to this PBI (confirm via `git stash` that it reproduces without the PBI's changes), record it as a Blocker and report it in the closing summary instead of fixing it.
- **A SKIP never blocks.** It gets reported, in the task notes (per task) or in the closing summary (at closeout).

---

## Tips

- Hand the skill the changed-file list; don't make it guess the scope from the working tree.
- A complexity finding in code the task didn't touch is a deferred idea, not a blocker — the scope-to-diff rule exists so pre-existing debt doesn't stall unrelated work.
- Report the gate result where it will be read: per-task results in the task's notes, the closeout table in the closing summary.
