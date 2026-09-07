---
status: 'analyzed'
stepsCompleted: [1, 2, 4, 5, '5b', 6]
feature_id: 'feature_001'
feature_title: 'Autenticação e Autorização'
feature_slug: 'autenticacao-e-autorizacao'
feature_folder: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/'
mode: 'solucao'
rn_placement: 'feature'
business_rules: []
initial_answers:
  problema: 'Sem controle de acesso nem identidade — hoje não há como saber quem é admin e quem é adotante, nem proteger ações administrativas (cadastro de animais, aprovação de solicitações) de acesso indevido'
  principal_afetado: 'Administradores da ONG — precisam de acesso exclusivo e seguro às ações administrativas (cadastro de animais, gestão de solicitações)'
  criterio_sucesso: 'Usuário se registra, confirma o e-mail, faz login, e é redirecionado para a tela certa conforme seu papel (admin/adotante), com sessão renovável via refresh token'
  restricoes: 'Envio de e-mail de confirmação via Resend; sem login social (fora de escopo definido no scope_features_context.md); uma única organização, sem multi-tenant'
ideation_technique: 'IA recomenda — Método SCAMPER (structured), Matriz de Soluções (structured), Pensamento Analógico (creative)'
validation_approved: true
brainstorming_notes: |
  Abordagem escolhida: B — Supabase Auth (identidade/sessão/refresh nativos) + tabela própria
  `profiles` para o papel (admin/adotante), criada automaticamente no signup. NestJS valida o
  JWT do Supabase e lê o papel da tabela `profiles`, não de uma claim do token.

  Descartadas: A (papel só em app_metadata do Supabase — menos flexível para evoluir papéis
  depois) e C (autenticação 100% custom no NestJS — reimplementa o que a stack já decidida
  resolve de graça, custo/risco altos sem ganho real).

  Regras de negócio mapeadas:
  - Papel padrão no autorregistro é sempre 'adotante'; 'admin' não se autorregistra (seed manual).
  - Login bloqueado se e-mail não confirmado, com opção de reenviar confirmação.
  - Refresh token reutilizado após rotação invalida toda a sessão (proteção contra roubo).

  Dimensões afetadas: identidade/sessão (Supabase Auth), autorização (tabela profiles + guard
  no NestJS), e-mail transacional (confirmação via Supabase, sem Resend nesta feature — Resend
  fica para features futuras que precisem de e-mails customizados fora do fluxo de auth).

  Restrições: sem login social; organização única, sem multi-tenant; "esqueci minha senha" fica
  fora do MVP desta feature (pode virar PBI futuro).

  Técnicas usadas: Método SCAMPER, Matriz de Soluções, Pensamento Analógico.
pbis_created:
  - n: 1
    id_local: 'pbi-001'
    slug: 'registro-e-confirmacao-de-conta'
    invest_ok: true
  - n: 2
    id_local: 'pbi-002'
    slug: 'login-e-sessao-com-refresh-token'
    invest_ok: true
  - n: 3
    id_local: 'pbi-003'
    slug: 'autorizacao-por-papel-e-redirecionamento'
    invest_ok: true
ux_proposals:
  - pbi_n: 1
    pbi_id: 'pbi-001'
    pasta: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-001-registro-e-confirmacao-de-conta'
  - pbi_n: 2
    pbi_id: 'pbi-002'
    pasta: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-002-login-e-sessao-com-refresh-token'
  - pbi_n: 3
    pbi_id: 'pbi-003'
    pasta: '.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/pbis/pbi-003-autorizacao-por-papel-e-redirecionamento'
---
