# Asset — `sessao-review.md` template

Seeded by [steps/step-01-escopo.md](../steps/step-01-escopo.md). This is the skill's own session tracker: it makes a review resumable and it records what was actually covered. It is written directly by this skill and never goes through `makuco-copy-writer`.

In PBI mode it lives at `{pasta_pbi}/sessao-review.md`. In DIFF mode it lives at `.makuco/reviews/.sessao-review-{slug}.md`, keyed by the same slug the report uses — one tracker per review target. A single shared file would offer to resume branch A's half-finished review when the user asks to review branch B, and resuming keeps `escopo_diff` unchanged, so the result would describe neither branch.

```yaml
---
stepsCompleted: []
modo: ''
rodada: 1
item_id: ''
slug: ''
pasta_pbi: ''
feature_folder: ''
escopo_diff: ''
arquivos_alterados: []
arquivos_fora_de_escopo: []
tasks_revisadas: []
passes_executados: []
passes_skipped: []
achados: { critical: 0, major: 0, minor: 0, suggestion: 0 }
veredito: ''
artefato: ''
proxima_fase: ''
---
```

## Fields

| Field                     | Meaning                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `stepsCompleted`          | Progress marker: `[1]` → `[1,2]` → … → `[1,2,3,4,5]`. Drives resume.                             |
| `modo`                    | `pbi` \| `diff`. Set in step-01, never inferred again afterwards.                                |
| `rodada`                  | Review round for this PBI. Round N appends to `review.md`; it never overwrites round N−1.        |
| `item_id`, `slug`         | Local PBI identity (`pbi-NNN` + slug). Empty in DIFF mode.                                       |
| `pasta_pbi`               | `.makuco/docs/modules/module_NNN/feature_NNN/pbis/pbi-NNN-slug`. Empty in DIFF mode.             |
| `feature_folder`          | Parent feature folder — the copy-writer needs it to locate `status.yml`.                         |
| `escopo_diff`             | The resolved diff command or target, verbatim, so a resume reviews the same thing.               |
| `arquivos_alterados`      | Files under review.                                                                              |
| `arquivos_fora_de_escopo` | Files excluded from findings (generated, vendored, lockfiles) — reported, never silently dropped. |
| `tasks_revisadas`         | `[task-01, task-03]`. Empty in DIFF mode.                                                        |
| `passes_executados`       | `[1,2,3,4,5,6,7]`. A skipped pass is absent here.                                                |
| `passes_skipped`          | `[{pass, motivo}]` — feeds the report's `SKIP` entries.                                          |
| `achados`                 | Counts **after** dedup and verification, not the raw subagent totals.                            |
| `veredito`                | `approved` \| `changes-requested` — the same literals `status.yml` accepts, so the value is handed to the copy-writer unchanged. The user-facing wording (APROVADO / NECESSITA CORREÇÕES) belongs in the report, not here. |
| `artefato`                | Path of the written report, filled in step-05.                                                   |
| `proxima_fase`            | `contexto` \| `passes` \| `consolidar` \| `fechamento` \| `` (closed).                           |

## Rules

- Write findings, decisions and the resolved scope **the moment they exist**, not at the end. A session that dies mid-review should resume from the last completed step, not restart the fan-out.
- The tracker is closed **last**, in step-05, after the report and the status update have actually landed. Never mark a session closed before its trailing effects happened.
- Step-05 only appends and closes. It never rewrites what earlier steps recorded — including a pass that was skipped or a finding that verification dropped.
