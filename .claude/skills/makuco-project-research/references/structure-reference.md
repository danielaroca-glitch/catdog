# Structure Reference

**Purpose:** Document directory layout, entry points and path aliases.

**Size limit:** 1,500 tokens (~900 words)

**Extract from:**

- The pass inventory (`SKILL.md` Step 0.5) — top-level directories, declared units
- Up to **4** files: entry-point manifest fields, alias config (`tsconfig.json`, `vite.config.*`)
- `.gitignore` for generated directories

**Input cap:** 6 files, 2 searches, 40 results each. Never walk the tree — the inventory already did.

Template and guidance for documenting the project structure in `<CODEBASE_DIR>/structure.md`.

## Template

```markdown
# Project Structure

## Overview

[One paragraph describing how the project is organized — monorepo or single-repo, what the top-level folders represent, and the organizing principle (by feature, by layer, by domain, etc.)]

## Top-Level Layout

```
project-root/
├── src/              — Application source code
├── tests/            — Test files (if not co-located)
├── docs/             — Documentation
├── scripts/          — Build and utility scripts
├── config/           — Configuration files
├── public/           — Static assets (frontend)
└── infra/            — Infrastructure definitions
```

## Entry Points

| Entry Point | Path | Purpose |
|-------------|------|---------|
| Main        | src/index.ts | Application bootstrap |
| CLI         | src/cli.ts   | Command-line interface |
| Worker      | src/worker.ts | Background job processor |

## Source Code Organization

Describe the internal structure of the source code directory:

```
src/
├── domains/          — Business domains (one folder per bounded context)
│   ├── orders/
│   │   ├── services/
│   │   ├── models/
│   │   └── repositories/
│   └── customers/
├── shared/           — Shared utilities, types, and helpers
├── infra/            — Infrastructure adapters (database, HTTP, messaging)
└── config/           — App configuration and environment
```

## Path Aliases

| Alias | Resolves To | Configured In |
|-------|-------------|---------------|
| ~/    | src/        | tsconfig.json |
| @/    | src/        | vite.config.ts |

## Monorepo / Modular Layout (if applicable)

Monorepo, workspace or modular-monolith: state only *how* units are declared and where they live — the unit-by-unit map lives in `OVERVIEW.md`.

Declarado em `pom.xml` `<modules>` — 32 módulos Maven na raiz, `core` compartilhado.
Mapa por módulo → [OVERVIEW.md](OVERVIEW.md).

## Generated / Build Artifacts

| Directory | Purpose | In .gitignore? |
|-----------|---------|----------------|
| dist/     | Compiled output | Yes |
| .next/    | Next.js build cache | Yes |
| coverage/ | Test coverage reports | Yes |
```

## Field Guidance

- **Top-Level Layout**: Only include directories that actually exist. Mark each with a brief `—` description.
- **Entry Points**: name the entry point of each **deployable unit** — one line each. In a repo with many units, name the units' entry-point **convention** and only the units that deviate from it; do not enumerate every bootstrap file. The manifest fields (`main`, `bin`, `exports`, `mainClass`) answer this without opening the files.
- **Path Aliases**: These are critical for agents to resolve imports correctly. Check `tsconfig.json` paths, `vite.config.ts` resolve.alias, webpack aliases.
- **Monorepo / Modular Layout**: Only include this section if the project declares separable units. Check `package.json` workspaces, `pnpm-workspace.yaml`, `lerna.json`, `pom.xml` `<modules>`, `settings.gradle`. Keep it to two lines — how units are declared and a link to `OVERVIEW.md`. The per-unit map (papel, doc) belongs to `OVERVIEW.md`; duplicating it here guarantees the two drift apart.

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| Root directory listing | Top-level organization |
| `package.json` `main`, `bin`, `exports` | Entry points |
| `tsconfig.json` `paths` | TypeScript path aliases |
| `vite.config.*` / `webpack.config.*` | Build-time aliases |
| `package.json` `workspaces`, `pnpm-workspace.yaml`, `pom.xml` `<modules>`, `settings.gradle` | Separable units (workspace packages, Maven/Gradle modules) |
| `.gitignore` | Generated/build directories |
