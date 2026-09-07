# Reference — Severity, verification and verdict

Loaded by [steps/step-04-consolidar.md](../steps/step-04-consolidar.md). This file is the single source of truth for how a candidate becomes a finding, what severity it carries, and how the verdict follows from the set.

---

## 1. Severity

| Severity     | Criteria                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `critical`   | Directly exploitable, or prevents correct operation: auth bypass, injection, exposed data, guaranteed crash. |
| `major`      | An unimplemented requirement, a security weakness, or a bug likely to reach production.                     |
| `minor`      | Pattern deviation, insufficient coverage, recommended hardening.                                            |
| `suggestion` | Clarity or quality improvement with no current violation.                                                   |

**`critical` and `major` block approval.** Nothing else does.

The pass subagents assign a severity themselves. Consolidation may **lower** one when verification weakens it, and may raise one only when the evidence is concrete — never to make a point.

## 2. Every finding needs a concrete failure scenario

State the inputs or state that trigger it and the **user-visible consequence**: an error, wrong output, data loss, an exposed record. An intermediate state is not a consequence — "the cached value goes stale" is a mechanism, "a user sees another tenant's price after the cache is invalidated" is a failure.

A candidate that cannot express a failure scenario is not a `major`. It is a `suggestion`, or it is nothing.

For the quality, pattern and coverage lenses the equivalent is the concrete cost: what is duplicated and where the other copy lives, which documented convention is broken and quoted verbatim, which case the missing test would have caught. "Não segue boas práticas" is not a finding.

## 3. Verification of blocking findings

Every `critical` and `major` is re-examined **before** it enters the report. `minor` and `suggestion` skip this — they block nothing, so a false positive there costs a line of text, not a development round trip.

Re-read the actual code around the candidate and reach one of three verdicts:

| Verdict       | Meaning                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `CONFIRMED`   | You can name the inputs/state that trigger it and the wrong outcome that follows.                |
| `PLAUSIBLE`   | The mechanism is real and reachable, but the trigger depends on timing, environment or load.     |
| `REFUTED`     | It is factually wrong, provably impossible, or already handled.                                  |

Keep `CONFIRMED` and `PLAUSIBLE`. Drop `REFUTED`.

**Refute only from the code, never from doubt.** A refutation must cite the line that proves it: the guard that already handles the case, the type or constant that makes the state unreachable, the actual text of the line the candidate misread. "Parece improvável", "provavelmente é intencional" and "depende de estado de runtime" are not refutations — a race condition, a null on a cold-cache path, a zero treated as absent, and an off-by-one on a boundary the code does not exclude are all realistic states, and dismissing them is how real bugs ship.

A `PLAUSIBLE` finding says so in the report. The reader deserves to know which findings rest on a reachable-but-conditional path.

## 4. What is not a finding

Discard these at consolidation. Every one of them is noise that costs the reader's attention and makes the real findings harder to act on.

- **Style a formatter or linter already owns** — spacing, quotes, import order, line length. The project's tooling decides those, and CI runs it.
- **Compile, type and test failures.** Assume the build and the test suite run separately; the review is not a substitute for them.
- **Cosmetic renaming** with no ambiguity behind it.
- **Pre-existing defects on lines this change did not touch or affect** (see [diff-scope.md](diff-scope.md) §3).
- **A rule the code deliberately silenced** with an explicit ignore/suppress annotation — that is a decision, and disagreeing with it is a `suggestion` at most.
- **Intentional behaviour changes** that the spec or the task asked for. Read the requirement before calling a change a regression.
- **Missing tests, docs or hardening in the abstract**, unless the project's own documented conventions require them — in which case quote the convention.

## 5. Deduplication

The passes overlap deliberately: an empty `catch` is a bug (pass 6) and a code-practice violation (pass 3); a missing input check is security (pass 5) and a boundary violation (pass 6). Same file, same line, same underlying mechanism → **one finding**, keeping the wording with the most concrete failure scenario and the category that names the mechanism most precisely.

Same line for **different reasons** stays as two findings. Never let one pass's conclusion silence another's.

## 5b. Roll up by root cause

Deduplication removes repeats of the *same* finding. Roll-up is different and it is what keeps a report readable: **many findings that share one root cause become one finding with an instance table.**

Fourteen places where a doc contradicts another doc is not fourteen findings — it is one finding ("the router and the steps disagree") with fourteen instances, and the fix is one decision applied fourteen times. Listing them separately makes the report look like fourteen problems, buries the two that are genuinely different, and gives the reader no idea where to start.

Roll up when the instances share a cause **and** a fix:

```markdown
| # | Severidade | Categoria | Descrição | Recomendação |
| 3 | major | consistência | O roteador contradiz os steps em 14 pontos — ver instâncias | Uma decisão por par, aplicada nos 14 |

**Instâncias do achado 3**

| Arquivo | Linha | Diz | Contradiz |
| `SKILL.md` | 66 | `{YYYY-MM-DD}-{slug}.md` | `step-05:54` → `{slug}.md` |
```

The severity of a rolled-up finding is the highest among its instances, and the instance table is part of the finding, not an appendix.

## 5c. Size the report

A report nobody finishes reading protects nobody. Target **at most ~15 numbered findings**; past that, the tail is not informing a decision.

Get there by rolling up (§5b) and by discarding non-findings (§4) — **never by silently dropping**. If real findings still exceed the target after both, keep the most severe and close the table with an explicit line: *"mais N achados `minor`/`suggestion` da mesma família de {causa}, não listados individualmente"*. The reader has to be able to tell a short report from a truncated one.

`critical` and `major` are **never** cut — they block approval, so they all appear however many there are. A count of blocking findings that runs high with zero `critical` is itself a signal: re-check §1, because a wave of same-family `major`s usually means one root cause that has not been rolled up yet.

## 6. Verdict

```
APROVADO             — no open critical and no open major
NECESSITA CORREÇÕES  — at least one open critical or major
```

There is no third outcome. "Aprovado com ressalvas" does not exist: either the blocking findings are gone or the work goes back. `minor` and `suggestion` findings are recorded and do not stand in the way.

A pass recorded as `SKIP` does not change the verdict, but it is stated in the report — an approval that ran five of seven passes is a narrower statement than one that ran all seven, and the reader has to be able to tell.

## 7. Ordering

Findings are numbered sequentially and ordered by severity, `critical` first. When the volume is large, the ordering is what makes the report usable — do not group by pass or by file ahead of severity.
