# Stack — CatDog

Repositório único, dois serviços independentes sob `services/` (sem workspaces/monorepo tooling — cada um tem seu próprio `package.json`, instalado e rodado separadamente).

## Backend — `services/backend`

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Runtime/linguagem | Node.js + TypeScript | TS ^5.7.3 |
| Framework | NestJS (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`) | ^11.0.1 |
| Config | `@nestjs/config` | ^4.0.4 |
| Rate limiting | `@nestjs/throttler` | ^6.5.0 |
| Auth/DB client | `@supabase/supabase-js` | ^2.109.0 |
| Validação de DTO | `class-validator` + `class-transformer` | ^0.15.1 / ^0.5.1 |
| Testes | Jest + `ts-jest` (unit), Jest + Supertest (e2e, config própria em `test/jest-e2e.json`) | Jest ^30.0.0 |
| Lint/format | ESLint 9 (flat config) + Prettier | ^9.18.0 / ^3.4.2 |
| Build | `nest build` (via `@nestjs/cli`) | ^11.0.0 |

Scripts (`package.json`): `start:dev`, `build`, `test`, `test:cov`, `test:e2e`, `lint`.

## Frontend — `services/frontend`

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Framework | Next.js (App Router, Turbopack) | 16.3.4 |
| UI | React + React DOM | 19.2.8 |
| Estilo | Tailwind CSS 4 + `tw-animate-css` | ^4 |
| Componentes | shadcn/ui (primitivas geradas via CLI em `src/components/ui/`, sobre `@base-ui/react`) | shadcn ^4.21.0 |
| Ícones | lucide-react | ^1.42.0 |
| Formulários | react-hook-form + `@hookform/resolvers` (zod) | ^7.87.0 |
| Validação | zod | ^4.5.4 |
| Testes | Jest (via `next/jest`) + Testing Library (`@testing-library/react`, `/user-event`, `/jest-dom`) + `jest-environment-jsdom` | Jest ^30.5.1 |
| Lint | ESLint 9 + `eslint-config-next` | ^9 |

Scripts: `dev`, `build`, `start`, `test`, `lint`.

## Infraestrutura externa

- **Supabase** — projeto único, serve Auth (JWT assinado com ES256/JWKS) e Postgres. Sem projeto local/self-hosted — todo dev e e2e roda contra o projeto real (ver `testing.md`).
- **SonarQube** — análise de qualidade via `sonar-project.properties` na raiz do repo, escaneando os dois serviços juntos (`sonar.javascript.lcov.reportPaths` aponta para o `coverage/lcov.info` de cada um).

## Gerenciador de pacotes

npm (sem lockfile commitado neste repositório — `package-lock.json` de cada serviço não está versionado).

## Runtime

Sem `.nvmrc`/`.node-version` commitado — versão de Node não fixada explicitamente no repositório.
