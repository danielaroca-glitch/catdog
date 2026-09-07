---
stage: pbi
feature: autenticacao-e-autorizacao
pbi: login-e-sessao-com-refresh-token
created_at: 2026-09-07
status: done
---

# PBI: Login e sessão com refresh token

**ID:** pbi-002
**Feature pai:** feature_001 — Autenticação e Autorização
**Data:** 2026-09-07

---

## O que entrega

Usuário com conta confirmada faz login com email/senha e recebe uma sessão via JWT com refresh token rotativo; login é bloqueado se o e-mail não estiver confirmado.

## Critérios de Aceite

- CA-01: Usuário informa email e senha corretos de uma conta confirmada e recebe um token de acesso e um refresh token.
- CA-02: Login com e-mail não confirmado é bloqueado, com opção de reenviar a confirmação (RN-02).
- CA-03: Um refresh token reutilizado após já ter sido rotacionado invalida toda a sessão (RN-03).
- CA-04: Credenciais inválidas (email ou senha incorretos) retornam erro genérico, sem indicar qual campo está errado.

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ✅ | Pode ser testado com uma conta já confirmada previamente (seed direto no Supabase), sem depender da implementação em si do PBI 1. |
| Negotiable  | ✅ | Escopo negociável (ex.: forma de indicar e-mail não confirmado). |
| Valuable    | ✅ | Usuário consegue autenticar e manter sessão — valor central da feature. |
| Estimable   | ✅ | Estimável — fluxo padrão do Supabase Auth. |
| Small       | ✅ | Cabe em 1 sprint. |
| Testable    | ✅ | Critérios verificáveis. |

## Notas

Depende conceitualmente de existir uma conta confirmada (PBI 1), mas pode ser desenvolvido/testado com uma conta seedada manualmente no Supabase.

---

Próximo passo rode `makuco-analisar` (passo 05) para propor o próximo PBI, ou — quando todos os PBIs da feature já existirem — rode `makuco-desenvolver` passando o ID deste PBI.
