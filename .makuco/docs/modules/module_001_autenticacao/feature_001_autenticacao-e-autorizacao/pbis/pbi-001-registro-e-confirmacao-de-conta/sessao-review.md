---
stepsCompleted: [1, 2, 3, 4, 5]
modo: 'pbi'
rodada: 1
item_id: 'pbi-001'
slug: 'registro-e-confirmacao-de-conta'
pasta_pbi: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-001-registro-e-confirmacao-de-conta/'
feature_folder: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/'
escopo_diff: 'diff completo da PBI (repo criado nesta PBI — commit raiz 47dfcab até a98f1af), restrito a services/backend e services/frontend'
arquivos_alterados:
  - 'services/backend/src/main.ts'
  - 'services/backend/src/auth/auth.controller.ts'
  - 'services/backend/src/auth/auth.controller.spec.ts'
  - 'services/backend/src/auth/auth.module.ts'
  - 'services/backend/src/auth/dto/register.dto.ts'
  - 'services/backend/src/auth/dto/register.dto.spec.ts'
  - 'services/backend/src/auth/dto/match.validator.ts'
  - 'services/backend/src/auth/exceptions/email-already-exists.exception.ts'
  - 'services/backend/src/auth/use-cases/register.use-case.ts'
  - 'services/backend/src/auth/use-cases/register.use-case.spec.ts'
  - 'services/backend/src/supabase/supabase.provider.ts'
  - 'services/backend/src/supabase/supabase.provider.spec.ts'
  - 'services/backend/src/supabase/supabase.module.ts'
  - 'services/backend/supabase/migrations/20260907120000_create_profiles.sql'
  - 'services/backend/test/auth-register.e2e-spec.ts'
  - 'services/backend/test/profiles-trigger.e2e-spec.ts'
  - 'services/frontend/src/components/auth/register-form.tsx'
  - 'services/frontend/src/components/auth/register-form.test.tsx'
  - 'services/frontend/src/components/auth/register-form.register-api.test.tsx'
  - 'services/frontend/src/lib/api/auth.ts'
  - 'services/frontend/src/lib/api/auth.test.ts'
  - 'services/frontend/src/app/registro/confirmacao-pendente/page.tsx'
  - 'services/frontend/src/app/registro/confirmacao-pendente/page.test.tsx'
arquivos_fora_de_escopo:
  - 'Scaffold gerado por create-next-app/nest new (app.controller/service+spec, page.tsx/layout.tsx home, public/*, favicon, tsconfig*, eslint.config.mjs, .prettierrc, nest-cli.json, next.config.ts, postcss.config.mjs, components.json, jest.config.ts, jest.setup.ts, README.md, AGENTS.md/CLAUDE.md, .gitignore, .env.example)'
  - 'package.json/package-lock.json (manifestos de dependência, não lógica)'
  - 'Primitivas geradas pelo shadcn CLI: components/ui/{alert,button,card,field,input,label,separator}.tsx, lib/utils.ts'
tasks_revisadas: ['task-01', 'task-02', 'task-03', 'task-04', 'task-05', 'task-06', 'task-07', 'task-08', 'task-09', 'task-10']
passes_executados: [1, 2, 3, 4, 5, 6, 7]
passes_skipped: []
achados: { critical: 1, major: 1, minor: 10, suggestion: 6 }
veredito: 'changes-requested'
artefato: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-001-registro-e-confirmacao-de-conta/review.md'
proxima_fase: ''
---
