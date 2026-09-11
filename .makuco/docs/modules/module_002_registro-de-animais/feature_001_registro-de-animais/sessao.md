---
status: 'analyzed'
stepsCompleted: [1, 2, 4, 5, 6]
feature_id: 'feature_001'
feature_title: 'Registro de animais'
feature_slug: 'registro-de-animais'
feature_folder: '.makuco/docs/modules/module_002_registro-de-animais/feature_001_registro-de-animais'
mode: 'solucao'
rn_placement: 'feature'
business_rules: []
initial_answers:
  problema: 'Hoje não existe lugar centralizado para os administradores cadastrarem os animais disponíveis para adoção — dados dispersos em planilhas/mensagens, sem padronização.'
  principal_afetado: 'Administradores da ONG, responsáveis por manter o catálogo de animais atualizado.'
  criterio_sucesso: '100% dos animais disponíveis para adoção cadastrados na plataforma, com dados completos e espécie associada.'
  restricoes: 'Depende do módulo de Autenticação/Autorização já entregue (rotas admin-only via RolesGuard). Não depende do módulo futuro de Registro de espécies — usa uma tabela mínima de espécies com seed inicial até esse módulo assumir a gestão completa.'
ideation_technique: 'exploração livre resumida (processo comprimido a pedido do usuário)'
validation_approved: true
brainstorming_notes: 'Abordagem única (CRUD padrão) por escopo já fechado no roadmap de produto, sem alternativas de mercado a comparar. Duas decisões de negócio resolvidas com o usuário: (1) inativação de animal = soft-delete (campo ativo/flag), nunca exclusão física — preserva histórico, alinhado à descrição do roadmap; (2) espécie = tabela própria mínima (id+nome) com seed inicial, não texto livre — evita re-trabalho quando o módulo futuro "Registro de espécies" assumir a gestão completa do domínio. Dimensões afetadas: cadastro de animais (admin), futura vitrine pública (module 002 do roadmap) e futura gestão de solicitações (module 003) — ambos consumidores do que este módulo cria, mas fora de escopo desta feature.'
pbis_created:
  - { n: 1, id_local: 'pbi-001-alta-de-animal', slug: 'alta-de-animal', invest_ok: true }
  - { n: 2, id_local: 'pbi-002-edicao-de-animal', slug: 'edicao-de-animal', invest_ok: true }
  - { n: 3, id_local: 'pbi-003-inativacao-de-animal', slug: 'inativacao-de-animal', invest_ok: true }
ux_proposals: []
---
