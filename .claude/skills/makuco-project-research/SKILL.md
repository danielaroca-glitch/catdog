---
name: 'makuco-project-research'
description: 'Two modes, and when the invocation is ambiguous the mode and its scope are decided with the user before anything is read. Index mode (cheap, the default when the ask is clear or there is no way to ask): fills the MAKUCO.md repos index — one router line per repo plus the module sub-bullets of a researched repo, from root-level files only, at a cost independent of repo size. Full research: OVERVIEW.md with the business role and module map, the seven technical files (stack, structure, architecture, conventions, integrations, concerns, testing) and optional modules/<slug>.md, reconciled against the team''s own reference docs, under a context budget in resumable passes. Full research covers one repo; a sweep over every repo under repos/ exists only when the user explicitly picks it, and never as a consequence of a detected GAP. Use when the index has pending descriptions, when those files are missing, incomplete or stale, when onboarding a project, or when a codebase GAP is detected. Triggers on: project research, map codebase, codebase analysis, missing codebase files, onboard project, setup makuco, analyze project structure, detect project stack, map modules, map services, what does this repo do, index repositories.'
---

# Makuco Project Research

Maps an existing codebase into the structured knowledge files under `.makuco/docs/codebase/` — the **single source of project/repo information** every other Makuco agent reads to know what the project *is for* and how it is built. Missing or incomplete files (a "GAP") make those agents produce generic output that does not match the project. `MAKUCO.md` is workspace-level: repos index and configuration/policies only, never project synthesis.

The output is layered on purpose, so a reader loads only what it needs:

| Layer | File | Answers |
|-------|------|---------|
| Workspace router | `MAKUCO.md` repos index | which repos exist, where, roughly what each one is for, and — for a researched repo — which modules it has |
| Repo entry point | `<CODEBASE_DIR>/OVERVIEW.md` | this repo's business role, nicknames/status, cross-repo relations, module map |
| Module detail | `<CODEBASE_DIR>/modules/<slug>.md` | what one module does for the business, by business area |
| Technical detail | the seven `stack`/`structure`/`architecture`/`conventions`/`integrations`/`concerns`/`testing` files | how it is built |

Readers go top-down and stop as soon as they have enough — never load an entire layer to find one module.

## Two modes — settle which one before you start

These layers cost wildly different amounts, and conflating them is what burns a session. **Filling the workspace router is not the same job as researching a repository**, and it must never be paid for at the same price.

| | **Index mode** | **Full research** |
|---|---|---|
| Produces | the `MAKUCO.md` repos index — one router line per repo | `<CODEBASE_DIR>/*` for **one** repo, plus that repo's module sub-bullets in the index |
| Scope | every repo under `repos/`, or a single one — see [Choosing the mode](#choosing-the-mode) | one repo; every repo only by explicit choice |
| Cost | flat, independent of repo size | bounded per pass (see Context budget) |
| Steps | [Step A](#step-a-index-mode) only | Steps 0 → 11, once per repo in scope |

**Index mode over every repo is the default** — it is what runs when the ask is clearly about indexing, and what runs when there is no way to ask. Full research is never reached by default, and never by iterating over the workspace.

### Choosing the mode

**Ask before reading anything** — before the Step A probe and before Step 0. The two modes differ by orders of magnitude in cost, so which one runs is the user's call whenever the invocation does not already settle it. Two questions, in sequence:

**1. Modo:**

> 1. **Índice** — preenche o roteador do `MAKUCO.md`; barato, não entra na árvore de nenhum repo
> 2. **Pesquisa completa** — `<CODEBASE_DIR>/*` (Steps 0 → 11)
> 3. **Ambos** — o índice primeiro, a pesquisa completa depois

**2. Escopo**, per the answer above:

| Answer to 1 | Question 2 |
|---|---|
| Índice | todos os repos de `repos/` (padrão) \| um repo só — qual? |
| Pesquisa completa | um repo — qual? (padrão) \| **todos** os repos de `repos/` (varredura) |
| Ambos | o índice cobre todos; a pesquisa completa: um repo — qual? (padrão) \| todos (varredura) |

Rules:

- **Asked at most once per invocation.** The answer is an **execution choice, not configuration** — it never reaches the `MAKUCO.md` YAML frontmatter. (`research.referencias` is the opposite: it *is* configuration, which is why it is asked once per workspace and recorded — see Step 0.)
- **Do not ask when the invocation already answers it.** Asking back what the request already said is friction, not safety:
  - the user names a repo → full research, that repo;
  - "indexa os repositórios" / "what are these repos" / right after `makuco init` or a clone / the index has `descrição pendente` entries → index mode, every repo;
  - a consumer (`makuco-desenvolver`, `makuco-backend`, `makuco-frontend`, `makuco-reviewer-*`, `makuco-ux`) needs `<CODEBASE_DIR>` for a repo somebody is about to work in → full research, that repo.
- **Resuming answers both questions.** "Continue" / "resume" means full research on the repo whose `.research-state.md` has pending work — take the mode and the scope from that pass, never from a fresh question (see Resume and freshness).
- **No way to ask** (non-interactive host): index mode over every repo — the safe default. Never the sweep.
- **Single-repo / legacy workspace** (`repos/` holds no repository sub-directory): neither question is asked. There is one target and no index to fill.
- **Exactly one repo under `repos/`**: question 2 is skipped — the answer is forced.
- **A codebase GAP never picks the mode.** N repos missing `<CODEBASE_DIR>` is normal in a fresh workspace, and it still leads to the index-mode default: fill the index for all of them, then research the one repo the current task actually touches. The only thing that authorises a sweep is the user choosing it **in this invocation**.

#### The sweep (full research over every repo) — explicit opt-in only

- **Confirm the cost once, with the real N, before reading anything:** N passes of up to 17,000 tokens of output each plus their evidence; that it very likely does not fit in one session; that it stops at a repo boundary and resumes there.
- **Strictly sequential, one repo at a time.** Each repo is a complete pass, Steps 0 → 11 — including its index entry (Step 10) and its `.research-state.md` (Step 11). Never fan repos out: the ≤ 4-concurrency budget is **inside** a repo (per file, per module), never across repos.
- Announce `repo <k>/<n>: <name>` when each one starts, and **close a repo before touching the next**. That boundary is the resume point.
- **The queue is derived, not stored:** the repos of the `MAKUCO.md` index, in index order, minus the ones already fresh per their own `.research-state.md`. No new artifact, no workspace-level state.
- **Per-repo caps are never widened nor pooled across repos.** A sweep is N bounded passes, not one big pass.
- Stopping midway is a normal outcome: say which repos landed, which remain, and that running the skill again continues from the first repo with pending work.

## Target repository resolution (multi-repo)

Before writing anything, resolve **where** the codebase docs go. A Makuco workspace may hold several repositories under a `repos/` folder at the workspace root (`makuco init` always creates that folder, so its mere existence means nothing — what counts is whether it contains repository sub-directories). Codebase context is **per repository** — each repo owns its own context and must not be mixed with another's:

- **Multi-repo (`repos/` contains at least one repository sub-directory):** research operates on **one target repository at a time**. The target is `repos/<name>/`. Define:

  ```
  <CODEBASE_DIR> = repos/<name>/.makuco/docs/codebase/
  ```

  Write every codebase file into that per-repo directory. Never write a repo's context into the workspace root's `.makuco/docs/codebase/`, and never into another repo's directory. If more than one repo is present and the target is ambiguous, resolve it with the scope question in [Choosing the mode](#choosing-the-mode) — never default to all of them, and never spread findings across the root. During a sweep the target is **one repo at a time**, resolved again at each repo boundary. (Index mode needs no target: it writes only to `MAKUCO.md`.)

  Because `<CODEBASE_DIR>` lives **inside** the managed repository (`repos/<name>/.makuco/…`), that directory would otherwise show up as untracked in the repo's own git. Before (or right after) writing the codebase files, ensure the target repo's own `.gitignore` contains a `.makuco/` entry, so Makuco's regenerable context is never accidentally committed into the client's repository. Add the entry if missing; it is idempotent — never duplicate it.

- **Single-repo / legacy (`repos/` absent, or present but with no repository sub-directory — only `README.md`):** behave as before —

  ```
  <CODEBASE_DIR> = .makuco/docs/codebase/
  ```

Everywhere below, `<CODEBASE_DIR>` means the directory resolved by this rule. `MAKUCO.md` is **workspace-level** and always stays at the workspace root regardless of this resolution; it never receives project synthesis — only the repos index (see Step 10).

## GAP Detection

Before any Makuco workflow begins, check for these files under the resolved `<CODEBASE_DIR>` (per-repo in a multi-repo workspace, root otherwise — see Target repository resolution):

```
<CODEBASE_DIR>/
├── OVERVIEW.md          ← entry point: business role, status, relations, module map
├── modules/<slug>.md    ← conditional (≥ 4 separable units) — NOT a GAP trigger
├── architecture.md
├── concerns.md
├── conventions.md
├── integrations.md
├── stack.md
├── structure.md
└── testing.md
```

If the directory or any of the 8 files is missing, that repo has a GAP. In a multi-repo workspace a GAP is evaluated **per repository** — each `repos/<name>/` has its own `<CODEBASE_DIR>`.

**A GAP is closed for the repo at hand, not for the workspace.** Report which repos have one, then run full research on the one that is actually needed now. The others keep their index line and wait. A list of GAPs is a report, never a work queue — only the user explicitly choosing the sweep in [Choosing the mode](#choosing-the-mode) turns it into one.

`modules/` is **conditional and incremental**: its absence is never a GAP, and a module map row without a doc means "not researched yet", not "nothing there" (see Step 9).

## Step A: Index mode

An index line is a **router**: one sentence of business role plus a short stack. It needs no architecture, no conventions, no testing, no module docs — and it must never trigger them.

The **repos in scope** are the ones the scope question settled ([Choosing the mode](#choosing-the-mode)): every repo under `repos/` by default, or the single one the user named. Everything below applies once per repo in scope, and to no other repo.

### 1. Get the mechanical half from root-level files only

One probe per repo in scope, reading nothing below its root. A 40,000-file monolith costs the same as a 20-file utility because the tree is never entered:

```bash
R=repos/<name>
ls -1 "$R" | head -40
sed -n '1,40p' "$R/README.md"
git -C "$R" remote get-url origin
```

Then **one** root manifest — whichever the listing showed — for the stack and the declared-unit count:

```bash
sed -n '/<modules>/,/<\/modules>/p' "$R/pom.xml" | head -40
```

(or `name`/`dependencies`/`workspaces` from `package.json`, or `go.mod` / `Cargo.toml` / `requirements.txt` / `*.csproj` / `settings.gradle`.)

**3 files per repo, hard cap.** Never open source code in index mode; never walk the tree; never read a lock file. No root manifest at all? Take the stack from the extension mix of the root listing and mark it `(inferido por extensão)`.

### 2. Write the one sentence a machine cannot

The probe already gave you the stack. You supply the business role, from the README lead, the team's reference docs (Step 0's `research.referencias`), and the remote/repo name. Then write the entry per [Step 10](#step-10-makucomd--index--config-only-no-project-synthesis)'s format and rules.

- **A missing or boilerplate README means the role is not on disk.** Ask the user, or write `_(papel de negócio a confirmar)_` — never infer a purpose from the folder name. A wrong router line is worse than an admitted gap, because every downstream agent routes on it.
- **A stack marked `(inferido por extensão)` is a guess, not a finding.** Keep the marker or drop the stack half; do not launder it into a confident claim.
- A repo whose `<CODEBASE_DIR>/OVERVIEW.md` already exists takes its role from there instead — that is strictly better than the README, and free.
- Cap the entry at ~250 characters. Omit the `→ docs:` continuation line for a repo with no `<CODEBASE_DIR>` yet; it gets one when full research runs.

### 3. Close the pass

Index mode is **done** when no `descrição pendente` placeholder remains for any repo in scope — every repo under `repos/` in the default scope, the single named repo otherwise (the placeholders of out-of-scope repos stay untouched, and you say which they are). Then state which repos have no `<CODEBASE_DIR>` yet and that full research is available per repo, on request — do **not** start it.

## Context budget

Research reads a codebase; a codebase is unbounded. Without a ceiling this skill consumes the whole session on a large repository, and a session that dies mid-pass leaves nothing behind. The budget is what makes a pass finish, and Step 11 is what makes an unfinished pass resumable.

**A pass is a unit of work, not "the whole repo".** A big repository is researched in several passes, each one complete in itself. That is the design, not a degradation.

Output ceiling for `<CODEBASE_DIR>` excluding `modules/`: **17,000 tokens** — overview 2,000 + stack 2,000 + structure 1,500 + architecture 3,000 + conventions 3,000 + integrations 2,000 + concerns 2,500 + testing 1,500. `modules/` has no folder ceiling because a reader opens exactly one file from it.

The input rules — the escalation ladder, the at-the-wire search caps, the parent-manifest rule, and where the ceiling sits in delegated vs inline mode — are in [context-budget.md](references/context-budget.md). The numeric caps that a worker must obey are inlined in each step below, because a cap behind a link is a cap a worker skips.

**Hitting a ceiling is a resume, not a failure.** Write what you established, record what is pending in `.research-state.md` (Step 11), tell the user what remains, and end the pass. A cap is never raised during a pass.

## Delegation

Full research is expensive because of the **evidence**, not the output — and evidence that lands in the orchestrator's context stays there for the rest of the session. So the orchestrator coordinates and writes what spans the pass; sub-agents do the reading.

| Work | Who |
|---|---|
| Step 0 (reference docs), Step 0.5 (inventory) | orchestrator — compact, shared by every worker |
| Steps 1–7 (the seven technical files) | one sub-agent **per file**, ≤ 4 concurrent |
| Step 8 (`OVERVIEW.md`) | orchestrator — zero new code reads |
| Step 9 (module docs) | one sub-agent **per module** in the batch, ≤ 4 concurrent |
| Steps 10–11 (index, pass state) | orchestrator |

A worker receives its step, the inventory, its reference template, its output path, **its caps inlined**, and the relevant reference-doc slice — and returns **only** the path written plus one ≤ 20-word line. The orchestrator therefore never holds a line of the repo's code.

Steps 1–7 are independent because a later step consumes an earlier one's **file on disk**, never its working context — with **one** ordering constraint: Step 3 reads `structure.md`, so dispatch Step 2 in the first wave and Step 3 only after it returns. Steps 1, 4, 5, 6 and 7 have no such dependency.

**Run inline instead** when the repo has ≤ 200 tracked files, or when the host has no sub-agent mechanism — same caps, one step at a time, discarding each step's working context after its file is written. The payload rules, the return rules and the inline fallback are in [delegation-contract.md](references/delegation-contract.md).

## Full research workflow (one repo per pass)

Only for the repo somebody is about to work in — or, during a sweep, the one repo of the current boundary. If the ask was "index the repositories" or "what are these repos", you are in the wrong section — go to [Step A](#step-a-index-mode). If the invocation never said, go back to [Choosing the mode](#choosing-the-mode) before opening a single file.

Follow this order — a later step consumes an earlier step's **written output on disk**, never its working context.

**Skip a step whose output file already exists and is fresh** (see Step 11 for what "fresh" means), unless this pass was explicitly asked to refresh it. Re-deriving a file that is already on disk is the largest single waste available in this skill. When you skip, say so. What you may never skip is the evidence discipline: a file you *do* write is grounded in what you read this pass, never in assumption.

Read [code-analysis.md](references/code-analysis.md) for techniques on how to analyze the codebase effectively — and for the search caps the budget above requires.

### Step 0: Reference Sources

Before writing anything, find out whether the team already documents this ecosystem by hand. Read the YAML frontmatter of `MAKUCO.md` at the workspace root:

```yaml
research:
  referencias: ['INDEX.md'] # paths relative to the workspace root
```

- **Key present with paths** → those docs are inputs for every step below.
- **Key present and empty (`[]`)** → the team already said there is none. Do not ask again.
- **Key absent** → ask **once**: is there a reference doc for these repos (a repo index, wiki export, onboarding page, ADRs)? Record the answer in the frontmatter — a path list, or `[]` — so the question is asked at most once per workspace. This is configuration, which is exactly what `MAKUCO.md` is allowed to hold (see Step 10).

Authority split: **the code** is authoritative for anything mechanically checkable (structure, stack, module list, dependencies); **the reference doc** is authoritative for intent — business purpose, internal nicknames, obsolescence status, which system consumes which. When the two disagree about something checkable, the code wins and the divergence is recorded.

Nothing from a reference doc reaches a generated file without passing through the verification and marking procedure in [reference-docs-reconciliation.md](references/reference-docs-reconciliation.md) (`✓` confirmed / `⚠` in the doc but not found in code / `+` in code but absent from the doc). Reference docs are **read-only** — never edit or regenerate them.

**Budget:** read each declared doc **once**, at most 2 docs, at most 600 lines each, and only the sections that name the repo of this pass. Index a larger doc with `grep -n '^#' <doc> | head -60` and read the selected sections only. Claim verification is capped at 20 claims and 5 searches for the whole pass — see [reference-docs-reconciliation.md](references/reference-docs-reconciliation.md).

### Step 0.5: Inventory (one bounded scan)

This is the **only** place the directory tree is walked. Every step below reads this inventory instead of re-globbing, so the same tree is never traversed twice. `git ls-files` comes first because it already honours `.gitignore` — build output and dependencies never enter the scan.

```bash
REPO=<REPO_ROOT>

git -C "$REPO" ls-files | wc -l
git -C "$REPO" ls-files | awk -F/ 'NF>1 {print $1}' | sort | uniq -c | sort -rn | head -40
git -C "$REPO" ls-files | awk -F. 'NF>1 {print $NF}' | sort | uniq -c | sort -rn | head -25
git -C "$REPO" ls-files | grep -E '(^|/)(package\.json|pom\.xml|build\.gradle(\.kts)?|settings\.gradle(\.kts)?|pnpm-workspace\.yaml|lerna\.json|go\.mod|Cargo\.toml|requirements\.txt|Pipfile|Gemfile|[^/]+\.csproj|Dockerfile|docker-compose\.ya?ml|\.env\.example)$' | awk -F/ 'NF<=4' | head -80
git -C "$REPO" ls-files | grep -E '(^\.github/workflows/|^azure-pipelines|^\.gitlab-ci|^Jenkinsfile|^sonar-project\.properties|^\.editorconfig|^\.prettierrc|eslint\.config|^tsconfig\.json)' | head -30
TESTS='(^|/)(tests?|__tests__|spec)/|\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|(^|/)test_[^/]+\.[a-z]+$|Tests?\.(java|kt|cs)$'
git -C "$REPO" ls-files | grep -Eic "$TESTS"
git -C "$REPO" ls-files | grep -Ei "$TESTS" | head -20
git -C "$REPO" log --oneline -20
```

The test pattern matches **test-file naming**, not any path containing the word. A bare `grep -Ei '(test|spec)'` counts a `.specs/` folder and every doc with "test" in its name as tests, and Step 7 then reports a suite that does not exist — a wrong footprint is worse than no footprint.

Then read **one** file to get the declared units — the parent manifest the scan above found, never a recursive glob:

```bash
sed -n '/<modules>/,/<\/modules>/p' "$REPO/pom.xml" | head -60
```

(or the `include` lines of `settings.gradle`, `workspaces` in `package.json`, `packages` in `pnpm-workspace.yaml`.)

**Not a git work tree?** Same caps, explicit prune:

```bash
find <REPO_ROOT> -maxdepth 3 -type d \( -name node_modules -o -name target -o -name dist -o -name build -o -name vendor -o -name .git \) -prune -o -type d -print | head -60
```

The step produces a compact inventory — total tracked files, top-level directories with counts, the extension histogram, manifest and CI paths, the declared units with their paths, the test footprint and the commit-subject sample. That inventory, **not the raw tree**, is what Steps 1–3 and the Step 8 module map consume. It is recorded in `.research-state.md` (Step 11) so a resumed pass never repeats the scan.

**Budget:** the commands above, once. No file read beyond the one parent manifest. Never re-run the inventory mid-pass; a step needing a path the inventory lacks may glob **once**, scoped to its own module or config family, and that glob counts against its search cap.

This is also what makes the Step 8 claim that the module map is cheap true by construction: the map is `declared_units` plus top-level directories, both already in hand.

### Step 1: Identify the Stack

Research the project's technology stack by examining:

- **Package manifests**: `package.json`, `requirements.txt`, `Pipfile`, `Gemfile`, `go.mod`, `pom.xml`, `build.gradle`, `Cargo.toml`, `*.csproj`
- **Lock files**: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `poetry.lock`
- **Runtime configs**: `.node-version`, `.nvmrc`, `.python-version`, `.ruby-version`, `.tool-versions`
- **Build configs**: `tsconfig.json`, `webpack.config.*`, `vite.config.*`, `esbuild.*`, `rollup.config.*`, `tsup.config.*`
- **Container configs**: `Dockerfile`, `docker-compose.yml`, `.dockerignore`

**Budget:** the root/parent manifest + up to 6 config files, 2 searches, 40 results each. Lock files are never read — confirm existence with `ls` to name the package manager, and grep one line if a pinned version matters.

Write findings to `<CODEBASE_DIR>/stack.md` following the reference template: [references/stack-reference.md](references/stack-reference.md)

### Step 2: Map the Structure

Analyze the project's directory layout and understand how code is organized:

- List the top-level directories and their purpose
- Identify the entry point(s)
- Map path aliases (e.g., `~/` → `src/`, `@/` → `src/`)
- Identify how separable units are declared if applicable (workspaces, packages, Maven/Gradle modules) — the unit-by-unit map belongs to `OVERVIEW.md` (Step 8), not here
- Note any code generation or scaffolding patterns

**Budget:** the Step 0.5 inventory + up to 4 files (entry-point manifest fields, alias config), 2 searches, 40 results each. Do not re-list the tree — the inventory already carries the top-level layout and the declared units.

Write findings to `<CODEBASE_DIR>/structure.md` following the reference template: [references/structure-reference.md](references/structure-reference.md)

### Step 3: Discover the Architecture

Research the architectural patterns in use:

- **Pattern identification**: Layered, hexagonal, clean architecture, MVC, CQRS, event-driven, microservices, monolith
- **Component boundaries**: How are domains/modules/features separated?
- **Data flow**: How does data move through the system? (request → controller → service → repository → database)
- **State management**: How is application state handled? (Redux, Zustand, Context, Vuex, MobX, signals)
- **API style**: REST, GraphQL, gRPC, tRPC, WebSocket

Look for these clues:
- Folder structure (e.g., `domains/`, `modules/`, `features/`, `layers/`)
- Base classes or interfaces that define contracts
- Dependency injection patterns
- Middleware chains or pipelines

**Budget:** up to 8 source files — **one representative per detected layer**, never N implementations of the same layer — plus 6 searches, 30 results each. The pattern is read off the shape of the folders and the base classes a capped search reveals, not off the bodies of the implementations. Tracing one real request end-to-end beats sampling twenty files. The complete unit-by-unit map belongs to `OVERVIEW.md` (Step 8) — never restate it here.

Write findings to `<CODEBASE_DIR>/architecture.md` following the reference template: [references/architecture-reference.md](references/architecture-reference.md)

### Step 4: Map Conventions

Identify the coding conventions enforced or adopted by the project:

- **Linting & formatting**: ESLint rules, Prettier config, Biome, EditorConfig
- **Naming patterns**: File naming (kebab-case, camelCase, PascalCase), variable naming, function naming
- **File organization**: Where do tests go? Where do types go? Co-location vs centralized?
- **Import patterns**: Absolute vs relative, barrel files (index.ts), path aliases
- **Commit conventions**: Conventional commits, branch naming, PR templates
- **Code style**: Functional vs OOP, immutability preferences, error handling patterns

**Budget:** up to 10 source files spread across layers + 6 config files, 3 searches, 30 results each. `git log --oneline -20` for the commit convention. The 5–10 file range in the template is a ceiling, not a target — naming and import conventions are claims about what predominates, which a handful of files across layers already settles.

Write findings to `<CODEBASE_DIR>/conventions.md` following the reference template: [references/conventions-reference.md](references/conventions-reference.md)

### Step 5: Catalog Integrations

Map all external dependencies and integrations:

- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, SQLite, DynamoDB
- **External APIs**: Third-party services, payment gateways, auth providers (OAuth, SAML)
- **Message brokers**: RabbitMQ, Kafka, SQS, Redis Pub/Sub
- **Cloud services**: AWS, Azure, GCP services in use
- **Monitoring & observability**: Sentry, Datadog, New Relic, Prometheus, Grafana
- **CI/CD**: GitHub Actions, GitLab CI, Azure DevOps, Jenkins
- **Infrastructure as code**: Terraform, Pulumi, CloudFormation

Look for:
- **Declared dependencies** in the manifests the inventory listed — this is the primary source for which SDKs and clients exist
- Environment variables (`.env.example`, `.env.sample`)
- Configuration files for external services
- Docker compose services

**Budget:** `.env.example` + `docker-compose.yml` + up to 4 CI/IaC files, 10 files total, 6 searches, 30 results each. The SDK inventory comes from **declared dependencies**, not from a repo-wide import sweep. When you must confirm a declared package is actually wired up, use **one** alternation over the package names (`rg -l --max-count 1 -e '<pkg-a>' -e '<pkg-b>' | head -30`) — never one search per package.

Write findings to `<CODEBASE_DIR>/integrations.md` following the reference template: [references/integrations-reference.md](references/integrations-reference.md)

### Step 6: Identify Concerns

Map cross-cutting concerns — aspects that affect the entire application rather than a single module:

- **Authentication & authorization**: How are users authenticated? Role-based access? Token management?
- **Logging**: Structured logging? Log levels? Where do logs go?
- **Error handling**: Global error handlers, error response formats, custom error classes
- **Validation**: Input validation approach (Zod, Joi, class-validator, custom)
- **Caching**: Cache strategies, cache invalidation, where caching is applied
- **Internationalization (i18n)**: Multi-language support, translation approach
- **Security**: CORS, CSP, rate limiting, input sanitization, HTTPS enforcement
- **Performance**: Lazy loading, code splitting, pagination strategies

**Budget:** up to 6 files — at most **one per category** — 10 files total, 6 searches (one per category), 30 results each. Declared dependencies already name the auth, validation, logging and security libraries before any code is read. A category with no hit in its one search is **omitted** from the output; proving an absence costs more than it is worth, and the template's omit-empty-sections rule already covers it.

Write findings to `<CODEBASE_DIR>/concerns.md` following the reference template: [references/concerns-reference.md](references/concerns-reference.md)

### Step 7: Map Testing

Research the testing approach and infrastructure:

- **Test framework**: Jest, Vitest, Mocha, pytest, RSpec, xUnit, JUnit
- **Test types present**: Unit, integration, e2e, contract, snapshot, visual regression
- **Test location**: Co-located (`*.spec.ts` next to source) vs centralized (`tests/` folder)
- **Naming conventions**: `*.test.ts`, `*.spec.ts`, `*_test.go`, `test_*.py`
- **Mocking approach**: Jest mocks, msw, nock, factory patterns, fixtures
- **Coverage tools**: Istanbul/nyc, c8, coverage.py, SimpleCov
- **E2E tools**: Cypress, Playwright, Selenium, Detox
- **Test scripts**: Available npm/make/gradle tasks for running tests

**Budget:** the test config + the manifest's test scripts + **2–3** test files, 7 files total, 3 searches, 30 results each. Never enumerate the suite: the test count, location and naming convention all come from the Step 0.5 inventory; only the mocking/fixture style needs a file opened.

Write findings to `<CODEBASE_DIR>/testing.md` following the reference template: [references/testing-reference.md](references/testing-reference.md)

### Step 8: Write the Repo Overview

Steps 1–7 answer *how this repo is built*. None of them answers *what it is for* — and that is the first thing any agent (or human) needs. Write `<CODEBASE_DIR>/OVERVIEW.md`, the entry point of the repo's context:

- **Papel no ecossistema** — one business-oriented paragraph: what problem this repo solves, for whom, where it sits in the product flow.
- **Apelidos e status** — internal nicknames (`v3`, `FLEX`, `painel`), lifecycle status (ativo / legado / em migração) and what it replaces or is replaced by. This is how the team actually refers to the system; without it an agent cannot map a request to a repo.
- **Consome / é consumido por** — relations with the other repos in the `MAKUCO.md` index and with external parties. Evidence: base URLs, generated clients, shared topic/queue names, file-drop conventions.
- **Mapa de módulos** — one row per separable unit: name, path, one-line role, and a link to its module doc (`—` when none exists yet). Group cohesive shared libraries into a single row.
- **Contexto detalhado** — links to the seven files from Steps 1–7.
- **Divergências** — the `⚠` and `+` marks accumulated during reconciliation. Omit the section when there is no reference doc or nothing diverged.

The module map is **always** produced — it is cheap (the Step 0.5 inventory's declared units and top-level directories, plus the reference doc) and it is what makes Step 9 incremental. Group cohesive shared libraries into a single row; past **40 rows**, grouping stops being optional.

The map is also the **only** source of the module sub-bullets Step 10 writes into the `MAKUCO.md` entry — one more reason it is never skipped, and the reason its grouping is inherited there instead of re-decided.

Business meaning at **repo** scale only; per-module capabilities go to Step 9. Never restate stack/architecture detail here — link to the file that owns it.

**Budget: zero new code reads.** The sources for this step are the Step 0.5 inventory, the seven files this pass just wrote, the repo's `README.md` (first 200 lines) and the reference-doc sections already read in Step 0. If you find yourself opening a source file here, the business role is not in the code — say so explicitly instead, as [overview-reference.md](references/overview-reference.md) requires.

Follow the reference template: [references/overview-reference.md](references/overview-reference.md)

### Step 9: Write Module Docs (conditional)

**Trigger:** the repo has **≥ 4 separable units with their own boundary** — a Maven/Gradle module, a workspace package, an app, a feature folder with its own entry point. Below that threshold, `modules/` is **not** created and the capability map stays inline in the `OVERVIEW.md` module map's role column.

For each qualifying module, write `<CODEBASE_DIR>/modules/<slug>.md` (`<slug>` = the module's directory name, kebab-cased) describing its **business capabilities grouped by business area** — what the module does, never its call surface. Follow the reference template and its depth rule: [references/module-reference.md](references/module-reference.md)

Rules:

- **The map is the mandatory deliverable; the module docs are incremental.** One pass produces `OVERVIEW.md` with the **complete** map and at most **8** `modules/<slug>.md` files. A row whose `Doc` column is `—` means *not researched yet*; when a later pass researches that module, fill the link. Every consumer already treats `—` that way and is told not to fail on it, so a repo with 32 modules legitimately ends pass 1 with 24 `—` rows.
- **Batch selection**, in this order: modules the user named → modules with the largest code mass per the inventory → modules the reference docs single out. Shared libraries and thin wrappers never enter the batch.
- **Depth is capability-level.** `Aprova contratos em lote.` — not `POST /contratos/aprovacao-massiva`, not a controller/class inventory. Named scheduler lists, consumer/topic tables and step-by-step pipelines belong to `integrations.md` / `architecture.md`, which already own that detail.
- **Skip trivial modules.** A shared utility library or thin wrapper gets one row in the `OVERVIEW.md` map and no file. A cohesive family of libraries may share a single doc (e.g. `core` + `core-messages` + `common-data` + `common-session` → one file, one row). Record each skip **with its reason** in `.research-state.md`, or a later pass re-researches what was deliberately discarded.
- **Budget per module:** at most **8 source files** opened, 12 files total, 4 searches, 25 results each. The business areas come from the **names** in a path listing, not from the contents — see [module-reference.md](references/module-reference.md). A module with 41 controllers is one listing plus up to 8 reads, never 41 reads.
- **Sub-agent delegation.** One sub-agent per module in the batch, at most **4 concurrently**, each receiving the payload defined in [delegation-contract.md](references/delegation-contract.md) — the module's name/slug/path, the ≤ 10 candidate paths from the inventory, [module-reference.md](references/module-reference.md), its output path, its caps **inlined**, and the reference-doc slice about that module. It returns **only** the path written plus one ≤ 20-word line of role for the map. Without a sub-agent mechanism, run inline one module at a time with a batch of **4**, discarding each module's working context after its file is written.
- The **orchestrator** still owns `OVERVIEW.md` (Step 8) and the `MAKUCO.md` index (Step 10) — neither happens for free because module files appeared.
- `<CODEBASE_DIR>/modules/` is repo context. It has nothing to do with `MAKUCO_ROOT/docs/modules/`, the workspace-level modules/features of the Makuco pipeline. Never write one into the other.

### Step 10: MAKUCO.md — index + config only (no project synthesis)

**Do not write project synthesis into `MAKUCO.md`.** The `.makuco/docs/codebase/*` files produced in Steps 1–9 are the single source of project/repo information (business role, modules, stack, architecture, conventions, etc.). `MAKUCO.md` is workspace-level and holds only:

- **Configuration/policies** — e.g. the `analise.aprovador` and `research.referencias` YAML frontmatter and any manual team overrides. Leave these untouched unless the user asks to change them (Step 0 may add `research.referencias`).
- **The managed repos index** — the section between `<!-- makuco:repos:start -->` … `<!-- makuco:repos:end -->` (multi-repo only; see below).

This holds in **both** layouts: a single-repo/legacy workspace `MAKUCO.md` is also index + config only — no "What is X", "Tech Stack", "Architecture", "Code Rules", "Design System", or "Key Patterns" sections. Readers (`makuco-desenvolver`, `makuco-backend`, `makuco-frontend`, `makuco-reviewer-*`, `makuco-ux`, `makuco-analisar`) get project detail from `<CODEBASE_DIR>` — starting at `OVERVIEW.md` — and read `MAKUCO.md` only for policies/config and to find out which repos exist.

In a multi-repo workspace, update the repo's entry inside `MAKUCO.md`'s managed index section — from [Step A](#step-a-index-mode) in index mode, or right after finishing full research for `repos/<name>/`. The entry is the routing layer: **business role first, then stack**, a pointer to the repo's `OVERVIEW.md` when one exists, and — after full research — the repo's module map as sub-bullets, so the router routes all the way to the module:

```
- **<name>** — `repos/<name>` — <papel de negócio em uma frase> — <stack curto>
  → docs: `repos/<name>/.makuco/docs/codebase/OVERVIEW.md` (<N> módulos)
  - <módulo> — `<caminho>` — <papel em uma linha>
```

Concretely:

```
- **csg-mxt-backend** — `repos/csg-mxt-backend` — Backend v3 do Consignet (crédito consignado): contratos, margem, folha, integrações banco/RH — Java 21/Spring Boot 3.5, Oracle, Kafka, Keycloak
  → docs: `repos/csg-mxt-backend/.makuco/docs/codebase/OVERVIEW.md` (32 módulos)
  - contrato — `contrato/` — Núcleo de negócio: contratos, margem, folha
  - admin — `admin/` — Configuração, convênios, empresas, conteúdo
  - agendador-processos — `agendador-processos/` — Agendamento de processos internos
  - core, core-messages, common-data, common-session — `core/`, … — Bibliotecas compartilhadas
```

Rules for the index:
- **Source of the entry, cheapest first:** the repo's `OVERVIEW.md` and `stack.md` when they exist (free — already written and capped); otherwise the [Step A](#step-a-index-mode) root-level probe. **An index entry never requires researching the repo.** Requiring `OVERVIEW.md` here would make the router cost a full survey per repo, which is exactly the trap this skill must not fall into.
- Cap the entry line at ~250 characters — it is a router, not a summary. Everything that does not fit belongs in `OVERVIEW.md`.
- Keep the `- **<name>** — \`repos/<name>\` — …` shape intact so the index stays parseable — only the trailing text changes. The `→ docs:` line is an indented continuation and is optional: omit it for a repo with no `<CODEBASE_DIR>` yet, and omit the module count when the repo has no `modules/`.

Rules for the module sub-bullets:
- **Source: the `Mapa de módulos` of the repo's `OVERVIEW.md`, copied verbatim** — the `Módulo`, `Caminho` and `Papel` columns, in the map's own order and with the map's own grouping. The `Doc` column stays out: the index routes, and the link to a module doc is reached through `OVERVIEW.md`. **Zero new reads, zero new derivation** — if you are deciding anything here, you are doing Step 8's job twice.
- **Only full research writes them.** [Step A](#step-a-index-mode) never does: it does not enter the tree, it stays at 3 root files per repo, and it has no module map to copy. An index-mode pass leaves existing sub-bullets exactly as they are.
- Write the block when the map has **≥ 2 rows**; omit it for a repo with no separable units (its role already says everything the router needs).
- **A sub-bullet never carries the module name in bold, and never a `repos/…` path in backticks.** the index parser matches ``- **<name>** — `repos/<name>` `` to find a repo entry; a sub-bullet shaped like that would be parsed as a phantom repo and dropped on the next `makuco init`. The form above (indented, no bold, a repo-relative path) falls into the continuation branch and is preserved verbatim.
- Each sub-bullet ≤ 120 characters; the ~250-character cap applies to the entry line, not to the block.
- Only touch the target repo's entry; never rewrite other repos' entries or any content outside the managed markers.
- If the managed section or the repo's entry is missing, add it rather than failing (keep it consistent with the seeded format).
- In a single-repo/legacy workspace `repos/` holds no repository sub-directory and there is no index to update — leave `MAKUCO.md` as-is.

**This index update is REQUIRED, not optional — neither mode is "done" until it lands.** It is the entire reason the multi-repo index exists; skipping it leaves the workspace entry point (`MAKUCO.md`) describing the repo as `descrição pendente`. Two failure modes to avoid explicitly:

- **Sub-agent orchestration:** when Steps 1–9 are delegated to research sub-agents, they write `<CODEBASE_DIR>` but the **orchestrator** must still perform this `MAKUCO.md` index update after they return — it does not happen for free just because the `codebase/*` files exist.
- **Index mode over several repos:** write every repo in scope's entry before finishing. The whole point of the mode is that the router ends up complete in one pass.

**Completion check before ending the skill:**
- Index mode: no `descrição pendente` placeholder remains for any repo **in scope**.
- Full research: `<CODEBASE_DIR>/OVERVIEW.md` exists with a populated module map, and the repo's index entry shows a real role + stack, its `→ docs:` line, and its module sub-bullets whenever that map has ≥ 2 rows.
- Sweep: the two checks above hold for **every repo already closed**, and the repos still pending are named to the user.

### Step 11: Record the pass state

Write `<CODEBASE_DIR>/.research-state.md`, seeded from [assets/research-state-template.md](assets/research-state-template.md). It lives inside `.makuco/`, already covered by the `.gitignore` entry ensured during target resolution. The dot prefix keeps it out of any reader's file set: it is this skill's own working state, never context for a consumer, and no downstream reader depends on it.

Record: the repo and the pass's `git rev-parse --short HEAD`; the Step 0.5 inventory; which output files completed; the module batch done, the ones still pending, and the ones skipped **with their reason**; reference-doc claims left over the 20-claim budget; whether the `MAKUCO.md` index update landed; and any cap that was hit.

**Update it after each module returns**, not once at the end of the batch — a session that dies must lose at most one module's work.

`index_updated: false` makes the two failure modes above machine-checkable instead of merely written down: **the pass is not done while that field is `false`.**

#### Resume and freshness

Read this file **first** when it exists. State in one line what is fresh, what is pending and which modules remain, then jump straight to the first step with pending work. Never replay a completed step to "warm up", never re-ask which repo, never repeat the inventory.

An output is **fresh** when the file exists, is non-empty, and `.research-state.md` lists it as done for the current `commit`. Fresh outputs are skipped **without being read** — do not open a file to decide whether to keep it.

**No `.research-state.md` but output files already on disk** — the normal state of a repo researched before this file existed. Do **not** re-derive them: record each one in a new `.research-state.md` as `adopted` at the current `HEAD`, and research only what is actually missing. Then tell the user which files were adopted without verification and that a refresh of any of them is available on request. Adopting a file of unknown provenance is cheap and reversible; re-deriving seven files somebody already has is the whole waste this skill exists to avoid.

When the recorded `commit` differs from the current `HEAD`, do **not** invalidate everything. Run one capped diff and re-run only the outputs whose recorded evidence paths it touches:

```bash
git -C <REPO_ROOT> diff --name-only <recorded-commit>..HEAD | head -200
```

Everything else stays fresh. If the diff exceeds 200 lines, treat the whole pass as stale and start fresh. That turns a refresh on a large monolith from re-researching everything into one diff.

**Ending a pass with work left is a normal outcome.** Close by telling the user what landed, what is pending (the module list from this file), and that running the skill again continues from here.

## Research Techniques

When investigating a codebase, use these approaches:

1. **Start with the inventory**: Step 0.5 already answers the directory shape, the extension mix and the declared units. Reach for it before any glob.
2. **Then manifests**: package files reveal the stack faster than reading code — and the parent manifest reveals the unit list without touching a unit.
3. **Read configs before code**: build/lint/test configs reveal patterns and conventions with no code read at all.
4. **Search for patterns, capped**: grep for import patterns, decorators and base classes — one alternation covering every name you care about, `-l`/`--max-count`, piped through `head`. Names beat bodies.
5. **Follow one entry point**: trace a single real request end-to-end to understand data flow. One trace beats sampling twenty files.
6. **Check CI/CD pipelines**: they reveal build steps, test commands, and deployment targets.
7. **Read existing documentation**: README, CONTRIBUTING, wiki, ADRs (Architecture Decision Records).
8. **Inspect environment variables**: `.env.example` reveals external dependencies.
9. **Reconcile, don't discard**: the team's own reference docs carry business intent no manifest can state — verify by claim *shape* against the code and mark it, instead of ignoring or copying it.

## Output Quality Rules

- Every claim must be backed by evidence found in the codebase (file paths, configurations, code patterns).
- If something is ambiguous or cannot be determined, state it explicitly rather than guessing.
- Use relative paths from the project root when referencing files.
- Keep each codebase file focused on its domain — avoid duplicating information across files.
- Use consistent markdown formatting across all generated files.
- Business meaning belongs to `OVERVIEW.md` (repo scale) and `modules/*.md` (module scale); the other seven files stay technical.
- Keep the project's domain vocabulary exactly as the code and the team use it — never translate domain terms.
- Claims taken from a reference doc and not confirmed in the code are `⚠` entries in `OVERVIEW.md`'s `## Divergências`, never ordinary content.
- **Say what you did not cover.** A pass that stopped at a cap, batched only part of the modules, or left claims unverified must state that — in `.research-state.md` and to the user. Silent truncation reads as "fully mapped" when it is not, and that is the one output failure a reader cannot detect.
- Respect each template's `Size limit`. A file over its limit is not more thorough; it is a file the readers will stop reading.

## References

Detailed templates and field descriptions for each codebase file:

- [references/overview-reference.md](references/overview-reference.md) — How to document the repo's business role and module map
- [references/module-reference.md](references/module-reference.md) — How to document a module's business capabilities
- [references/reference-docs-reconciliation.md](references/reference-docs-reconciliation.md) — How to consume and verify the team's own reference docs
- [references/stack-reference.md](references/stack-reference.md) — How to document the technology stack
- [references/structure-reference.md](references/structure-reference.md) — How to document project structure
- [references/architecture-reference.md](references/architecture-reference.md) — How to document architecture
- [references/conventions-reference.md](references/conventions-reference.md) — How to document conventions
- [references/integrations-reference.md](references/integrations-reference.md) — How to document integrations
- [references/concerns-reference.md](references/concerns-reference.md) — How to document cross-cutting concerns
- [references/testing-reference.md](references/testing-reference.md) — How to document testing
- [references/code-analysis.md](references/code-analysis.md) — Search tooling, the escalation ladder, and the search caps the context budget requires
- [references/context-budget.md](references/context-budget.md) — The input rules and where the ceiling sits in delegated vs inline mode
- [references/delegation-contract.md](references/delegation-contract.md) — What a sub-agent receives, what it returns, and when to run inline instead
- [assets/research-state-template.md](assets/research-state-template.md) — The pass-state file that makes a research pass resumable
