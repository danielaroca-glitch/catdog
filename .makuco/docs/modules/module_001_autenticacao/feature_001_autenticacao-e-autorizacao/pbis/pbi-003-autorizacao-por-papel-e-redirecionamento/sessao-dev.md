---
status: 'done'
stepsCompleted: [1, 2, 3, 4, 5]
item_id: 'pbi-003'
ado_id: ''
titulo: 'Autorização por papel e redirecionamento pós-login'
slug: 'autorizacao-por-papel-e-redirecionamento'
tipo: 'PBI'
pasta_pbi: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-003-autorizacao-por-papel-e-redirecionamento/'
feature_folder: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/'
modo: 'local-only'
artifacts_loaded: ['feature.md', 'decisions.md', 'pbis.md', 'pbi.md', 'DESIGN.md', 'EXPERIENCE.md', 'STATE.md', 'testing.md']
ca_imutaveis: true
spec_construido: true
total_tasks: 9
skills_necessarias: ['makuco-backend', 'makuco-frontend']
proxima_fase: 'concluida'
riscos: []
---

# Dev Session — Autorização por papel e redirecionamento pós-login

## Progresso

- Fase 1-3 (backend): T1 (`ProfileRoleLookup`, `76ce61c`), T2 (`JwtAuthGuard`, `45b73d3` — corrigido depois, ver abaixo), T3 (`RolesGuard`+`@Roles`, `9f1f1fb`), T4 (`LoginUseCase` retorna `role`, `5e6e011`), T5 (`GET /auth/me`, `3c9f482`), T6 (`GET /admin/ping`, `f4e9fd3`) — todas concluídas.
- **Achado cross-cutting corrigido**: `JwtAuthGuard` (T2) presumia HS256 com segredo compartilhado; o projeto Supabase assina com chave assimétrica ES256 (JWKS) — todo token real era rejeitado. Achado de forma independente por T5 e T6 em paralelo; adotado o fix de T5 (`supabase.auth.getClaims()`, método oficial do SDK) por não exigir dependência nova. Merge de reconciliação: `ca31f05`. Ver `.makuco/STATE.md` (Lessons Learned) para o detalhe completo.
- Fase 4 (frontend): T7 (`SessionContext` + `role`, `37eaa54`), T8 (`RequireRole`+`AccessDenied`, `5934b2e`), T9 (redirecionamento + rotas `/admin`/`/cliente`, `bffce32`) — concluídas, rodadas sequencialmente num único worktree (dependências entre si).

## Fechamento (2026-09-10)

- Build-tier: backend (`nest build`) PASS · frontend (`next build`) PASS, ambos limpos.
- Testes: backend 64 unit + 21 e2e reais (1 flake intermitente em reruns anteriores, não reproduziu em 4 tentativas consecutivas — registrado em `.makuco/STATE.md` como risco de flakiness, não bloqueante) · frontend 80 unit.
- Lint: ambos limpos (só warnings pré-existentes não relacionados).
- Gate 5 (SonarQube) adiado por prazo — mesma decisão já tomada no fechamento da `pbi-002`, registrada em `.makuco/STATE.md`.
- PBI marcada **done**. Próximo passo recomendado: `makuco-code-review`.
