# Context Budget

Research reads a codebase; a codebase is unbounded. Without a ceiling this skill consumes the whole session on a large repository, and a session that dies mid-pass leaves nothing behind. The budget here is what makes a pass finish; `SKILL.md` Step 11 is what makes an unfinished pass resumable.

**A pass is a unit of work, not "the whole repo".** A big repository is researched in several passes, each one complete in itself. That is the design, not a degradation.

## Input rules

- **Escalation ladder** — stop at the cheapest rung that answers the question: inventory → path listing → `rg -l` / `rg -m 3` → a line range → the whole file, last resort. **Never read a file in full to confirm a hint.** Never read a lock file.
- **Every search capped at the wire, not by intention** — `rg -l --max-count 1 <pat> | head -30`. A search that would blow its cap means the pattern is too broad, never that the cap should rise. The ladder, the fixed exclusions and the per-tool forms are in [code-analysis.md](code-analysis.md); they are rules there, not tips.
- **Unit manifests:** in a repo with more than 8 separable units, read the **root/parent** manifest only (`pom.xml` `<modules>`, `settings.gradle` `include`, `package.json` `workspaces`, `pnpm-workspace.yaml`) and take the unit list from there. Read an individual unit's manifest only for the modules in the current Step 9 batch. Never glob `pom.xml` or `*.csproj` recursively.
- **Dominance, not completeness.** Nearly every claim in these documents is about what predominates ("kebab-case is the convention here"), which a capped search settles. The one claim needing completeness — the module list — comes from the Step 0.5 inventory and the parent manifest, both bounded.
- **Per-file input caps** live in each template's `Extract from` block, together with the output `Size limit`. The caps are binding; a template's file range is a ceiling, never a target.

## Where the ceiling sits depends on the mode

| Mode | Binding limit | Why |
|---|---|---|
| Delegated (see [delegation-contract.md](delegation-contract.md)) | the **per-step caps**, enforced inside each sub-agent | the orchestrator never holds a line of the repo's code, so no pass-wide file count applies to it |
| Inline (no sub-agent mechanism, or a small repo) | **40 content files** for Steps 0–8 combined, on top of the per-step caps | every read weighs on the one context doing the work |

Directory listings and search output do not count as files read, but obey their own caps. Step 9 adds its per-module cap on top in both modes.

## Output ceilings

Total for `<CODEBASE_DIR>` excluding `modules/`: **17,000 tokens**.

| File | Size limit |
|---|---|
| `OVERVIEW.md` | 2,000 |
| `stack.md` | 2,000 |
| `structure.md` | 1,500 |
| `architecture.md` | 3,000 |
| `conventions.md` | 3,000 |
| `integrations.md` | 2,000 |
| `concerns.md` | 2,500 |
| `testing.md` | 1,500 |
| `modules/<slug>.md` | 1,500 each |

`modules/` has no folder ceiling because a reader opens exactly one file from it.

## Hitting a ceiling

**Hitting the ceiling is a resume, not a failure.** Write what you established, record what is pending in `.research-state.md` (`SKILL.md` Step 11), tell the user what remains, and end the pass. Never leave an output file half-written without recording it. A cap is never raised during a pass.
