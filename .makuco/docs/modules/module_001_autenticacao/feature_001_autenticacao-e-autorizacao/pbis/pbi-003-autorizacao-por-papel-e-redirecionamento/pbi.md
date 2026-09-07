---
stage: pbi
feature: autenticacao-e-autorizacao
pbi: autorizacao-por-papel-e-redirecionamento
created_at: 2026-09-07
status: done
---

# PBI: Autorização por papel e redirecionamento pós-login

**ID:** pbi-003
**Feature pai:** feature_001 — Autenticação e Autorização

---

## O que entrega

Após o login, o sistema identifica o papel do usuário (admin/adotante) via tabela `profiles` e redireciona/protege telas conforme o papel — administradores acessam a área administrativa, adotantes acessam a área do cliente.

## Critérios de Aceite

- CA-01: Após login bem-sucedido, o usuário é redirecionado à tela correspondente ao seu papel — admin para área administrativa, adotante para área do cliente (RN-04).
- CA-02: Tentativa de acessar rotas administrativas sem papel `admin` é bloqueada.
- CA-03: O papel do usuário é lido da tabela `profiles` pelo backend a cada requisição autenticada (guard).

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ✅ | Testável com usuários seedados (um admin, um adotante), sem depender da implementação real dos PBIs 1 e 2. |
| Negotiable  | ✅ | Escopo negociável (ex.: granularidade de proteção por rota). |
| Valuable    | ✅ | Sem isso, qualquer usuário autenticado poderia acessar áreas administrativas indevidamente — entrega a proteção real do sistema. |
| Estimable   | ✅ | Estimável. |
| Small       | ✅ | Cabe em 1 sprint. |
| Testable    | ✅ | Critérios verificáveis. |

## Notas

Fecha a feature de Autenticação e Autorização — depende conceitualmente de PBI 1 (papel atribuído no registro) e PBI 2 (sessão autenticada), mas testável de forma isolada com dados seedados.

---

Próximo passo rode `makuco-analisar` (passo 05) para propor o próximo PBI, ou — quando todos os PBIs da feature já existirem — rode `makuco-desenvolver` passando o ID deste PBI.
