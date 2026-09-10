---
stepsCompleted: [1, 2, 3, 4, 5]
modo: 'pbi'
rodada: 1
item_id: 'pbi-002'
slug: 'login-e-sessao-com-refresh-token'
pasta_pbi: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-002-login-e-sessao-com-refresh-token'
feature_folder: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao'
escopo_diff: 'git diff 272134a..HEAD (HEAD=3b20175)'
arquivos_alterados:
  - services/backend/src/auth/auth.controller.spec.ts
  - services/backend/src/auth/auth.controller.ts
  - services/backend/src/auth/auth.module.ts
  - services/backend/src/auth/dto/login.dto.spec.ts
  - services/backend/src/auth/dto/login.dto.ts
  - services/backend/src/auth/dto/refresh.dto.ts
  - services/backend/src/auth/exceptions/email-not-confirmed.exception.ts
  - services/backend/src/auth/use-cases/login.use-case.spec.ts
  - services/backend/src/auth/use-cases/login.use-case.ts
  - services/backend/src/auth/use-cases/refresh.use-case.spec.ts
  - services/backend/src/auth/use-cases/refresh.use-case.ts
  - services/backend/test/auth-login.e2e-spec.ts
  - services/backend/test/auth-refresh.e2e-spec.ts
  - services/frontend/src/app/layout.tsx
  - services/frontend/src/app/login/page.tsx
  - services/frontend/src/components/auth/login-form.login-api.test.tsx
  - services/frontend/src/components/auth/login-form.test.tsx
  - services/frontend/src/components/auth/login-form.tsx
  - services/frontend/src/lib/api/auth.test.ts
  - services/frontend/src/lib/api/auth.ts
  - services/frontend/src/lib/auth/refresh-scheduler.test.ts
  - services/frontend/src/lib/auth/refresh-scheduler.ts
  - services/frontend/src/lib/auth/session-context.test.tsx
  - services/frontend/src/lib/auth/session-context.tsx
arquivos_fora_de_escopo:
  - .gitignore
  - .makuco/STATE.md
  - .makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-002-login-e-sessao-com-refresh-token/sessao-dev.md
  - .makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-002-login-e-sessao-com-refresh-token/spec.md
  - .makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-002-login-e-sessao-com-refresh-token/task.md
tasks_revisadas: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9']
passes_executados: [1, 2, 3, 4, 5, 6]
passes_skipped: [{ pass: 7, motivo: 'subagente travou (timeout de 600s, sem recuperação do watchdog)' }]
achados: { critical: 1, major: 4, minor: 14, suggestion: 2 }
veredito: 'changes-requested'
artefato: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-002-login-e-sessao-com-refresh-token/review.md'
proxima_fase: ''
---

## Gaps de contexto

- `.makuco/docs/codebase/` só tem `testing.md` — `OVERVIEW.md`/`conventions.md`/`architecture.md`/`structure.md` ausentes (projeto nunca rodou `makuco-project-research` completo). Pass 7 deriva padrões direto do código.
