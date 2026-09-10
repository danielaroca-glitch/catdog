---
stage: pbi
feature: registro-de-animais
pbi: edicao-de-animal
created_at: 2026-09-10
status: done
---

# PBI: Edição de animal

**ID:** pbi-002
**Feature pai:** feature_001 — Registro de Animais
**Data:** 2026-09-10

---

## O que entrega

O administrador atualiza os dados de um animal já cadastrado — incluindo, quando necessário, trocar a espécie associada — para manter o catálogo coerente com a realidade (correções, complementos, ajustes).

## Critérios de Aceite

- CA-01: Um administrador autenticado consegue atualizar os dados de um animal existente (incluindo nome e demais campos básicos definidos em Alta de animal).
- CA-02: Um administrador consegue trocar a espécie associada a um animal existente para outra espécie válida.
- CA-03: Tentar trocar para uma espécie que não existe na tabela é rejeitado com um erro claro — a edição não é aplicada.
- CA-04: A edição funciona tanto para um animal ativo quanto para um inativo (não fica bloqueada por causa do soft-delete).
- CA-05: Um usuário não autenticado, ou autenticado sem papel admin, recebe um erro de autorização ao tentar editar (reusa `JwtAuthGuard`+`RolesGuard`).

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ✅ | Depende conceitualmente de "Alta de animal" (precisa de um animal existente para editar), mas é testável de forma isolada com um animal seedado diretamente no banco de testes — mesmo padrão já usado no módulo de Autenticação (login testável isolado com conta seedada, sem esperar o registro real). |
| Negotiable  | ✅ | Os campos editáveis podem ser ajustados em `spec.md` sem perder o valor central. |
| Valuable    | ✅ | O administrador consegue manter o catálogo atualizado, evitando informação desatualizada para os clientes. |
| Estimable   | ✅ | CRUD simples, esforço bem conhecido. |
| Small       | ✅ | Cabe em 1-2 sprints. |
| Testable    | ✅ | Critérios acima são verificáveis por teste automatizado. |

## Notas

Este PBI governa as regras de negócio RN-01 (só admin autenticado edita), RN-02 (edição funciona independente do animal estar ativo ou inativo) e RN-03/RN-04 (troca de espécie segue a mesma validação da criação — só espécie existente na tabela). Lista completa de regras de negócio em `feature.md`.

Depende conceitualmente de "Alta de animal" (pbi-001) para existir um animal a editar, mas é desenvolvida e testada de forma isolada com dados seedados; depende também do módulo de Autenticação e Autorização já entregue.

---

Próximo passo rode `makuco-analisar` (passo 05) para propor o próximo PBI, ou — quando todos os PBIs da feature já existirem — rode `makuco-desenvolver` passando o ID deste PBI.
