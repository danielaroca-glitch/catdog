# Reference — Dispatching passes 3–7

Loaded by [steps/step-03-passes.md](../steps/step-03-passes.md). This file is a **contract**, not a methodology. Each pass's checklist is defined once, in its own skill; this file only describes what the orchestrator must hand over so that checklist can run.

---

## The five passes

| Pass | Skill                      | Reviews                                                          |
| ---- | -------------------------- | ---------------------------------------------------------------- |
| 3    | `makuco-reviewer-quality`  | SOLID, Object Calisthenics, Clean Code, ubiquitous language      |
| 4    | `makuco-reviewer-tests`    | Test existence, AAA, naming, coverage, isolation                 |
| 5    | `makuco-reviewer-security` | OWASP Top 10, secure coding patterns                             |
| 6    | `makuco-reviewer-bugs`     | Null/undefined, races, leaks, off-by-one, coercion, error swallowing |
| 7    | `makuco-reviewer-patterns` | Folder structure, naming, dependency flow, error handling, logging |

**Dispatch the applicable passes in a single message**, as parallel subagents. They are independent by construction and each carries its own isolated context; running them sequentially multiplies the wall-clock cost for nothing. Which passes apply, and whether fan-out is worth it at all, is decided in step-03 §2b — a small filtered scope runs inline instead.

**Match the model to the pass.** These five are not equally hard, and running all of them on the most capable model is the single largest avoidable cost in this flow:

| Pass | Nature | Tier |
| ---- | ------ | ---- |
| 4 — tests, 7 — patterns | Mechanical checklists against a documented convention: does the file exist, does it match the rule, is it in the right folder. | A fast model is enough. |
| 3 — quality | Judgement, but against explicit criteria (SOLID, Calisthenics). | Mid tier. |
| 5 — security, 6 — bugs | Require constructing a failure path nobody wrote down — the reasoning the rest of the flow depends on. | Keep the strong model here. |

When the runner exposes a model choice per subagent, use it. When it does not, this table still tells you where to spend depth if you must run passes sequentially.

Do not restate their checklists in the dispatch prompt. They own their rules, and a paraphrase in the payload only creates a second, drifting copy.

## Payload

Every subagent receives the same five blocks:

1. **The changed files** — repo-relative paths and the diff, plus the **full current content of the files that pass actually judges**. Full content is not optional where it matters: pass 6 reads whole files because bugs emerge between new and existing code, and pass 3 cannot judge cohesion from a hunk. But sending every file's full body to all five passes multiplies the same read by five, and most of it is waste — pass 7 judges placement, naming and dependency direction, which the paths plus the diff already show. Send paths and the diff to everyone; add full bodies only for the passes that need them (3 and 6 always; 4 for the code under test; 5 for anything handling input, secrets or external calls). When in doubt, give the subagent the paths and let it Read what it needs — it has the tools.
2. **The scope statement** — in PBI mode, the paths of `spec.md` and the reviewed task file(s), which the pass skills read for the requirement context. In DIFF mode, a one-paragraph summary of what the change does and the resolved diff command.
3. **The project docs** — the resolved `<CODEBASE_DIR>` **path**, plus the excerpts that bear on this change. Pass 7 depends on these completely and should get the relevant files in full; the others need the naming and layering rules, not the whole set. Pasting all four docs into five prompts pays for the same tokens five times — send the path and the excerpts, and let a subagent Read further if its checklist needs it.
4. **The output language** — explicitly **PT-BR**. The pass skills say *"detect the language of the TASK file provided by the orchestrator"*, which has no answer in DIFF mode where no task file exists. State it and neither mode guesses.
5. **The instruction**:

   > Load and follow the `{skill-name}` skill. Return only a markdown findings block, in PT-BR. Never modify code and never write to any file. You may use the `Explore` agent to read files the changed files import or depend on.

The `Explore` permission matters: passes 6 and 7 need to follow a dependency to judge whether a call is safe or a layer is respected, and a subagent that believes it cannot read anything else will guess instead.

## What comes back

Each returns a markdown block — `### Pass N — Título`, a findings table, and a `**Summary**` line — or the literal `Nenhum achado.` Nothing more; they write no files and change no code.

Take the blocks as candidates, not conclusions. Consolidation dedups them and verifies the blocking ones ([severity-and-verdict.md](severity-and-verdict.md)).

## Degradation

A pass whose skill is not installed, or whose subagent fails or returns nothing usable:

1. Warn the user **once**, in PT-BR, naming the pass and the reason.
2. Record it in `sessao-review.md → passes_skipped` as `{pass, motivo}`.
3. Record it in the report's `Passes executados` section as `SKIP` with the reason.
4. Continue. A missing pass narrows the review; it does not stop it.

The one thing never to do is drop a pass silently. A verdict that ran five of seven passes is a weaker statement than one that ran all seven, and only the report can tell the reader which they are holding.

**When subagents are unavailable entirely** — no fan-out possible in the current context — do not error. Work through the five pass skills yourself, sequentially, in this context, loading each one in turn. Say plainly in the summary that the review ran single-pass without fan-out, because the isolation that makes five independent reviewers valuable is exactly what is missing.
