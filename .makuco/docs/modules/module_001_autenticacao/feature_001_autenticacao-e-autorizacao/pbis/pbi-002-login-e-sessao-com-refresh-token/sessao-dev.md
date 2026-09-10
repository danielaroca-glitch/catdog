---
status: 'developing'
stepsCompleted: [1, 2, 3, 4]
item_id: 'pbi-002'
ado_id: ''
titulo: 'Login e sessão com refresh token'
slug: 'login-e-sessao-com-refresh-token'
tipo: 'PBI'
pasta_pbi: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-002-login-e-sessao-com-refresh-token/'
feature_folder: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/'
modo: 'local-only'
artifacts_loaded: ['feature.md', 'decisions.md', 'pbis.md', 'pbi.md', 'DESIGN.md', 'EXPERIENCE.md', 'STATE.md', 'testing.md']
ca_imutaveis: true
spec_construido: true
total_tasks: 9
skills_necessarias: ['makuco-backend', 'makuco-frontend']
proxima_fase: 'fechamento'
riscos: []
---

# Dev Session — Login e sessão com refresh token

## Progresso

- Fase 1-3 (backend): T1, T2, T3, T5 concluídas. T4 concluída, com o achado de E2E-05 corrigido nesta sessão (`38b2bd8`) — não era config do Supabase desligada, era o teste presumir tolerância de reuso só por tempo; GoTrue (v2) tolera incondicionalmente reuso de 1 geração atrás.
- Fase 4 (frontend, paralela): T6 (`d6479ca`) e T7 (`e8bf7c7`) concluídas — cada uma num worktree isolado, mergeadas em `master` sem conflito (arquivos disjuntos).
- Fase 5 (frontend, paralela): T8 (`095d0e0`) e T9 (`d16f006`) concluídas — mesmo padrão de worktree isolado, merge sem conflito.
- **Todas as 9 tasks de `task.md` (T1-T9) estão com checkbox ✅**, mas ficou um gap real: T9 redireciona para `/login?message=...` em falha de refresh, porém nenhuma task do PBI cobre LER esse parâmetro e EXIBIR a mensagem na tela de login — `LOGIN-07` não é satisfeito ponta a ponta apesar de todas as tasks estarem marcadas. Ver ressalva em T9 no `task.md` e `LOGIN-07` na tabela de traceability do `spec.md`.
- **Decisão do usuário (2026-09-08)**: seguir para fechamento sem fechar o gap agora — registrado em `.makuco/STATE.md` (Deferred Ideas) como follow-up de uma PBI/sessão futura.
