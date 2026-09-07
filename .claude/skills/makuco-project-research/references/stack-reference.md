# Stack Reference

**Purpose:** Document technology stack and dependencies.

**Size limit:** 2,000 tokens (~1,200 words)

**Extract from:**

- The **root/parent** dependency manifest (and, in a repo with more than 8 declared units, only that one — the unit list comes from its `<modules>`/`workspaces`/`include` block, not from globbing every unit's manifest)
- Build configuration
- Runtime configuration

**Input cap:** 8 manifests/configs, 2 searches, 40 results each.

Never read a lock file. Confirm it exists (`ls`) to name the package manager, and grep a single line if a pinned version matters.

Template and guidance for documenting the project's technology stack in `<CODEBASE_DIR>/stack.md`.

## Template

```markdown
# Technology Stack

## Runtime & Language

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js   | 20.x    | Server runtime |
| TypeScript| 5.x     | Type-safe development |

## Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| NestJS    | 10.x   | Backend framework |
| React     | 18.x   | UI library |

## Build & Bundling

| Tool      | Config File        | Purpose |
|-----------|--------------------|---------|
| tsup      | tsup.config.ts     | Library bundling |
| Webpack   | webpack.config.js  | App bundling |

## Package Manager

- **Manager**: pnpm / npm / yarn
- **Lock file**: pnpm-lock.yaml
- **Workspaces**: yes/no — if yes, list workspace paths

## Key Dependencies

List the most important dependencies that shape the project (not every dependency — just the ones an engineer needs to know about):

| Package         | Purpose                        |
|-----------------|--------------------------------|
| @prisma/client  | Database ORM                   |
| zod             | Schema validation              |
| axios           | HTTP client                    |

## Dev Dependencies

List key dev dependencies that affect the development workflow:

| Package    | Purpose                 |
|------------|-------------------------|
| vitest     | Test runner             |
| eslint     | Linting                 |
| prettier   | Code formatting         |

## Testing

| Tool      | Version | Purpose |
|-----------|---------|---------|
| Vitest    | 0.x     | Unit & integration tests |
| Playwright | 1.x     | End-to-end testing |
```

## Field Guidance

- **Version**: Use the major version range (e.g., `5.x`) unless a specific minor/patch matters.
- **Purpose**: One-line explanation of why this exists in the project.
- **Key Dependencies**: Focus on dependencies that define the project's architecture (ORM, validation, HTTP, state management) — not utilities like `lodash` or `uuid` unless they are central.
- **Config File**: Include the actual file path relative to the project root.

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| `package.json` / `requirements.txt` / `Gemfile` | Dependencies and versions |
| Lock files (`package-lock.json`, `yarn.lock`) | Exact resolved versions |
| `.node-version`, `.nvmrc`, `.tool-versions` | Runtime version |
| `tsconfig.json` | TypeScript configuration and target |
| `Dockerfile` | Base image reveals runtime and version |
| CI pipelines | Build matrix reveals supported versions |
