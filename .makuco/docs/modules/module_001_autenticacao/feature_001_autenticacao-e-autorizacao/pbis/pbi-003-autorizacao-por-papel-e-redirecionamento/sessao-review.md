---
stepsCompleted: [1, 2, 3, 4]
modo: 'pbi'
rodada: 1
item_id: 'pbi-003'
slug: 'autorizacao-por-papel-e-redirecionamento'
pasta_pbi: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-003-autorizacao-por-papel-e-redirecionamento'
feature_folder: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao'
escopo_diff: 'git diff 8e9826a..HEAD (HEAD=57541cd)'
arquivos_alterados:
  - services/backend/src/admin/admin.controller.spec.ts
  - services/backend/src/admin/admin.controller.ts
  - services/backend/src/admin/admin.module.ts
  - services/backend/src/app.module.ts
  - services/backend/src/auth/auth.controller.spec.ts
  - services/backend/src/auth/auth.controller.ts
  - services/backend/src/auth/auth.module.ts
  - services/backend/src/auth/decorators/roles.decorator.ts
  - services/backend/src/auth/guards/jwt-auth.guard.spec.ts
  - services/backend/src/auth/guards/jwt-auth.guard.ts
  - services/backend/src/auth/guards/roles.guard.spec.ts
  - services/backend/src/auth/guards/roles.guard.ts
  - services/backend/src/auth/profile-role.lookup.spec.ts
  - services/backend/src/auth/profile-role.lookup.ts
  - services/backend/src/auth/use-cases/login.use-case.spec.ts
  - services/backend/src/auth/use-cases/login.use-case.ts
  - services/backend/src/auth/use-cases/register.use-case.spec.ts
  - services/backend/src/auth/use-cases/register.use-case.ts
  - services/backend/test/admin-ping.e2e-spec.ts
  - services/backend/test/auth-me.e2e-spec.ts
  - services/frontend/src/app/admin/page.tsx
  - services/frontend/src/app/cliente/page.tsx
  - services/frontend/src/components/auth/access-denied.test.tsx
  - services/frontend/src/components/auth/access-denied.tsx
  - services/frontend/src/components/auth/login-form.login-api.test.tsx
  - services/frontend/src/components/auth/login-form.tsx
  - services/frontend/src/components/auth/require-role.test.tsx
  - services/frontend/src/components/auth/require-role.tsx
  - services/frontend/src/components/auth/session-refresher.test.tsx
  - services/frontend/src/lib/api/auth.ts
  - services/frontend/src/lib/auth/refresh-scheduler.test.ts
  - services/frontend/src/lib/auth/refresh-scheduler.ts
  - services/frontend/src/lib/auth/session-context.test.tsx
  - services/frontend/src/lib/auth/session-context.tsx
arquivos_fora_de_escopo: []
tasks_revisadas: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9']
passes_executados: [1, 2, 3, 4, 5, 6, 7]
passes_skipped: []
achados: { critical: 0, major: 5, minor: 11, suggestion: 2 }
veredito: 'changes-requested'
artefato: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-003-autorizacao-por-papel-e-redirecionamento/review.md'
proxima_fase: 'fechamento'
---

## Gaps de contexto

- `.makuco/docs/codebase/` só tem `testing.md` — `OVERVIEW.md`/`conventions.md`/`architecture.md`/`structure.md` ausentes. Pass 7 deriva padrões direto do código.
