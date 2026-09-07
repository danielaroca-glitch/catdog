---
name: makuco-workspace-detection
description: Locates the .makuco/ directory in the current workspace (including VSCode multi-root workspaces). Invoked by Makuco agents when the user has not explicitly referenced a file path. Returns the resolved MAKUCO_ROOT or halts with a user prompt.
---

# Skill: Workspace Detection

Locates the `.makuco/` directory and resolves `MAKUCO_ROOT` for the current session.

## When to use

Invoked by the agent **only when the user has not referenced a file path** in the message. When a path is provided, the agent derives `MAKUCO_ROOT` directly (see the step 0 logic in each agent).

## Procedure

1. Search for directories named `.makuco/` from the current directory, up to 5 levels deep. In VSCode multi-root workspaces, include each workspace root folder in the search. Ask using the built-in tools (e.g., 'askUser')

2. Evaluate the result:

   **Exactly one found**
   → Set `MAKUCO_ROOT` to the absolute path found. Notify the user (one line): _"Makuco project detected at: `{path}`."_ Proceed.

   **Multiple found**
   → List the options numbered and ask the user:

   > "Found multiple Makuco projects in this workspace. Which one should I use?
   >
   > 1. `{path-1}`
   > 2. `{path-2}`
   >    ..."
   >    Wait for the response. Set `MAKUCO_ROOT` to the chosen path and proceed.

   **None found**
   → Inform the user and **stop**:

   > "No `.makuco/` directory found in this workspace. Are you in the right directory? If this is a new project, run `makuco init` first."

## Output

The resolved `MAKUCO_ROOT` is used by the agent as the prefix for **all** `.makuco/` references in the session.

Example: if `MAKUCO_ROOT = /projects/my-app/.makuco`, then `.makuco/docs/codebase/architecture.md` becomes `/projects/my-app/.makuco/docs/codebase/architecture.md`.

## Codebase-context resolution (multi-repo, with fallback)

This is the single source of truth every **reader** of codebase context (`makuco-desenvolver`, `makuco-backend`, `makuco-frontend`, `makuco-reviewer-*`, `makuco-ux`, `makuco-analisar`) uses to locate `.makuco/docs/codebase/*`. It exists so codebase context can live **per repository** in a multi-repo workspace while never breaking a single-repo/legacy layout.

Let `WORKSPACE_ROOT` be the directory containing `MAKUCO_ROOT` (i.e. the parent of `.makuco/`).

The list of repositories in the workspace is the **managed repos index** kept in `WORKSPACE_ROOT/MAKUCO.md`, between the markers `<!-- makuco:repos:start -->` … `<!-- makuco:repos:end -->` — each entry maps a repo name to its path (`- **<name>** — \`repos/<name>\` — …`). Read that section to enumerate repos and their locations; it is the source of truth for "which repos exist and where".

An entry may be followed by **indented continuation lines**: a pointer to the repo's context entry point, and — for a repo that has been fully researched — its module map, one sub-bullet per module:

```
- **csg-mxt-backend** — `repos/csg-mxt-backend` — Backend v3 do Consignet: contratos, margem, folha — Java 21/Spring Boot, Oracle, Kafka
  → docs: `repos/csg-mxt-backend/.makuco/docs/codebase/OVERVIEW.md` (32 módulos)
  - contrato — `contrato/` — Núcleo de negócio: contratos, margem, folha
  - admin — `admin/` — Configuração, convênios, empresas, conteúdo
```

Match entries on the `- **<name>** — \`repos/<name>\` — …` line and treat indented lines below it as continuations of that entry. A missing continuation line is normal — the pointer only exists once the repo has context, and the sub-bullets only once it has been fully researched.

**The sub-bullets are a shortcut, not a new layer.** When one of them already names the module the task touches, go from `MAKUCO.md` straight to `CODEBASE_DIR/modules/<slug>.md` and skip `OVERVIEW.md` — the map row you would have gone there for is already in your hands. When no sub-bullet matches (or there are none), read `OVERVIEW.md` as usual.

1. **Determine the current repo.** If the work for this task targets files under `WORKSPACE_ROOT/repos/<name>/` (the file(s) being read/edited, or the working directory), the **current repo** is `<name>` — cross-check the name against the `MAKUCO.md` repos index. Otherwise there is no current repo.

2. **Resolve `CODEBASE_DIR` (in order):**
   - If there is a current repo **and** `WORKSPACE_ROOT/repos/<name>/.makuco/docs/codebase/` exists → use it. This is the per-repo context (written by `makuco-project-research`, pbi-003).
   - **Fallback** → use `MAKUCO_ROOT/docs/codebase/` (the consolidated/legacy location).

3. **Zero regression.** A workspace whose `repos/` holds no repository sub-directory — including one where `makuco init` created `repos/` with only its `README.md` inside — always resolves to the root `MAKUCO_ROOT/docs/codebase/`, identical to the pre-multi-repo behavior. Never test for the mere existence of `repos/`: `makuco init` always creates it, so that check is always true. A reader must never error because a per-repo directory is absent; it falls back.

Whenever a reader's instructions say "read `.makuco/docs/codebase/*`", that path means the `CODEBASE_DIR` resolved here — the per-repo directory when one applies, the root otherwise. Only `docs/codebase/` is repo-scoped; `docs/modules/`, `templates/`, `integrations/`, and `STATE.md` remain workspace-level at `MAKUCO_ROOT`.

## Reading order inside `CODEBASE_DIR`

The context is layered so a reader loads only what the task needs. Go top-down and stop early:

1. **`CODEBASE_DIR/OVERVIEW.md`** — what the repo is for, its nicknames/status, who it talks to, and the **module map**. Read this first when it exists; it is what lets you find the right module without opening anything else. The one case for skipping it: a `MAKUCO.md` sub-bullet already named the module you need (see above), and the task does not need the repo's role or its cross-repo relations.
2. **`CODEBASE_DIR/modules/<slug>.md`** — the business capabilities of the **one** module the task touches, located via the map's `Caminho` column. Read only that file.
3. **The technical files** — `stack.md`, `structure.md`, `architecture.md`, `conventions.md`, `integrations.md`, `concerns.md`, `testing.md` — on demand, per the reader's own needs.

Rules:

- **Never enumerate or read all of `modules/`.** Resolve the module from the map (or from the path of the file being changed) and open that one file. Reading the folder defeats the entire point of the split.
- **Absence is not an error.** No `OVERVIEW.md`, no `modules/`, or a map row whose `Doc` column is `—` are all normal — fall back to the technical files, exactly as before (see "Zero regression"). A missing module doc means "not researched yet"; mention it if it blocks you, but never fail on it.
- **Disambiguation:** `CODEBASE_DIR/modules/` (per-repo codebase context, written by `makuco-project-research`) is **not** `MAKUCO_ROOT/docs/modules/` (workspace-level modules/features of the Makuco pipeline). They are unrelated; never read or write one expecting the other.
