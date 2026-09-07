# Step 3: The seven passes

## MANDATORY RULES

- **Never modify code and never write to a reviewed file.** The subagents are told the same; the orchestrator holds to it too.
- **Dispatch passes 3–7 in a single message**, as five parallel subagents.
- **Do not restate a pass skill's checklist** in its prompt. Each skill owns its rules; a paraphrase creates a second copy that drifts.
- **A pass that cannot run is `SKIP` with a reason, recorded and reported** — never dropped silently.
- Findings come out of this step as **candidates**. Nothing is a finding until step-04 has verified it.
- Communicate in **PT-BR**.

---

## GOAL OF THIS STEP

Every applicable pass has run against the loaded context, and their raw findings blocks are collected, with any skipped pass recorded and explained.

---

## SEQUENCE

### 1. Dispatch the fan-out first, then run passes 1 and 2

**Order matters for the wait, and costs nothing.** Passes 1-2 are the orchestrator's own work and
are independent of 3-7 by construction. Running them first leaves the five subagents idle for
their whole duration; dispatching first means the two sets overlap and the round ends when the
slowest single pass ends, not after the sum.

So: resolve §2b's selection, dispatch §3, and **then** work through passes 1-2 here while the
subagents run. Collect in §4.

The only case that inverts this: when §2b resolves to the inline shape (no fan-out), there is
nothing to overlap with — run 1-2, then the rest, in this context.

Follow [references/passes-1-2.md](../references/passes-1-2.md).

Pass 1 (spec/task compliance) runs in **PBI mode only** — without a spec there is nothing to check compliance against. In DIFF mode record it as `N/A`, which is not the same as `SKIP`: nothing failed, the pass simply does not apply.

Pass 2 (diff analysis) runs in **both modes**. In PBI mode it measures the diff against the tasks' declared scope; in DIFF mode against the stated purpose of the change. Its removed-behaviour and contract checks (§2b, §2c) apply identically either way, and they are the checks the per-file passes structurally cannot make.

They often surface the scope problems that make the rest of the review easier to read — which is
why their output is read **before** the subagents' when consolidating, even though they finish
after the dispatch.

### 2. Re-check the previous round (round > 1)

For each `critical`/`major` carried over from the prior round, state explicitly: **corrigido**, **parcialmente corrigido**, or **em aberto**. Point at the code that resolves it, or at the code that still does not.

A finding still open in round N is not a new finding — it keeps its identity and its severity, and it blocks approval exactly as it did before. Silently re-numbering it as fresh hides how many rounds it has survived.

### 2b. Select the passes and the execution shape

**Run the passes the change actually needs, not all of them by reflex.** A pass whose subject matter is absent from the diff produces nothing but cost and noise — and a security checklist applied to prose invents findings to justify having run.

**Filter per pass, not per diff.** This is the distinction that matters: a diff of 19 markdown files plus 3 source files is not "a diff containing code" for every pass. It is 3 files for the passes that judge code and 22 for the one that judges placement. Deciding on/off for the whole diff sends OWASP and race-condition hunting across nineteen prose files — pure cost, and worse, a checklist with nothing to find tends to invent something to justify having run.

Build **one file set per pass** — or reuse `arquivos_por_passe`, which step-02 §1 already
recorded doing exactly this classification. Do not classify twice:

| Pass | Sees                                                                                     |
| ---- | ------------------------------------------------------------------------------------------ |
| 3 — quality  | Source files only. Prose, data and lockfiles have no SOLID violations.                |
| 4 — tests    | Test files, plus the source they cover. Nothing else.                                 |
| 5 — security | Source that handles input, secrets, auth, file/process/network I/O. Not every source. |
| 6 — bugs     | Source files only.                                                                    |
| 7 — patterns | **All** changed paths — placement, naming and layering apply to docs too. But paths + diff, not full bodies. |

A pass whose set comes out **empty is `N/A`** — it did not apply, so it did not run.

`N/A` is not `SKIP`: `N/A` means the pass does not apply, `SKIP` means it should have run and could not. Both are declared in the report, and confusing them makes a narrow review look complete.

Then pick the shape from the **filtered** sets, not the raw diff — a 22-file diff whose code passes see 3 files each is a small review wearing a big coat.

**Two axes, and they pull opposite ways.** Fanning out costs more tokens (five contexts, each
resolving its own project docs) and costs **less wall time** (five passes end with the slowest,
not with the sum). Deciding by token cost alone optimizes the axis the person waiting does not
feel — and "demorado demais" is a complaint about the other one.

| Passes aplicáveis | Shape                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| 3 or more         | **Subagents in parallel, one message.** Three sequential passes over the same files is already the sum of three waits; the fan-out's fixed overhead is paid once and hidden behind the slowest pass. |
| 2 or fewer        | Run them yourself, sequentially, in this context. At that size the overhead is a real share of the total and there is little left to overlap. |

The count that decides is **how many passes apply**, not how many files they see: latency scales
with the number of sequential steps, and a pass over 3 files still costs a round trip. A 3-file
diff that lights up passes 3, 4 and 6 fans out; a 30-file prose diff that only lights up pass 7
does not.

Tell the user the plan **before** spending anything: which passes will run, over how many files each, which are `N/A` and why, and whether it will fan out. A review that costs real money should not surprise its buyer, and this is the last cheap moment to narrow the scope.

### 3. Dispatch the applicable passes

Follow the payload contract in [references/subagent-dispatch.md](../references/subagent-dispatch.md). Dispatch the passes §2b selected — up to five subagents, always in a **single message**:

| Pass | Skill                      |
| ---- | -------------------------- |
| 3    | `makuco-reviewer-quality`  |
| 4    | `makuco-reviewer-tests`    |
| 5    | `makuco-reviewer-security` |
| 6    | `makuco-reviewer-bugs`     |
| 7    | `makuco-reviewer-patterns` |

Each gets **its own filtered file set** from §2b — paths and the diff always, full bodies only where that pass needs them — plus the scope statement, the `<CODEBASE_DIR>` path with the excerpts that bear on the change, the explicit PT-BR output language, and the instruction to load its skill, return only a findings block, write nothing, and use `Explore` to follow a dependency. The reference is the authority on the payload's shape; do not restate it here.

Tell the user the fan-out is running and what each pass covers. It is the longest part of the flow and a silent wait reads as a hang.

### 3b. Say where it is, while it runs

Between the dispatch and the report there is the longest silence of the flow, and silence is
what makes a wait feel longer than it is. Announce each pass as it lands, one line, no detail:

> `✓ passe 4 (testes) — 2 achados · faltam 3`

Sequential shape: the same line after each pass. Fan-out: as each subagent returns.

It is not decoration. Someone watching knows the review is advancing and roughly how much is
left; someone who has to interrupt knows what was already paid for. The alternative is a blank
screen for minutes and then a verdict, which is the shape people describe as "demorado" even
when it was not.

### 4. Collect

Wait for all five before consolidating. A pass that returns nothing usable — an error, an empty response, a refusal — is `SKIP` with that reason; do not retry indefinitely and do not fill the gap by guessing what it would have found.

Record in the session: `passes_executados`, `passes_skipped`, and each block's raw findings.

### 5. Degradation

- **Pass skill not installed** → warn once naming the pass, mark `SKIP`, continue.
- **Subagents unavailable in this context** → do not error. Work through the five pass skills yourself, sequentially, loading each in turn, and state in the report that the review ran single-pass without fan-out. The isolation that makes five independent reviewers valuable is precisely what is missing, and the reader has to know.

### 6. Record

Update `sessao-review.md`: `stepsCompleted: [1,2,3]`, `proxima_fase: consolidar`, plus the raw candidate counts per pass. Those raw counts are worth keeping — step-04 will reduce them, and the difference between raw and final is a useful signal about the review itself.

Record the **cost** of this round too, in the same place: which passes ran, how many files each
saw, which were `N/A`, whether it fanned out, and the wall time from dispatch to the last pass
landing. "Demorado demais" is unarguable while it is a feeling; with a number per round it
becomes a comparison, and the first person who wants the review faster has something to point
at instead of an impression.

---

## SUCCESS METRICS

- Pass 1 ran (PBI mode) or is recorded `N/A` (DIFF mode) — never silently absent.
- Pass 2 ran in both modes, including its removed-behaviour and contract checks.
- Round > 1: every carried-over blocking finding has an explicit corrigido / parcialmente / em aberto verdict.
- Passes 3–7 dispatched in **one** message as five parallel subagents, and dispatched **before**
  passes 1–2 ran — the orchestrator's own passes overlap the subagents' instead of preceding them.
- Fan-out decided by how many passes apply (3 or more → parallel), not by token cost.
- All five results collected, or each missing one recorded in `passes_skipped` with a reason.
- No file was written and no code was changed.
- `stepsCompleted: [1,2,3]`.
