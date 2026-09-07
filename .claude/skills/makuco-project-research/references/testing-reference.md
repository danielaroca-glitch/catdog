# Testing Reference

**Purpose:** Document the test framework, test types, locations, conventions and commands.

**Size limit:** 1,500 tokens (~900 words)

**Extract from:**

- Test scripts in the manifest and the test config file(s)
- The inventory's test footprint (count + sample paths) — that is where test location and naming convention come from
- **2–3** existing test files, for patterns only

**Input cap:** 7 files (at most 3 of them test files), 3 searches, 30 results each.

Never enumerate the test suite. The count and the naming convention come from the inventory; the mocking/fixture style comes from 2–3 files.

Template and guidance for documenting the testing approach in `<CODEBASE_DIR>/testing.md`.

## Template

```markdown
# Testing

## Test Framework

| Tool | Purpose | Config File |
|------|---------|-------------|
| Vitest | Unit & integration tests | vitest.config.ts |
| Playwright | E2E tests | playwright.config.ts |
| msw | API mocking | src/mocks/handlers.ts |

## Test Types Present

| Type | Location | Naming Pattern | Run Command |
|------|----------|----------------|-------------|
| Unit | Co-located (*.spec.ts) | [name].spec.ts | npm run test:unit |
| Integration | tests/integration/ | [name].integration.spec.ts | npm run test:integration |
| E2E | tests/e2e/ | [name].e2e.spec.ts | npm run test:e2e |

## Test Location Strategy

- **Approach**: Co-located / Centralized / Mixed
- **Unit tests**: [Where they live relative to source files]
- **Integration tests**: [Where they live]
- **E2E tests**: [Where they live]

## Mocking Approach

- **HTTP mocks**: [msw / nock / jest.mock / custom]
- **Database mocks**: [In-memory DB / Test containers / Repository mocks]
- **Factory pattern**: [Factory library — e.g., fishery, factory-bot, custom factories]
- **Fixtures location**: [Path to test fixtures/seed data]

## Coverage

- **Tool**: Istanbul (c8) / nyc / built-in (Vitest)
- **Threshold**: [Configured minimum — e.g., 80% lines, 70% branches]
- **Config**: [Path to coverage configuration]
- **Report format**: lcov / html / text

## Test Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Unit tests | npm run test | Run all unit tests |
| Watch mode | npm run test:watch | Run tests on file change |
| Coverage | npm run test:coverage | Run with coverage report |
| E2E | npm run test:e2e | Run end-to-end tests |

## Test Patterns & Conventions

Describe notable patterns observed in existing tests:

- **Describe/it structure**: how tests are organized (by feature, by method, by scenario)
- **Setup/teardown**: beforeAll, beforeEach patterns (database seeding, server startup)
- **Assertion style**: expect().toBe() / assert / should
- **Async testing**: how async operations are tested (await, done callback, fake timers)

## Test Data

- **Seed scripts**: [Path to database seed or fixture scripts]
- **Factories**: [Path to test data factories]
- **Environment**: [Test-specific env file — .env.test, .env.testing]
```

## Field Guidance

- **Run Command**: Include the exact command a developer would run. Check `package.json` scripts section.
- **Naming Pattern**: Document exactly how test files are named in this project — this helps agents create new tests that follow the pattern.
- **Mocking Approach**: This is critical for agents generating test code. They need to know whether to use `jest.mock()`, msw handlers, or repository pattern mocks.
- **Test Patterns**: Read 2-3 existing test files and describe the common patterns you observe. This is more valuable than prescriptive rules.

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| `package.json` scripts | Available test commands |
| `vitest.config.*`, `jest.config.*` | Test framework configuration |
| `playwright.config.*`, `cypress.config.*` | E2E test configuration |
| `.nycrc`, `c8` config | Coverage settings |
| Existing `*.spec.*` / `*.test.*` files | Test patterns in use |
| `tests/`, `__tests__/`, `spec/` directories | Test organization |
| `.env.test`, `.env.testing` | Test environment config |
| `src/mocks/`, `tests/fixtures/` | Mocking and fixture patterns |
