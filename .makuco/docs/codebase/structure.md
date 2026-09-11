# Project Structure

## Overview

Repositório único, organizado por serviço (não um monorepo com tooling formal — sem `workspaces` em nenhum `package.json` raiz, cada serviço é instalado/rodado independentemente): `services/backend` (API NestJS) e `services/frontend` (app Next.js). Dentro de cada serviço, o código é organizado por domínio/feature (backend: um módulo NestJS por domínio de negócio; frontend: por rota + camada `components`/`lib`).

## Top-Level Layout

```
catdog-danielaquiaro/
├── services/
│   ├── backend/        — API NestJS (auth, admin, animals, species)
│   └── frontend/        — App Next.js (App Router)
├── .makuco/              — Artefatos do processo Makuco (specs, PBIs, decisions, STATE.md)
├── .claude/               — Skills/agents do Claude Code usados para desenvolver o projeto
├── docs/                  — Evidências de suporte (ex.: implantação do Makuco)
└── README.md              — Apresentação do beta e roadmap
```

## Entry Points

| Entry Point | Path | Purpose |
| --- | --- | --- |
| Backend | `services/backend/src/main.ts` | Bootstrap NestJS (`NestFactory.create` + `configureApp`) |
| Frontend | `services/frontend/src/app/` | Next.js App Router — sem um único arquivo de entrada, cada `page.tsx` é uma rota |

## Source Code Organization

### Backend — `services/backend/src/`

```
src/
├── auth/                  — Autenticação e autorização
│   ├── dto/                — LoginDto, RegisterDto, RefreshDto
│   ├── decorators/          — @Roles
│   ├── guards/               — JwtAuthGuard, RolesGuard
│   ├── exceptions/            — EmailAlreadyExistsException, EmailNotConfirmedException
│   ├── use-cases/               — LoginUseCase, RegisterUseCase, RefreshUseCase
│   ├── profile-role.lookup.ts    — consulta o papel do usuário em `profiles`
│   └── auth.controller.ts         — POST /auth/register, /login, /refresh, GET /auth/me
├── admin/                  — Scaffolding admin-only (demonstração do mecanismo de autorização)
├── animals/                 — Cadastro de animais
│   ├── dto/                   — CreateAnimalDto, UpdateAnimalDto
│   └── use-cases/                — CreateAnimalUseCase, UpdateAnimalUseCase, ListAnimalsUseCase
├── species/                  — Leitura da tabela de espécies (seed fixo)
├── supabase/                  — Provider do SupabaseClient (singleton service-role + factory efêmera de auth)
├── app.module.ts               — Módulo raiz, registra os módulos de domínio
├── configure-app.ts              — CORS, ValidationPipe, decisão documentada sobre trust proxy
└── main.ts                        — Bootstrap
```

Padrão por módulo de domínio: `*.controller.ts` (HTTP) → `use-cases/*.use-case.ts` (regra de negócio) → `SUPABASE_CLIENT`/`SUPABASE_AUTH_CLIENT_FACTORY` (acesso a dados). `*.module.ts` faz o wiring de DI.

### Frontend — `services/frontend/src/`

```
src/
├── app/                    — Rotas (Next.js App Router)
│   ├── login/
│   ├── registro/confirmacao-pendente/
│   ├── cliente/              — Placeholder área do adotante
│   └── admin/                — Área administrativa (animais/, animais/novo, animais/[id]/editar)
├── components/
│   ├── auth/                  — LoginForm, RegisterForm, RequireRole, AccessDenied, SessionRefresher
│   ├── animals/                 — AnimalForm, AnimalsListView, EditAnimalView
│   └── ui/                       — Primitivas shadcn/ui geradas via CLI (não código de negócio próprio)
└── lib/
    ├── api/                    — Clientes HTTP (auth.ts, animals.ts, species.ts) — ApiError, authenticatedFetch
    └── auth/                    — SessionContext (sessão em memória, nunca localStorage), refresh-scheduler
```

## Path Aliases

| Alias | Resolves To | Configured In |
| --- | --- | --- |
| `@/*` | `services/frontend/src/*` | `services/frontend/tsconfig.json` |

Backend não declara path aliases — imports relativos (`../../supabase/supabase.provider`).

## Monorepo / Modular Layout

Não é um monorepo com tooling formal — dois `package.json` independentes sob `services/`, sem `workspaces` raiz. Cada serviço é instalado e rodado separadamente (`cd services/backend && npm install`, idem para `frontend`). Mapa por módulo/domínio → [OVERVIEW.md](OVERVIEW.md).

## Generated / Build Artifacts

| Directory | Purpose | In .gitignore? |
| --- | --- | --- |
| `services/backend/dist/` | Build compilado do NestJS | Sim |
| `services/frontend/.next/` | Build cache do Next.js | Sim |
| `*/coverage/` | Relatórios de cobertura (Jest) | Sim |
| `*/node_modules/` | Dependências | Sim |
