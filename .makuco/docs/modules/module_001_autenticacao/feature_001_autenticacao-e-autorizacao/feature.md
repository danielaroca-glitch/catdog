---
stage: feature
feature: autenticacao-e-autorizacao
created_at: 2026-09-07
status: done
---

# Feature: Autenticação e Autorização

**ID:** feature_001 (local)
**Data:** 2026-09-07
**Responsável:** Mateus (dev)
**Status:** Em documentação

---

## Problema / Oportunidade

Hoje não há controle de acesso nem identidade na plataforma: não existe forma de distinguir administradores de adotantes, nem de proteger ações administrativas (cadastro de animais, gestão de solicitações) de acesso indevido.

## Solução Proposta

Autenticação via Supabase Auth (identidade, sessão e refresh token nativos) combinada com uma tabela própria `profiles` que guarda o papel do usuário (admin/adotante), criada automaticamente no registro. O backend NestJS valida o JWT do Supabase e consulta o papel nessa tabela para autorizar e redirecionar o usuário à tela correta.

## Regras de Negócio

1. RN-01: No autorregistro, o papel do usuário é sempre `adotante` — o papel `admin` não é criado por autorregistro (seed manual).
2. RN-02: Login é bloqueado se o e-mail não estiver confirmado, com opção de reenviar a confirmação.
3. RN-03: Um refresh token reutilizado após já ter sido rotacionado invalida toda a sessão (proteção contra roubo de token).
4. RN-04: Após o login, o usuário é redirecionado à tela correspondente ao seu papel (admin/adotante).
5. RN-05: Senha e confirmação de senha devem coincidir no formulário de registro.

## Escopo

### IN — O que esta feature entrega
- Registro (nome, email, senha, confirmação de senha)
- Confirmação de conta via e-mail (fluxo nativo do Supabase Auth)
- Login e sessão via JWT com refresh token rotativo
- Tabela `profiles` com o papel do usuário
- Redirecionamento pós-login conforme o papel

### OUT — O que NÃO está incluído nesta feature
- Login social
- Recuperação de senha ("esqueci minha senha") — PBI futuro
- Criação de conta admin pela própria plataforma (seed manual/convite futuro)
- Múltiplas organizações
- E-mails customizados via Resend (usa o fluxo nativo do Supabase por ora)

## Critérios de Sucesso

| Métrica | Baseline atual | Meta | Prazo |
|---|---|---|---|
| Ações administrativas protegidas por autenticação | 0% | 100% | Entrega da feature |
| Logins de usuários com e-mail confirmado bem-sucedidos | — | 100% | Entrega da feature |

## Premissas e Decisões de Produto

| # | Decisão / Premissa | Justificativa |
|---|---|---|
| 1 | Supabase já decidido como provedor de banco/auth/storage | Decisão de stack tomada antes desta análise, no tech_stack_context |

## Decisões Chave

> Resumo das principais escolhas de abordagem desta feature. Detalhamento completo em `decisions.md`.

| # | Decisão | Alternativas descartadas | Motivo da escolha |
|---|---|---|---|
| 1 | Supabase Auth + tabela `profiles` para o papel | A) papel só em app_metadata do Supabase; C) autenticação 100% custom no NestJS | Aproveita identidade/sessão prontas da stack já decidida, mantendo flexibilidade para evoluir papéis/permissões no futuro |

## Alternativas Consideradas e Rejeitadas

| Alternativa | Por que foi considerada | Por que foi descartada |
|---|---|---|
| A — Papel em app_metadata do Supabase | Mais simples, uma tabela a menos | Menos flexível para evoluir papéis/permissões no futuro |
| C — Autenticação 100% custom no NestJS (bcrypt + JWT + refresh próprios) | Controle total sobre o fluxo | Reimplementa o que a stack já decidida (Supabase) resolve de graça; custo e risco altos sem ganho real |

## Dependências

- Projeto Supabase já provisionado (URL, anon key, service role secret, JWT secret)

## Referências

- Decisões detalhadas: `decisions.md`

---

Próximo passo: rode `makuco-analisar` (passo 05) para decompor a feature em PBIs.
