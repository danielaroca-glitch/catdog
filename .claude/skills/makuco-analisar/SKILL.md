---
name: makuco-analisar
description: 'Deep analysis skill — takes a vague opportunity or an already-understood problem all the way to a documented Feature (PRD) plus INVEST-validated PBIs, ready for makuco-desenvolver. Two modes: DESCOBERTA (broad exploratory brainstorming + Go/No-Go/Refine recommendation, always followed by a product gate) and SOLUÇÃO (focused brainstorming on a clear problem, skips the gate entirely). Runs local-only without a tracker integration, or creates/links work items when one is configured. Use when the user says: analisar feature, iniciar análise, brainstorming profundo, nova descoberta, viabilizar solução, gerar PRD, criar PBIs com INVEST, processo de análise, discovery mais profundo, ou quando ainda não há um problema claro o suficiente para virar PBI.'
---

# Makuco Analisar

`makuco-analisar` is an autonomous, step-file skill invoked directly by the user. It owns its own flow (steps 01→06), its own templates (PRD + PBI), and its own session state (`sessao.md`). It is the front door for deep analysis, and it ends at a single handoff target: PBIs ready for `makuco-desenvolver`.

## Execution style

This is a conversational facilitation flow, not a code-change task. Every step already gates on an explicit user confirmation (`STOP — wait for...`) before moving on — that IS the approval mechanism. Do not wrap the flow in a Plan Mode review before starting; proceed directly through the steps' own checkpoints.

## When to use this

- **DESCOBERTA** when the user wants to think out loud about a vague opportunity.
- **SOLUÇÃO** when the problem is already understood and the work is figuring out how to solve it before committing to a PRD/PBIs. A crisp, already-scoped feature ask that needs no deep brainstorming belongs here too — SOLUÇÃO skips the product gate entirely.
- **Skip this skill** only when the PBIs already exist and are ready to build — then go straight to `makuco-desenvolver`.
- Either mode produces the same artifact shape (`feature.md` + PBIs under `.makuco/docs/modules/module_NNN_name/feature_NNN_name/`) and the same `status.yml`.
- **One feature, one analysis.** Never produce a second set of artifacts for a feature that already has them. step-01 §3 catches a prior run of this skill via its `sessao.md`, but a folder written by any other flow has no `sessao.md` and will not be detected there — so when the module already holds a `feature_NNN_*` folder for the same feature, stop and ask the user whether to continue that one instead of creating a new one.

## The two modes

| Mode           | When                                                              | Entry behavior                                                                                                              |
| -------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **DESCOBERTA** | The opportunity is still nebulous — unsure if it's worth pursuing | Broad divergent brainstorming → `discovery.md` with a recommendation (Go / No-Go / Refine) → product gate before continuing |
| **SOLUÇÃO**    | The problem is already clear and understood                       | Focused brainstorming on how to solve it → skips the product gate entirely (marks `validation_approved: true`)              |

The mode is **never presumed** — step-01 always asks the user explicitly.

## Flow overview

```
step-01-setup            → resolve config, pick mode, create dirs, write sessao.md, offer resume
 ├─ DESCOBERTA → step-02a-descoberta   → discovery.md (via copy-writer) + recommendation
 │                  └─ step-03-gate    → always runs → aprovado/reprovado/ajustar
 └─ SOLUÇÃO    → step-02b-solucao     → validation_approved=true, never loads step-03-gate
                        ↓
                  step-04-feature      → feature.md + decisions.md (via copy-writer)
                        ↓
                  step-05-pbis         → PBIs one-by-one, INVEST-validated, pbis.md + pbi.md + diagram
                        ↓ (only if a PBI touches UI)
                  step-05b-ux-proposal → invokes makuco-ux (F5), degrades gracefully if absent
                        ↓
                  step-06-fechamento   → handoff to makuco-desenvolver + records decisions in STATE.md
```

Each step file is self-contained — load only the one the flow currently needs (progressive disclosure). Start every session by reading [steps/step-01-setup.md](steps/step-01-setup.md).

## Artifact layout

```
.makuco/docs/modules/module_NNN_name/feature_NNN_name/
  ├─ discovery.md      (DESCOBERTA only)
  ├─ feature.md        (PRD)
  ├─ decisions.md       (decision log — local-only, never synced to a tracker)
  ├─ sessao.md          (this skill's own session tracker — analisar writes it directly)
  ├─ status.yml         (pipeline progress — written ONLY by makuco-copy-writer)
  └─ pbis/
      └─ pbi-NNN-slug/  (local sequential id + slug — no tracker id in the folder name)
          ├─ diagrama.puml
          └─ DESIGN.md, EXPERIENCE.md   (only if step-05b ran)
```

PBI identity is **local-first**: `pbi-NNN` + slug. A tracker id (e.g. Azure DevOps), when one exists, is recorded as a field inside the artifact/tracker — never in the folder name. This keeps local-only mode fully functional without any integration configured.

## The state contract — `status` in `sessao.md`

`sessao.md` is this skill's private working state with **one** exception: the `status` field. That field is a contract with the makuco engine, which reads it to decide whether this feature still has analysis pending, and which will not offer any PBI of this feature to `makuco-desenvolver` until it says the analysis is finished. Everything else in the frontmatter is this skill's own business.

| Value | Meaning | Written by |
| --- | --- | --- |
| `analyzing` | analysis in flight | `step-01-setup` (seed) |
| `analyzed` | analysis finished, Go — releases the PBIs as actionable work | `step-06-fechamento` (last write of the skill) |
| `rejected` | analysis finished, No-Go — terminal, no further work derives | `step-03-gate`, reprovado branch |

Four rules, all of them load-bearing:

1. **The value set is closed.** Anything outside the three above makes the engine's read fail outright — it does not degrade to a default. Never invent a value, never translate it to Portuguese, never leave a comment inline in the YAML value.
2. **Only those three steps write it.** Every other step updates its own fields and leaves `status` exactly as it found it. A step that appends to `stepsCompleted` is not a step that changes state.
3. **An absent `status` is tolerated, not correct.** The engine treats it as `analyzing` and emits a warning — which means a finished analysis stays reported as in-progress forever, and its PBIs never become actionable. Trackers written before this contract existed are repaired on resume by `step-01-setup`, from what their own `stepsCompleted` records.
4. **`analyzed` only releases PBIs that have a `pbi.md`.** The engine derives one `desenvolver` step per PBI folder that carries the doc, and silently skips the folders that don't. So `analyzed` written over a bare `pbis/pbi-NNN-slug/` folder releases nothing: the user is told the analysis finished, `makuco-desenvolver` finds no target, and the two statements look contradictory. `step-06-fechamento` checks every folder before the flip, and writes the flip **before** its own "next steps" summary, precisely so the step it recommends already exists when it's recommended.

`status` is unrelated to `status.yml` (pipeline progress, exclusively written by `makuco-copy-writer`) and to `validation_approved` (the product gate's own outcome). Same word, three different things.

## What this skill delegates (does not own)

- **Doc writing** — every canonical artifact (`discovery.md`, `feature.md`, per-PBI `pbi.md`, `pbis.md`) and `status.yml` are written **only** by `makuco-copy-writer`. This skill never writes them directly; it only writes its own `sessao.md`.
- **Diagrams** — `makuco-plantuml-diagram` generates `diagrama.puml` per PBI.
- **UX proposals** — `makuco-ux` (when available) produces `DESIGN.md` + `EXPERIENCE.md` for PBIs that touch UI.
- **Work item creation** — delegated to the Azure DevOps integration skill when `.makuco/integrations/azure-devops.yml` exists; absent that file, everything runs **local-only**.
- **Decisions/deferred ideas** — recorded into `.makuco/STATE.md` at closeout, following the project's memory conventions.

Delegation here is skill→skill, synchronous, in the main context. The single exception is `makuco-copy-writer`, kept deliberately as the sole writer of canonical docs and `status.yml`. No other `makuco-*` agent definition is invoked from this flow.

## Assets & references

- [assets/brain-methods.csv](assets/brain-methods.csv) — 61 brainstorming techniques across 10 categories, loaded on demand (never preload the whole file).
- [references/brainstorming.md](references/brainstorming.md) — anti-bias protocol + the 4 (DESCOBERTA) / 3 (SOLUÇÃO) technique-selection modes.

`makuco-artifact-feature` and `makuco-artifact-pbi` are the single source of truth for the `feature.md` and `pbi.md` structures (this skill only assembles content, `makuco-copy-writer` renders it).

## Configuration this skill reads

- `MAKUCO.md` — YAML frontmatter, key `analise.aprovador`: approver (generic role/name/none). Mode is always asked, never configured; the gate always runs for DESCOBERTA.
- `.makuco/integrations/azure-devops.yml` — when present, enables tracker work-item creation; absent → local-only (no error, just a notice to the user).
- `MAKUCO.md` / `makuco-product-context` — domain vocabulary (personas, affected dimensions, item types) used to fill template placeholders and the brainstorming anti-bias persona axis. Never hardcode a project's domain vocabulary into this skill.

## Language

Skill instructions (this file + steps + assets + references) are in **English**. All facilitation with the user and every generated artifact are in **Portuguese (PT-BR)**, per Makuco convention.
