# Delegation Contract

Full research is expensive because of the **evidence**, not the output. The seven technical files fit in 17,000 tokens; establishing them can cost ten times that in manifests, listings, searches and source files — and every one of those lands in the orchestrator's context, where it stays for the rest of the session.

Delegation moves that evidence into contexts that are discarded. What makes it safe is the ordering rule in `SKILL.md`: **a later step consumes an earlier step's written output on disk, never its working context.** Steps 1–7 are therefore independent by construction, and Step 8 reads the seven finished files rather than the work that produced them.

## Ownership

| Work | Who | Why |
|---|---|---|
| Step 0 (reference docs), Step 0.5 (inventory) | **orchestrator** | compact output, shared by every worker; running it twice is pure waste |
| Steps 1–7 (the seven technical files) | one sub-agent **per file**, ≤ 4 concurrent | this is where the raw evidence lives |
| Step 8 (`OVERVIEW.md`) | **orchestrator** | its inputs are the seven capped files plus the inventory — zero new code reads |
| Step 9 (module docs) | one sub-agent **per module** in the batch, ≤ 4 concurrent | a module's source is the largest single body of evidence in the pass |
| Step 10 (`MAKUCO.md` index), Step 11 (`.research-state.md`) | **orchestrator** | neither happens for free because worker files appeared |

The orchestrator holding Steps 8, 10 and 11 is not a convenience — those three are what a reader and the next pass depend on, and a worker cannot see across the pass.

## Waves

Steps 1, 2, 4, 5, 6 and 7 fan out together. **Step 3 waits for Step 2**, because `architecture-reference.md` lists `structure.md` among its inputs and a worker can only read a file that has already landed. That is the only ordering constraint among the seven; everything else is independent by construction.

Step 9's batch fans out after Step 8, since the batch selection depends on the complete module map.

## Worker payload

Give each worker exactly this, and nothing else:

1. Its step (or module name, slug and path).
2. The Step 0.5 inventory, inline — so it never re-walks the tree.
3. The path of its reference template (`references/<x>-reference.md`, or `module-reference.md`).
4. Its output path under `<CODEBASE_DIR>`.
5. **Its numeric caps, inlined** — files, searches, results per search, and the output `Size limit`. A cap behind a link is a cap a worker skips.
6. For a module worker: the ≤ 10 candidate paths lifted from the inventory.
7. The slice of the team's reference docs that names its step's subject or its module — never the whole doc.

Nothing else. A worker that receives the previous workers' output starts reasoning about the pass instead of its own file, and the orchestrator pays for the context twice.

## Worker return

**Only** the path written, plus one line of ≤ 20 words describing what landed. Never file contents, never a draft for review, never grep output, never "here is what I found" prose. The file on disk is the deliverable; the return value is a receipt.

A worker that hit a cap says which one, in that same line. The orchestrator records it in `.research-state.md` `caps_hit`.

## When not to delegate

**A repo with ≤ 200 tracked files** — the count the Step 0.5 inventory already produced — runs inline. Seven sub-agents for a twenty-file utility cost more than the work they replace.

## No sub-agent mechanism

Some hosts (Copilot/VSCode and similar) have none. Run the same work inline, **one step at a time**, and after each output file is written discard that step's working context before starting the next. Every cap still applies — the caps *are* the fallback, not a concession to it. In this mode the pass-wide ceiling in [context-budget.md](context-budget.md) binds, and the Step 9 batch is **4** modules instead of 8. More passes is the correct behaviour, not degradation.
