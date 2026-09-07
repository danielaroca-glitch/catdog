---
stage: pbi
feature: autenticacao-e-autorizacao
pbi: registro-e-confirmacao-de-conta
created_at: 2026-09-07
status: done
---

# PBI: Registro e confirmação de conta

**ID:** pbi-001
**Feature pai:** feature_001 — Autenticação e Autorização
**Data:** 2026-09-07

---

## O que entrega

Usuário se registra com nome, email, senha e confirmação de senha, e recebe um e-mail para confirmar a conta antes de poder fazer login.

## Critérios de Aceite

- CA-01: Se senha e confirmação de senha não coincidirem, o registro é bloqueado com mensagem de erro (RN-05).
- CA-02: Ao registrar com sucesso, uma linha é criada automaticamente na tabela `profiles` com papel `adotante` (RN-01).
- CA-03: Um e-mail de confirmação com link é enviado ao endereço informado (fluxo nativo do Supabase Auth).
- CA-04: A conta permanece não confirmada até que o link do e-mail seja acessado.

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ✅ | Pode ser desenvolvido e testado isoladamente — não depende de outro PBI desta feature. |
| Negotiable  | ✅ | Escopo negociável (ex.: forma de reenvio de confirmação pode variar sem perder o núcleo). |
| Valuable    | ✅ | Entrega valor observável por si só — conta criada, e-mail recebido, papel atribuído — mesmo que o valor pleno (usar o sistema) só chegue com o PBI de login. |
| Estimable   | ✅ | Fluxo padrão do Supabase Auth mais uma tabela simples. |
| Small       | ✅ | Cabe em 1 sprint. |
| Testable    | ✅ | Critérios de aceite verificáveis. |

## Notas

Depende do trigger/hook de signup do Supabase Auth para criar automaticamente a linha em `profiles` com papel `adotante` (decisão DEC-01 do feature.md).

---

Próximo passo rode `makuco-analisar` (passo 05) para propor o próximo PBI, ou — quando todos os PBIs da feature já existirem — rode `makuco-desenvolver` passando o ID deste PBI.
