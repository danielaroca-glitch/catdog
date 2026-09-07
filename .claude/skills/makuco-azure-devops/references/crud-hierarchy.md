# CRUD, Hierarchy & Sync

**Goal**: Define the discipline `makuco-azure-devops` follows for reading, creating, updating, and linking work items, and for keeping local state and the tracker in sync — without ever hardcoding a type/state/field name.

---

## Reading a work item

Call the MCP server's own "get work item" tool (name discovered at call time — never hardcoded) with the item's id. Extract fields using the project's own field names — resolved via `azure-devops.yml`'s `custom_fields` map when the caller needs a custom field, or the tool's own standard response fields for title/type/state/parent otherwise. Never assume a specific field's internal name is universal across projects.

## Creating a child — parent link is mandatory

Creating a PBI or a Task **always** includes linking it to its parent (Feature for a PBI, PBI for a Task) in the same operation or as an immediate follow-up call before the item is considered created. **Never** create a work item without a parent link when a parent is known — an orphaned item is an anti-pattern, not a valid intermediate state to leave behind.

1. Resolve the canonical type (`feature`/`pbi`/`task`/`bug`) via config-then-discovery (see SKILL.md).
2. **Match the board's naming convention.** Before writing a title/description, look at a couple of existing work items of the same type in the same project/area (cheaply — one small sample, not a backlog crawl) and mirror their **house style**: title pattern/prefix/casing and description structure. Adopt the team's convention over a generic phrasing — if their PBIs read like `[Módulo] Ação — detalhe` or carry a prefix/tag, follow it. Only fall back to the caller's raw title when no discernible pattern exists. A title that ignores the board's established style is a defect, not a neutral default.
3. **Resolve the destination (area path + iteration/sprint) — never fall through to the project default silently.** See the mandatory destination gate below.
4. **Confirm with the user before any create call** — see the mandatory create gate below. Nothing is written to the tracker until it clears.
5. Create the item with that type and the fields the caller provided (mapped through `custom_fields` where applicable — unmapped custom fields are simply skipped, not an error).
6. Set the resolved destination on the new item via the standard `System.AreaPath` / `System.IterationPath` fields — this is what places the item in the right area and sprint. Never hardcode an area or iteration literal in this skill — it comes from `azure-devops.yml` or from the user's answer at the destination gate.
7. Link it to its parent id via the MCP server's own linking mechanism (tool name discovered at call time).
8. If the link step fails after the item was created, report this clearly — the item exists but is unlinked, which the caller must know about rather than assume succeeded.

### Resolve the destination — MANDATORY gate

**This section is the canonical wording. Callers cite it — they do not restate or paraphrase it.**

A work item created without an explicit area path and iteration lands at the **project root with no sprint** — invisible on the team's board and tedious to move afterwards. So the destination is **resolved, never assumed**:

1. **Config first.** If `azure-devops.yml` defines both `area_path` and `iteration_path`, use them. No question — this is the steady state after the first run.
2. **Anything missing → ask.** If either key is absent, **stop and ask the user** where the items go. An absent key is a question to ask, **not** a signal to omit the field and let Azure DevOps apply the project/team default. "The config didn't define it" is never a valid reason to create at the project root.
3. **Ask with real options, not a blank prompt.** Before asking, discover the actual candidates cheaply via the MCP server's own tools (names discovered at call time): the project's area paths (classification nodes) and the team's iterations, identifying the **current sprint** by the iteration whose date range contains today. Present those as the choices — the current sprint is the default suggestion, since new work almost always belongs to the sprint in flight.

> Onde criar os itens?
>
> **Área:** 1. {area path 1} | 2. {area path 2} | …
> **Sprint:** 1. {sprint atual} (atual — {início} → {fim}) | 2. {próxima sprint} | 3. Backlog (sem sprint)
>
> **[Área N + Sprint N]** confirmar | **[O]** informar outro caminho

**STOP — wait for the answer.** Never pick a destination on your own judgment, and never create "at the root for now, we move later".

4. **Write the answer back** into `azure-devops.yml` (`area_path` / `iteration_path`), so this is asked **once per project**, not once per batch. A sprint that has ended is treated as unresolved on the next run — re-ask (offering the new current sprint) rather than silently creating in a closed iteration.
5. **`Backlog (sem sprint)` is a valid answer** — the user may deliberately want no iteration. Only then is `System.IterationPath` left unset, and it's recorded as an explicit choice, not as a missing value.
6. **The destination applies to the whole batch**, including children created under a parent — a Task never lands in a different area/sprint than the item it was created alongside unless the user said so.

### Confirm before creating — MANDATORY gate

**This section is the canonical wording. Callers cite it — they do not restate or paraphrase it.**

A work item in a real tracker is expensive to undo, so **no create call happens without explicit user confirmation first**. The gate takes a **batch**: a caller may hand over 1..N pending items, and they are all presented in one numbered list under a single confirmation — never one prompt per item.

Present the resolved type, the title, the parent, and — once, as a header line for the batch — the **destination** (area path + iteration) the items will land in. The destination is shown because it is the one thing that is expensive to fix afterwards and invisible until it's wrong; custom fields are not listed (they come from `azure-devops.yml` and are auditable there).

> Vou criar no tracker, em **{area path}** / **{iteration path ou "sem sprint"}**:
>
> 1. {tipo resolvido} — «{título}» → parent #{id} «{título do parent}»
> 2. {tipo resolvido} — «{título}» → parent #{id} «{título do parent}»
>
> **[C]** Criar | **[A N]** Ajustar item N | **[D]** Mudar destino | **[P]** Pular criação no tracker

**STOP — wait for the decision.** Never create on your own judgment.

- **`[C]`** → create the whole batch, each item linked to its parent per the sequence above.
- **`[A N]`** → the user adjusts that item's title, type, or parent. Re-present the full list and return to the STOP.
- **`[D]`** → return to the destination gate, take a new area/iteration, write it back to config, then re-present the full list and return to the STOP.
- **`[P]`** → nothing is created. Report that the caller's local artifacts stay without a tracker id. A skipped item is **never** recorded as synced (same rule as [Failure handling](#failure-handling)).

The gate runs **before the first write**. Never create part of the batch and ask afterwards — a half-written batch is the exact outcome this gate exists to prevent.

**Hierarchy is always Feature → PBI → Task**, regardless of what levels the real project's process template has above or around it. A project with an Epic above Feature, or a custom intermediate level, has that level **ignored** by this skill — it is never modeled, queried, or required. This skill only ever creates/reads/links at the Feature/PBI/Task levels.

## Updating a work item — get before update

Before updating any item: **get it first** to obtain its current revision (`rev`). Update calls that don't carry the current revision risk silently overwriting a concurrent change — always fetch fresh, then update.

- **Discussion/notes** go into a **comment**, never by overwriting the item's description field. The description is the durable spec/summary; comments are the conversation trail.
- Only fields the caller explicitly asked to change are touched. Never a bulk/blind field overwrite.

### Confirm before closing / finalizing — MANDATORY gate

**This section is the canonical wording. Callers cite it — they do not restate or paraphrase it.**

Moving a work item to a **terminal state** — the "done"/closed/finalized state, or any state the project treats as the last/completed one (e.g. `closed`/`removed` canonical states) — **requires explicit user confirmation first**. Before applying such a transition, state plainly which item and which target state:

> Vou mover o work item {id} — «{título}» para o estado final «{estado}».
>
> **[S]** Sim | **[N]** Não, deixar como está

**STOP — wait for the decision.** Do not apply the transition on your own judgment.

- **`[S]`** → apply the transition.
- **`[N]`** → leave the item's state untouched and report that nothing was changed.

Non-terminal transitions (e.g. moving into an in-progress state) do **not** require this gate — proceed normally. This gate exists because closing/finalizing a card is high-visibility and effectively signals "work done" to the whole team; it must never happen automatically.

## Sync direction — always local → ADO

This skill's writes only ever push a locally-determined state onto the tracker. It **never** reads the tracker's current state back to reconcile or overwrite anything in the calling skill's own local files (`sessao.md`, `sessao-dev.md`, `.makuco/STATE.md`, canonical docs). If a caller needs to know the tracker's current state, that's an explicit **read**, kept separate from — and never triggering — a local overwrite.

## Failure handling

- **A write fails** (network, auth, stale item, validation error from the server): report the failure plainly to the caller. **Do not** mark whatever local record the caller was tracking as "synced" — a failed write must never look like a successful one downstream.
- **Auth precondition missing**: for Claude (interactive), the first unauthenticated tool call should trigger the server's own browser login (MSAL) — if that flow fails or times out, report "not authenticated with Azure DevOps" without ever printing or logging the PAT/token itself. For VSCode (PAT), a 401 or missing `PERSONAL_ACCESS_TOKEN` is reported as "PAT missing or invalid" — again, never surface the token value in any message.
- **A custom field mapped in config doesn't actually exist in the project**: warn once and continue — skip that field, don't fail the whole operation.
- **A canonical type/state truly can't be resolved** (not in config, not discoverable): stop and ask the user which real name to use, rather than guessing or silently dropping a hierarchy level that was actually needed for this operation.

## No integration configured

If `.makuco/integrations/azure-devops.yml` is absent, the calling skill (`makuco-analisar`/`makuco-desenvolver`) first **offers to configure the integration** — it does not silently fall back to local-only. If the user accepts, the caller runs the interactive first-run setup (see [SKILL.md](../SKILL.md) → "First-run configuration"): it asks about the user's Azure DevOps (org, project, and optionally type/state vocabulary and area/iteration paths), writes the `azure-devops.yml`, and the session then proceeds in ado mode. If the user declines, the session proceeds local-only (and may be offered again next time). Either way, the offer and the accept/decline decision live in the calling skill, not in this reference — this reference assumes the config already exists once the session is in ado mode.

---

## Tips

- **All three gates are contract, not courtesy** — resolve-destination, confirm-before-create, and confirm-before-finalize are part of the operation; skipping any of them is a defect, not a shortcut.
- **Never create at the project root by omission** — an unset `System.IterationPath` is only ever the result of the user explicitly choosing "sem sprint", never of a config key being absent.
- **Parent link first-class, not an afterthought** — treat it as part of "create", not a follow-up nice-to-have.
- **Get-before-update is non-negotiable** — skipping it risks silent data loss on concurrent edits.
- **Comments for discussion, description for the durable spec** — never conflate the two.
- **Local→ADO only** — this skill has no pull-sync concept; a caller wanting the tracker's current state issues an explicit read, never a reconcile-and-overwrite.
- **Never leak the secret** — PAT/token values never appear in any message this skill produces, success or failure.
