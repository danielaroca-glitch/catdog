---
status: ''                # developing | paused | done  — STATE CONTRACT, read by the makuco engine
stepsCompleted: []        # [1] [1,2] [1,2,3] [1,2,3,4] 5  — progress marker
item_id: ''               # local PBI id (pbi-NNN)
ado_id: ''                # ADO id when the external work-item tracker is configured (field only, never in the folder name)
titulo: ''
slug: ''
tipo: ''                  # resolved via the project's own type-map config; always converges to the single PBI/feature flow
pasta_pbi: ''             # .makuco/docs/modules/module_NNN/feature_NNN/pbis/pbi-NNN-slug
feature_folder: ''        # parent feature's folder (context from the "analisar" phase)
modo: ''                  # local-only | ado
artifacts_loaded: []      # [feature.md, pbis.md, decisions.md, DESIGN.md, ...] | ['ado-only']
ca_imutaveis: true
spec_construido: false
total_tasks: 0
skills_necessarias: []    # [makuco-backend, makuco-frontend, makuco-ux] — derived from codebase docs, never hardcoded
proxima_fase: ''          # carregar-contexto | spec-e-tasks | implementar | fechamento
riscos: []
---

# Dev Session — {{titulo}}

This file is seeded by `step-01-identificar.md` the first time a given PBI is worked on, and is updated by every subsequent step in the `makuco-desenvolver` flow. `stepsCompleted` is the marker `makuco-desenvolver` reads at the start of a run to detect an in-progress session for this PBI and offer to resume from where it left off, instead of restarting from scratch. `ado_id` is stored only as a field on this tracker — it is never used to build `pasta_pbi` or any other folder name, so the same skill behaves identically whether the project runs local-only or with an external work-item tracker configured.

`status` is the **state contract**: it is the one field the makuco engine reads to decide whether this PBI still has work, and it is the only field here with an external consumer. It is written by exactly two steps — `step-01-identificar` seeds `developing`, `step-05-fechamento` closes with `done` or `paused`. Every other step updates its own fields and leaves `status` alone. The value set is closed (`developing | paused | done`): anything else makes the engine's read fail outright rather than degrade, and an absent value is tolerated as "in progress" with a warning. See the state-contract section of `SKILL.md`.
