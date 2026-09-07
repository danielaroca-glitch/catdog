---
stage: structure
feature: autenticacao-e-autorizacao
created_at: 2026-09-07
status: done
---

# Estrutura — Autenticação e Autorização

## Objetivo da feature

Autenticação via Supabase Auth (identidade, sessão e refresh token nativos) combinada com uma tabela própria `profiles` que guarda o papel do usuário (admin/adotante). O backend NestJS valida o JWT do Supabase e consulta o papel para autorizar e redirecionar o usuário à tela correta.

## PBIs

### registro-e-confirmacao-de-conta — Registro e confirmação de conta

**Descrição:** Usuário se registra com nome, email, senha e confirmação de senha, e recebe um e-mail para confirmar a conta antes de poder fazer login.
**Depende de:** nenhum

### login-e-sessao-com-refresh-token — Login e sessão com refresh token

**Descrição:** Usuário com conta confirmada faz login com email/senha e recebe uma sessão via JWT com refresh token rotativo; login é bloqueado se o e-mail não estiver confirmado.
**Depende de:** registro-e-confirmacao-de-conta (conceitualmente — testável isolado com conta seedada)

### autorizacao-por-papel-e-redirecionamento — Autorização por papel e redirecionamento pós-login

**Descrição:** Após o login, o sistema identifica o papel do usuário (admin/adotante) via tabela `profiles` e redireciona/protege telas conforme o papel.
**Depende de:** registro-e-confirmacao-de-conta, login-e-sessao-com-refresh-token (conceitualmente — testável isolado com dados seedados)

## Justificativa da decomposição

A divisão segue as três etapas naturais e sequenciais do fluxo de autenticação — criar conta, autenticar, autorizar — cada uma entregando um incremento observável e testável isoladamente (com dados seedados quando a etapa anterior ainda não está implementada). Não foi cogitada uma divisão diferente: o fluxo é linear e de escopo pequeno (a feature completa cabe em poucos sprints), e cortar em unidades menores que essas violaria o critério Small/Valuable do INVEST sem ganho real de independência.

---

Próximo passo rode `makuco-desenvolver` no primeiro PBI.
