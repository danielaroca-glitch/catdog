---
name: makuco-desenvolver
description: 'Autonomous skill that takes a work-item (ADO id or local PBI produced by makuco-analisar) all the way to green, atomically-committed code. Resolves the item and its type via project config (never hardcoded type names), loads context already decided upstream (feature/PBI artifacts, .makuco/STATE.md, .makuco/docs/codebase/*) without reopening discovery, generates a dev-scoped spec.md + task.md from its own bundled spec/task methodology, implements each task RED→GREEN→VERIFY→COMMIT with a mandatory tier gate plus a scoped quality gate (lint/complexity/patterns via makuco-quality-gate) before every commit and a full quality gate (build, coverage, SonarQube, checklist) at closeout, detects backend/frontend/UI gaps and routes to the matching specialist skill (makuco-backend/makuco-frontend/makuco-ux), and persists memory + syncs status when a tracker is configured. Runs local-only without any integration, or wired to Azure DevOps when configured. Use when the user says: desenvolver PBI, pegar work-item, implementar item, dev de PBI, tenho um ADO id ou PBI local pronto para desenvolver, continuar desenvolvimento, retomar sessão de dev.'
---

# Makuco Desenvolver

`makuco-desenvolver` is an autonomous, step-file skill invoked directly by the user. It owns its own flow (steps 01→05), its own dev-spec/task methodology (fully contained in `references/`), and its own session state (`sessao-dev.md`).

## Execution style

This is where analyzed work becomes code. Every step drives toward a concrete artifact or gate; step-03 (spec+tasks) ends with an explicit approval checkpoint before any implementation starts, and step-04 runs the RED→GREEN→VERIFY→COMMIT loop task by task with two mandatory gates — the tier gate (tests) and the scoped quality gate (lint, complexity, patterns) that runs before the commit. Never skip or weaken either. The expensive gates (coverage, SonarQube, checklist) run once at closeout, in step-05.

## Why the spec/task methodology lives in `references/`

The methodology this skill applies — `specify.md`, `tasks.md`, `implement.md`, `quick-mode.md` — ships **inside this skill**, not as a separate skill it calls. Nothing in the flow depends on another spec-driven skill being installed, so the flow behaves identically in every project. Read those files directly; never route the dev spec or task breakdown through an external methodology skill.

## Flow overview

```
step-01-identificar         → resolve config · read item (tracker) or locate local PBI · validate type vs type-map · resolve PBI folder · offer resume · seed sessao-dev.md
        ↓
step-02-carregar-contexto   → load makuco-analisar artifacts (feature/decisions/pbis/DESIGN/EXPERIENCE) + STATE.md + codebase docs · CA immutable · never reopens Specify
        ↓
step-03-spec-e-tasks        → generate spec.md + task.md (ported methodology) · detect gap per task · assign specialist skill · order backend before frontend · UI gap without DESIGN.md/EXPERIENCE.md → invoke makuco-ux first · STOP for approval
        ↓
step-04-implementar         → per task: Step 0 invokes the specialist skill · RED→GREEN→VERIFY→COMMIT · gate tiers + scoped quality gate before each commit · sub-agent delegation · traceability
        ↓
step-05-fechamento          → final quality gate (build/type-check per repo + coverage/Sonar/checklist) · record decisions/lessons in STATE.md · sync status local→tracker · HANDOFF · mark PBI done
```

Each step file is self-contained — load only the one the flow currently needs (progressive disclosure). Start every session by reading [steps/step-01-identificar.md](steps/step-01-identificar.md).

## Artifact layout

```
.makuco/docs/modules/module_NNN_name/feature_NNN_name/
  └─ pbis/
      └─ pbi-NNN-slug/          (local sequential id + slug — no tracker id in the folder name)
          ├─ sessao-dev.md      (this skill's own session tracker — written directly, seeded from assets/sessao-dev-template.md)
          ├─ spec.md            (dev-scoped spec for this PBI — written directly, via references/specify.md)
          └─ task.md            (atomic task breakdown — written directly, via references/tasks.md)
```

PBI identity is **local-first**: `pbi-NNN` + slug, produced upstream by `makuco-analisar`. A tracker id (e.g. Azure DevOps), when one exists, is recorded as a field inside `sessao-dev.md` — never in the folder name. Local-only mode is fully functional without any integration configured.

## The state contract — `status` in `sessao-dev.md`

`sessao-dev.md` is this skill's private working state with **one** exception: the `status` field. That field is a contract with the makuco engine, which reads it to decide whether this PBI still has work in flight and to count finished work as progress. Everything else in the frontmatter is this skill's own business.

| Value | Meaning | Written by |
| --- | --- | --- |
| `developing` | work in flight | `step-01-identificar` (seed) |
| `paused` | stopped mid-PBI with saved state to come back to — still derives as work, still not counted as done | `step-05-fechamento`, pausing branch |
| `done` | PBI finished — the only value that counts it as complete | `step-05-fechamento`, complete branch |

Three rules, all of them load-bearing:

1. **The value set is closed.** Anything outside the three above makes the engine's read fail outright — it does not degrade to a default. Never invent a value, never translate it to Portuguese, never reuse a tracker state name here.
2. **Only those two steps write it.** Every other step updates its own fields and leaves `status` exactly as it found it. Finishing an implementation pass is not finishing the PBI.
3. **An absent `status` is tolerated, not correct.** The engine treats it as `developing` and emits a warning — which means a finished PBI is reported as in-flight forever and never counts toward progress. Trackers written before this contract existed are repaired on resume by `step-01-identificar`, from what their own `stepsCompleted` records.

This field is **local and always written**, in both `local-only` and `ado` mode. It is not the work item's remote state: the tracker sync in step-05 pushes the outcome outward through the project's own state map, and reads nothing back. Same idea, two independent records, and only this one drives the makuco workflow.

## What this skill owns vs. delegates

- **Owns and writes directly**: `sessao-dev.md`, `spec.md`, `task.md` inside the PBI's own folder. These are the skill's own working state, not canonical product docs — they do **not** go through `makuco-copy-writer` and never touch `status.yml` (exclusive property of the copy-writer).
- **Delegates to specialist skills (by gap detection, see [references/gap-routing.md](references/gap-routing.md))**: `makuco-backend`, `makuco-frontend`, `makuco-ux` — invoked before reading/writing code for a task in that domain. Not installed yet in a given environment → warn and continue with the generic discipline in [references/implement.md](references/implement.md); never blocks.
- **Delegates code quality**: `makuco-quality-gate` owns the gate definitions and thresholds; this skill only routes to them — scope `per-task` before each commit in step-04, scope `full` at closeout in step-05. Unlike the spec/task methodology above, the gate is a real skill installed alongside this one, so it is invoked at runtime rather than duplicated here. Not installed, or its MCP/Docker/Sonar credentials unavailable → warn once, degrade to the inline fallback, report the affected gate as SKIP with its reason; never blocks. See [references/quality-gate.md](references/quality-gate.md).
- **Never invokes an agent definition**: all delegation here is skill→skill (`makuco-backend`, `makuco-frontend`, `makuco-ux`, `makuco-quality-gate`, the Azure DevOps integration skill) or to a **generic** sub-agent worker running this same loop (step-04 §5). No `makuco-*` agent is invoked from this flow, in any step, including the quality gate.
- **Delegates work-item reads/writes**: the Azure DevOps integration skill, when `.makuco/integrations/azure-devops.yml` exists — reads the work-item and its type-map in step-01, and pushes local→tracker status updates in step-05. Absent that file, everything runs **local-only**.
- **Delegates memory**: decisions/blockers/lessons go into `.makuco/STATE.md` via the memory skill when installed; fallback is writing `STATE.md` directly under its own sections until that skill exists.

## Configuration this skill reads

- `.makuco/integrations/azure-devops.yml` — type-map (resolves and validates the item's type), states, custom-field map, org/project. Tools are discovered at runtime by name from this config, never hardcoded. Absent → local-only, no error.
- `.makuco/docs/codebase/*` — stack/architecture/conventions produced by `makuco-project-research`; sole source for gap detection (task → `makuco-backend`/`makuco-frontend`/`makuco-ux`) and for the dev spec's reuse analysis. No override config — see [references/gap-routing.md](references/gap-routing.md). In a multi-repo workspace this path resolves **per repo with fallback** per `makuco-workspace-detection`'s Codebase-context resolution (prefer `repos/<name>/.makuco/docs/codebase/*`, else the root).
- Upstream artifacts from `makuco-analisar` — `feature.md`, `decisions.md`, `discovery.md` (if present), `pbis.md`, and any per-PBI `DESIGN.md`/`EXPERIENCE.md` — read, never duplicated or rewritten.
- `sonar-project.properties` in a repo root — its presence makes the SonarQube gate mandatory at closeout, and `sonar.projectKey` supplies the key used to fetch the issue report. Absent → that gate doesn't apply, no error. Read by `makuco-quality-gate`, not parsed here.

## Language

Skill instructions (this file + steps + references + assets) are in **English**. All facilitation with the user and every generated artifact are in **Portuguese (PT-BR)**, per Makuco convention.
