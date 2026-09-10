---
stage: pbi
feature: registro-de-animais
pbi: alta-de-animal
created_at: 2026-09-10
status: done
---

# PBI: Alta de animal

**ID:** pbi-001
**Feature pai:** feature_001 — Registro de Animais
**Data:** 2026-09-10

---

## O que entrega

O administrador cadastra um novo animal disponível para adoção, informando dados básicos de identificação/apresentação e associando obrigatoriamente uma espécie (de uma lista já seedada no sistema). É a base sobre a qual as demais operações (edição, inativação) atuam.

## Critérios de Aceite

- CA-01: Um administrador autenticado consegue criar um animal informando nome e demais dados básicos + uma espécie válida (existente na tabela de espécies), recebendo confirmação de sucesso.
- CA-02: Tentar criar um animal sem espécie, ou com uma espécie que não existe na tabela, é rejeitado com um erro claro — o animal não é criado.
- CA-03: Um usuário não autenticado, ou autenticado sem papel admin, recebe um erro de autorização ao tentar criar um animal (reusa `JwtAuthGuard`+`RolesGuard` do módulo de Autenticação, nenhum mecanismo novo).
- CA-04: Todo animal recém-criado nasce com status ativo (visível para a futura vitrine pública — módulo ainda não construído).

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ✅ | Não depende de nenhum outro PBI desta feature; depende apenas do módulo de Autenticação e Autorização, já entregue. |
| Negotiable  | ✅ | Os campos exatos do cadastro (além de nome+espécie) podem ser ajustados em `spec.md` sem perder o valor central. |
| Valuable    | ✅ | O administrador passa a poder cadastrar animais no sistema em vez de planilhas/mensagens — resolve o problema central da feature. |
| Estimable   | ✅ | CRUD simples com um guard já existente, esforço bem conhecido. |
| Small       | ✅ | Cabe em 1-2 sprints, mesmo porte das PBIs do módulo de Autenticação. |
| Testable    | ✅ | Critérios de aceite acima são verificáveis por teste automatizado (unit + e2e), mesmo padrão já usado no projeto. |

## Notas

Este PBI governa as seguintes regras de negócio da feature (documentadas em `feature.md`, `rn_placement: feature`): RN-01 (só admin autenticado cria), RN-03 (espécie obrigatória e válida), RN-04 (espécie vem da tabela mínima com seed).

Dependências: nenhuma dentro desta feature; depende do módulo de Autenticação e Autorização (guards `JwtAuthGuard`/`RolesGuard`) já entregue.

---

Próximo passo rode `makuco-analisar` (passo 05) para propor o próximo PBI, ou — quando todos os PBIs da feature já existirem — rode `makuco-desenvolver` passando o ID deste PBI.
