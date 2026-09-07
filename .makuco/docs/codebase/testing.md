# Convenção de Testes — CatDog

> Projeto greenfield: nenhum código existe ainda. Esta convenção foi decidida com o usuário na PBI 1 (Registro e confirmação de conta) para que `makuco-desenvolver` não precise reperguntar em cada PBI. Ajustar aqui quando o projeto real divergir (ex.: scripts de package.json diferentes dos assumidos abaixo).

## Test Coverage Matrix

| Camada | Tipo de teste requerido | Ferramenta |
| --- | --- | --- |
| Backend — serviços, casos de uso, regras de negócio | unit | Jest |
| Backend — endpoints/controllers (fluxo completo via HTTP) | integration | Jest + Supertest |
| Frontend — componentes, hooks, validação de formulário | unit | Jest + React Testing Library |
| Frontend — páginas/fluxos completos de UI | e2e | Nenhuma ferramenta de e2e de UI decidida ainda — fora de escopo até uma PBI exigir |

## Parallelism Assessment

| Tipo de teste | Parallel-Safe |
| --- | --- |
| unit (backend ou frontend) | Yes |
| integration (Jest + Supertest, sem estado compartilhado) | Yes, desde que cada teste use dados isolados |

## Exclusões de cobertura (decididas no fechamento de pbi-001)

- **Backend**: `main.ts` e `*.module.ts` excluídos (`coveragePathIgnorePatterns` em `package.json`) — arquivos de wiring/composição do NestJS, sem lógica de negócio; a integridade da montagem já é validada pelos testes e2e, que bootam o `AppModule` completo. `configure-app.ts` também excluído — tem lógica real (CORS, ValidationPipe), mas só é exercitado por `test/cors.e2e-spec.ts` (e2e), não por um teste unitário; a métrica de cobertura unitária e a de e2e não são somadas por esta config.
- **Frontend**: `src/components/ui/**` excluído (`coveragePathIgnorePatterns` em `jest.config.ts`) — primitivas geradas pelo `shadcn` CLI (`npx shadcn add ...`), não código de negócio próprio do projeto.

## Gate Check Commands

> **[ASSUMPTION]** Scripts assumidos como padrão NestJS/Next.js; confirmar/ajustar quando `package.json` de cada serviço for criado (primeira task de cada PBI que ainda não tiver o serviço inicializado).

| Gate | Comando (backend) | Comando (frontend) |
| --- | --- | --- |
| quick | `npm run test` (services/backend) | `npm run test` (services/frontend) |
| full | `npm run test:e2e` (services/backend) | `npm run test` -- --coverage (services/frontend) |
| build | `npm run build` (services/backend) | `npm run build` (services/frontend) |
