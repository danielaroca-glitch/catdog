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

- **Backend**: `main.ts` e `*.module.ts` excluídos (`coveragePathIgnorePatterns` em `package.json`) — arquivos de wiring/composição do NestJS, sem lógica de negócio; a integridade da montagem já é validada pelos testes e2e, que bootam o `AppModule` completo. `configure-app.ts` também excluído — tem lógica real (CORS, ValidationPipe, e a decisão documentada de não configurar `trust proxy`), mas só é exercitado por testes e2e (`test/cors.e2e-spec.ts` e `test/trust-proxy.e2e-spec.ts`, ambos chamam `configureApp()` explicitamente), não por um teste unitário; a métrica de cobertura unitária e a de e2e não são somadas por esta config. A mesma exclusão precisa ser espelhada em `sonar.coverage.exclusions` (`sonar-project.properties`), senão o Sonar reporta 0% de cobertura para este arquivo mesmo estando coberto via e2e (ver `.makuco/STATE.md`, Lessons Learned).
- **Frontend**: `src/components/ui/**` excluído (`coveragePathIgnorePatterns` em `jest.config.ts`) — primitivas geradas pelo `shadcn` CLI (`npx shadcn add ...`), não código de negócio próprio do projeto.

## Testes unitários mockados vs. comportamento real de SDK externo (Supabase Auth)

> Adicionado após `pbi-002` (Login e sessão com refresh token, Rodada 1 do review, achado #1 crítico): um fix (`signOut({ scope: 'local' })`) que quebrava o próprio fluxo de refresh passou 100% verde nos testes unitários mockados e só foi pego rodando a suíte e2e contra o Supabase real.

- Qualquer comportamento que dependa da semântica REAL de um SDK de terceiro (ex.: o que `persistSession: false` de fato faz no Supabase Auth, o que `signOut({ scope })` revoga no servidor, como o GoTrue decide tolerar reuso de refresh token) **não pode ser considerado verificado só por teste unitário com o SDK mockado** — o mock reflete a suposição do autor sobre o comportamento, não o comportamento real.
- Para esses casos, o teste e2e precisa rodar contra o serviço real (Supabase real, não um mock/stub), como já é o padrão dos specs em `services/backend/test/*.e2e-spec.ts` (ex. `auth-login.e2e-spec.ts`, `auth-refresh.e2e-spec.ts`).
- Ao investigar uma falha ligada a um SDK de terceiro, ler o código-fonte real do SDK instalado (`node_modules/`) ou a documentação oficial antes de assumir o comportamento pelo nome do parâmetro/método — ver `.makuco/STATE.md` (Lessons Learned) para o caso concreto do `persistSession`/`signOut({ scope: 'local' })`.

## Gate Check Commands

> Confirmado em `pbi-001` (T1/T2): os scripts abaixo batem exatamente com o `package.json` real de `services/backend` (NestJS via `@nestjs/cli@11`) e `services/frontend` (Next.js 16) — deixou de ser suposição para esses dois serviços. Mantém-se `[ASSUMPTION]` apenas para um serviço novo ainda não inicializado.

| Gate | Comando (backend) | Comando (frontend) |
| --- | --- | --- |
| quick | `npm run test` (services/backend) | `npm run test` (services/frontend) |
| full | `npm run test:e2e` (services/backend) | `npm run test` -- --coverage (services/frontend) |
| build | `npm run build` (services/backend) | `npm run build` (services/frontend) |
