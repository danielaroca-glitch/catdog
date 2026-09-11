---
stepsCompleted: [1, 2, 3, 4, 5]
modo: 'pbi'
rodada: 1
item_id: 'pbi-001,pbi-002,pbi-003'
slug: 'alta-de-animal,edicao-de-animal,inativacao-de-animal'
pasta_pbi: '.makuco/docs/modules/module_002_registro-de-animais/feature_001_registro-de-animais'
feature_folder: '.makuco/docs/modules/module_002_registro-de-animais/feature_001_registro-de-animais'
escopo_diff: 'git diff f24b3fd..00f04b0 -- services/ (rodada única cobrindo pbi-001, pbi-002 e pbi-003 juntas, a pedido do usuário)'
arquivos_alterados:
  - services/backend/src/animals/animals.controller.spec.ts
  - services/backend/src/animals/animals.controller.ts
  - services/backend/src/animals/animals.module.ts
  - services/backend/src/animals/dto/create-animal.dto.spec.ts
  - services/backend/src/animals/dto/create-animal.dto.ts
  - services/backend/src/animals/dto/update-animal.dto.spec.ts
  - services/backend/src/animals/dto/update-animal.dto.ts
  - services/backend/src/animals/use-cases/create-animal.use-case.spec.ts
  - services/backend/src/animals/use-cases/create-animal.use-case.ts
  - services/backend/src/animals/use-cases/list-animals.use-case.spec.ts
  - services/backend/src/animals/use-cases/list-animals.use-case.ts
  - services/backend/src/animals/use-cases/update-animal.use-case.spec.ts
  - services/backend/src/animals/use-cases/update-animal.use-case.ts
  - services/backend/src/app.module.ts
  - services/backend/src/auth/auth.module.ts
  - services/backend/src/species/species.controller.spec.ts
  - services/backend/src/species/species.controller.ts
  - services/backend/src/species/species.module.ts
  - services/backend/src/species/species.service.spec.ts
  - services/backend/src/species/species.service.ts
  - services/backend/supabase/migrations/20260910190000_create_species_and_animals.sql
  - services/backend/test/animals-create.e2e-spec.ts
  - services/backend/test/animals-inactivate.e2e-spec.ts
  - services/backend/test/animals-list.e2e-spec.ts
  - services/backend/test/animals-update.e2e-spec.ts
  - services/backend/test/species-list.e2e-spec.ts
  - services/frontend/src/app/admin/animais/[id]/editar/page.tsx
  - services/frontend/src/app/admin/animais/novo/page.tsx
  - services/frontend/src/app/admin/animais/page.tsx
  - services/frontend/src/components/animals/animal-form.test.tsx
  - services/frontend/src/components/animals/animal-form.tsx
  - services/frontend/src/components/animals/animals-list-view.test.tsx
  - services/frontend/src/components/animals/animals-list-view.tsx
  - services/frontend/src/components/animals/edit-animal-view.test.tsx
  - services/frontend/src/components/animals/edit-animal-view.tsx
  - services/frontend/src/lib/api/animals.test.ts
  - services/frontend/src/lib/api/animals.ts
  - services/frontend/src/lib/api/species.test.ts
  - services/frontend/src/lib/api/species.ts
arquivos_fora_de_escopo: []
tasks_revisadas: ['pbi-001:T1-T6', 'pbi-002:T1-T6', 'pbi-003:T1-T2']
passes_executados: [1, 2, 3, 4, 5, 6, 7]
passes_skipped: []
achados: { critical: 0, major: 0, minor: 11, suggestion: 4 }
veredito: 'approved'
artefato: '.makuco/docs/modules/module_002_registro-de-animais/feature_001_registro-de-animais/review.md'
proxima_fase: ''
---
