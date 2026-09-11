# Autenticação e Autorização

`services/backend/src/auth/` + `services/frontend/src/components/auth/`, `app/login/`, `app/registro/`

Resolve identidade e controle de acesso para toda a plataforma: quem pode entrar, com qual papel, e o que cada papel pode fazer. É a base sobre a qual todo o resto do produto (cadastro de animais, e os módulos futuros de vitrine pública e gestão de solicitações) se apoia.

## Capacidades

### Registro e confirmação de conta

- Registra uma nova conta (nome, e-mail, senha) e envia e-mail de confirmação (fluxo nativo do Supabase Auth).
- Bloqueia login até a conta ser confirmada.

### Login e sessão

- Autentica por e-mail/senha e devolve uma sessão com token de acesso + refresh token rotativo.
- Renova a sessão automaticamente em background antes de expirar (agendador no frontend).
- Detecta e invalida reuso de refresh token já rotacionado (proteção contra roubo de token).
- Mantém a sessão somente em memória no navegador — nunca em `localStorage`/`sessionStorage` (decisão de produto deliberada).

### Autorização por papel

- Atribui um papel (`admin`/`adotante`) a cada usuário no cadastro, consultado a cada requisição sensível.
- Redireciona o usuário para a área correspondente ao seu papel após o login.
- Bloqueia rotas administrativas para quem não é admin, tanto no frontend (guard de rota) quanto no backend (guard de autorização — a fronteira de segurança real).
- Endpoint para o usuário logado consultar seu próprio perfil (id, e-mail, papel).

## Fronteiras

**Expõe:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` — consumidos por `services/frontend`. Guards (`JwtAuthGuard`, `RolesGuard`) reusados por todo endpoint admin-only de outros módulos.

**Consome:** Supabase Auth (GoTrue) para identidade/sessão; tabela `profiles` (Postgres) para o papel do usuário.

## Evidência

- `services/backend/src/auth/auth.controller.ts`, `use-cases/*.use-case.ts`, `guards/*.guard.ts` — lidos por inteiro
- `services/frontend/src/components/auth/login-form.tsx`, `require-role.tsx`, `lib/auth/session-context.tsx` — lidos por inteiro
- Sem documento de referência do time a reconciliar (`research.referencias: []`)
