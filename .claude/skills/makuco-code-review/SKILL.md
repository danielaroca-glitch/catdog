---
name: makuco-code-review
description: 'Autonomous review skill that takes a finished change — a PBI implemented by makuco-desenvolver, or a loose branch/PR/working-tree diff — through seven review passes and produces a documented verdict. Runs passes 1–2 (spec/task compliance, diff analysis) itself and dispatches passes 3–7 to five parallel subagents loaded with makuco-reviewer-quality/-tests/-security/-bugs/-patterns, then dedups candidates, verifies every blocking finding against the real code, and decides APROVADO or NECESSITA CORREÇÕES. Never modifies code — it documents findings and hands the fixes back to makuco-desenvolver. Writes review.md through makuco-copy-writer in PBI mode; writes .makuco/reviews/ directly in diff mode. Triggers on: revisar PBI, code review, revisar PR, revisar branch, revisar meu diff, validar implementação, verificar o trabalho, rodar os passes de review, revisão de código, procurar bugs no que foi implementado, aprovar ou reprovar a entrega.'
---

# Makuco Code Review

`makuco-code-review` is an autonomous, step-file skill invoked directly by the user. It owns its own flow (steps 01→05) and its own session state (`sessao-review.md`), and it closes the trio `makuco-analisar` → `makuco-desenvolver` → `makuco-code-review`.

It is the **only** review entry point in the harness. The `makuco-reviewer` agent definition it replaced was removed once this skill covered the same seven passes; the three agents that remain are `makuco-copy-writer`, `makuco-documentation` and `makuco-quick`.

## HARD CONSTRAINT — no code, ever

This skill produces a document and a verdict. It never edits, fixes, refactors, or reformats a single line of the code under review, and it never commits. Separating who finds from who fixes is the whole point: a reviewer that patches its own findings has no one left to check them, and it stops being able to say "this is wrong" about work it now owns.

If the user asks for the findings to be fixed — during the review or after it — say so plainly and route the work to `makuco-desenvolver` for the affected tasks. Do not offer a "quick fix while we're here."

## Execution style

This is an evidence-gathering flow, not a conversation and not a code-change task. Two properties carry most of the value and neither is optional:

- **Read the full content of every changed file, not just the diff.** Most real defects live in the interaction between the new lines and the ones around them — a guard that used to run earlier in the function, a caller whose contract just changed. A diff-only reviewer cannot see any of that. The pass subagents are written expecting full file content, so short-changing them here silently degrades all five.
- **A finding that blocks approval gets verified before it is written down.** `critical` and `major` send the work back to development, so a false positive costs a full round trip. Step 04 re-examines each one against the code and drops the ones that do not survive.

## How the review stays fast

The review is expensive by nature — it reads whole files and verifies blocking findings before
writing them. Four mechanisms keep it from costing more than that floor, and each is enforced by
a step file, not by remembering:

| Mecanismo | Onde | Efeito |
| --------- | ---- | ------ |
| **Escopo incremental por rodada** | `references/diff-scope.md` §2 | Rodada N>1 revisa o que mudou desde a rodada N-1, não a branch inteira de novo. Corrigir 2 arquivos passa a custar 2 arquivos. |
| **Filtro por passe antes da leitura** | `steps/step-02-contexto.md` §1 | O corpo inteiro é lido só dos arquivos que algum passe julga inteiro. O passe 7 julga colocação, e para isso caminho + diff bastam. |
| **Leque primeiro, passes próprios depois** | `steps/step-03-passes.md` §1 | Os subagentes 3-7 são despachados **antes** dos passes 1-2. O orquestrador faz o trabalho dele enquanto eles rodam, em vez de deixá-los parados. |
| **Leque por latência** | `steps/step-03-passes.md` §2b | Cinco passes em paralelo terminam no tempo do mais lento; em série, na soma. Quem espera sente a soma. |

Two of those are ordering, not scope: they cost nothing and shorten the wait. The other two cut
real work, and they cut it where the work was redundant — never by skipping a pass.

**What is left is the floor, and it is deliberate:** the full body of the files that matter (most
real defects live in the interaction between the new lines and the ones around them), and the
verification of every `critical`/`major` before it is written down (a blocking false positive
costs a full round trip back through development — more than the check). Below that floor the
review stops being worth running. When someone needs it cheaper than the floor, the answer is a
narrower scope, offered in step-01 — not a faster pass.

## The two modes

The mode is **never presumed** — step-01 infers it and asks when the inference is not safe.

|               | **PBI** (default)                                         | **DIFF** (loose)                                            |
| ------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| Entry         | PBI id/slug, or a folder holding `sessao-dev.md`          | branch, PR, commit range, or the working tree               |
| Passes        | 1–7                                                       | 2–7 (pass 1 is `N/A` — no spec to check compliance against) |
| Extra context | `spec.md`, `task.md`, `DESIGN.md`/`EXPERIENCE.md`         | `<CODEBASE_DIR>` only                                       |
| Output        | `review.md` via `makuco-copy-writer` + `status.yml`       | `.makuco/reviews/{slug}.md`, written directly               |
| Verdict       | `APROVADO` / `NECESSITA CORREÇÕES` → `pbis.{slug}.review` | same verdict, no `status.yml`                               |

## Flow overview

```
step-01-escopo        → resolve MAKUCO_ROOT · detect mode PBI vs DIFF · resolve the diff scope ·
                        offer resume · seed sessao-review.md · number the review round
        ↓
step-02-contexto      → PBI: spec.md + task.md + sessao-dev.md + DESIGN/EXPERIENCE ·
                        both: <CODEBASE_DIR> in budgeted order + FULL content of every changed file
        ↓
step-03-passes        → passes 1–2 run here (PBI mode only) ·
                        passes 3–7 dispatched to 5 subagents IN PARALLEL, in a single message
        ↓
step-04-consolidar    → dedup by location+mechanism · verify every critical/major ·
                        drop non-findings · number sequentially · decide the verdict
        ↓
step-05-fechamento    → PBI: hand off to makuco-copy-writer (review.md + status.yml), then
                        makuco-documentation when APROVADO ·
                        DIFF: write .makuco/reviews/ directly · record lessons · report
```

Each step file is self-contained — load only the one the flow currently needs (progressive disclosure). Start every session by reading [steps/step-01-escopo.md](steps/step-01-escopo.md).

## Artifact layout

```
.makuco/docs/modules/module_NNN_name/feature_NNN_name/pbis/pbi-NNN-slug/
  ├─ sessao-review.md   (this skill's own session tracker — written directly)
  └─ review.md          (canonical artifact — written ONLY by makuco-copy-writer)

.makuco/reviews/
  ├─ {slug}.md                 (DIFF mode only — written directly, no status.yml)
  └─ .sessao-review-{slug}.md  (DIFF mode session tracker, one per target)
```

Review rounds **accumulate**. `makuco-artifact-review` models `## Rodada de revisão {N}`, so a second review of the same PBI appends round N+1 instead of overwriting round N — the history of what was found and fixed is part of the artifact's value.

## What this skill owns vs. delegates

- **Owns and writes directly**: `sessao-review.md` (its own working state) and, in DIFF mode only, the report under `.makuco/reviews/`. Neither is a canonical product doc, and neither touches `status.yml`.
- **Delegates the canonical artifact**: in PBI mode, `review.md` and the `status.yml` update go through `makuco-copy-writer`, formatted by `makuco-artifact-review`. See the note below.
- **Delegates passes 3–7**: to subagents loaded with `makuco-reviewer-quality` (3), `-tests` (4), `-security` (5), `-bugs` (6), `-patterns` (7). Those skills already define their own checklists and output format — this skill supplies context and consolidates, it does not restate their rules. A missing pass skill degrades to `SKIP` with a reason in the report; it never blocks.
- **Delegates the post-approval documentation**: on `APROVADO` in PBI mode, step-05 §1c invokes `makuco-documentation`, which updates the affected project docs and writes `learnings.md` through the copy-writer. This skill never writes those itself.
- **Delegates memory**: lessons and blockers go to `.makuco/STATE.md` via the memory skill when installed, otherwise appended directly under that file's own sections.
- **Never fixes anything**: findings go back to `makuco-desenvolver`.

> **Why agents are invoked here, when `makuco-desenvolver` forbids it.** The rule that matters is not "never call an agent" but "there is exactly one writer of canonical docs and `status.yml`." `makuco-desenvolver` writes `spec.md`/`task.md`/`sessao-dev.md` directly because those are its own working state. `review.md` is different: it is a canonical artifact with its own `status.yml` field (`pbis.{slug}.review`), the same category as `feature.md` and `pbi.md` — which is why `makuco-analisar` also routes through the copy-writer. This skill follows `makuco-analisar`'s precedent.
>
> Exactly **two** agents are invoked, both in step-05 and both in PBI mode only: `makuco-copy-writer`, which persists `review.md` and the verdict, and `makuco-documentation`, which owns the stage that follows an approved review. The second exists because a review that ends without documentation leaves the PBI shipping docs that describe the version before it, and the user's memory is not a wiring mechanism. It runs **after** the copy-writer, never before: it reads `pbis.{slug}.review` and refuses unless it is already `approved`. No other `makuco-*` agent is invoked from this flow.

## Configuration this skill reads

- `.makuco/docs/codebase/*` — conventions, architecture, structure, testing; the basis for pass 7 and for judging whether a change fits the project. Resolved **per repo with fallback** per `makuco-workspace-detection` (prefer `repos/<name>/.makuco/docs/codebase/*`, else the root). Missing or empty → warn once; pass 7 falls back to `makuco-project-research`. Never blocks.
- The PBI's own upstream artifacts (`spec.md`, `task.md`, `sessao-dev.md`, `DESIGN.md`, `EXPERIENCE.md`) — read, never rewritten. PBI mode only.
- `MAKUCO.md` — team policies when present. No review threshold is hardcoded here.

There is **no tracker dependency**. This skill never reads or writes Azure DevOps; the verdict lives in `status.yml` (PBI mode) and syncing that outward is `makuco-desenvolver`'s job.

## Assets & references

- [references/diff-scope.md](references/diff-scope.md) — how the reviewed diff is resolved in each mode, and what is excluded from it.
- [references/passes-1-2.md](references/passes-1-2.md) — the two passes this skill runs itself: spec/task compliance and diff analysis.
- [references/subagent-dispatch.md](references/subagent-dispatch.md) — the payload contract for passes 3–7.
- [references/severity-and-verdict.md](references/severity-and-verdict.md) — severity table, verification ladder, verdict rule, and what is not a finding.
- [assets/sessao-review-template.md](assets/sessao-review-template.md) — the session tracker's schema.

## Language

Skill instructions (this file + steps + references + assets) are in **English**. All facilitation with the user and every generated artifact are in **Portuguese (PT-BR)**, per Makuco convention.

**File names follow a different split, and it is deliberate** — it matches `makuco-analisar` and `makuco-desenvolver`, so the three orchestrator skills read the same side by side:

| Folder        | Naming                 | Why                                                                                                                      |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `steps/`      | PT-BR                  | A step is a phase of a conversation held in PT-BR (`escopo`, `contexto`, `passes`, `consolidar`, `fechamento`).          |
| `references/` | English                | A reference is named after the concept it teaches, and those are technical terms (`diff-scope`, `severity-and-verdict`). |
| `assets/`     | after what it produces | `sessao-review-template.md` seeds `sessao-review.md`, a PT-BR artifact — the template's name tracks the artifact's.      |

The rule above governs **content**, not file names; the two are independent axes. Do not rename these files to "fix" the mismatch in isolation — the inconsistency would only move, and a maintainer reading `step-05-fechamento.md` in the sibling skills would find `step-05-closeout.md` here. Changing it is a repo-wide decision for all three skills at once, not a per-skill one.
