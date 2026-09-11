# Conventions

## Linting & Formatting

- **Backend**: ESLint 9 (flat config, `eslint.config.mjs`) + `typescript-eslint` + Prettier (via `eslint-config-prettier`/`eslint-plugin-prettier`). `npm run lint` roda `eslint --fix`.
- **Frontend**: ESLint 9 + `eslint-config-next`. `npm run lint` roda `eslint` (sem `--fix` automático no script).
- Sem `.editorconfig` no repositório.

## Naming Patterns

- **Arquivos**: kebab-case em ambos os serviços (`create-animal.use-case.ts`, `animal-form.tsx`, `require-role.tsx`).
- **Classes/componentes**: PascalCase (`CreateAnimalUseCase`, `AnimalForm`).
- **Testes unitários**: `*.spec.ts` (backend, colocado junto ao arquivo testado).
- **Testes e2e**: `*.e2e-spec.ts` (backend, centralizados em `services/backend/test/`, config própria `test/jest-e2e.json`).
- **Testes de componente/frontend**: `*.test.ts`/`*.test.tsx` (colocado junto ao arquivo testado).
- **DTOs**: sufixo `.dto.ts`, classe `NomeDto`.
- **Use cases**: sufixo `.use-case.ts`, classe `NomeUseCase`, método público único `execute()`.
- **Migrations SQL**: `supabase/migrations/{YYYYMMDDHHMMSS}_{descrição}.sql`, idempotentes (`if not exists`/`on conflict do nothing`).

## File Organization

- **Backend**: testes colocados (`create-animal.use-case.ts` + `create-animal.use-case.spec.ts` no mesmo diretório); e2e centralizados em `test/`.
- **Frontend**: testes colocados junto ao componente/módulo (`animal-form.tsx` + `animal-form.test.tsx`).
- DTOs em subpasta `dto/`, use cases em subpasta `use-cases/`, dentro de cada módulo de domínio (backend).

## Import Patterns

- **Backend**: imports relativos, sem path alias configurado.
- **Frontend**: alias `@/*` → `src/*` (`tsconfig.json`), usado nos componentes/páginas; arquivos dentro de `lib/`/`components/` às vezes usam relativos entre si (ex. `./auth` dentro de `lib/api/`).
- Sem barrel files (`index.ts` de re-export) em nenhum dos dois serviços.

## Commit Conventions

Conventional Commits (`feat(scope): ...`, `fix(scope): ...`, `docs: ...`, `test(scope): ...`), escopo geralmente `backend`/`frontend`. Um commit por task/mudança lógica — não há squash de múltiplas mudanças não relacionadas no mesmo commit.

## Code Style

- **Backend**: OOP orientado a classes (NestJS idiomático — `@Injectable`, `@Controller`, DI via construtor). Tratamento de erro por exceções tipadas do Nest (`BadRequestException`, `NotFoundException`, `InternalServerErrorException`, `UnauthorizedException`, `ForbiddenException`) — nunca retorno de erro como valor.
- **Frontend**: componentes funcionais, hooks (`useState`/`useEffect`/`useForm`). Mensagens de erro sempre em PT-BR, via uma classe `ApiError` própria (`lib/api/auth.ts`) que carrega `status` + mensagem do backend.
- **Mensagens voltadas ao usuário**: sempre PT-BR, tanto no backend (mensagens de exceção) quanto no frontend.
- **Comentários**: usados para justificar decisões não óbvias (ex.: por que um cliente Supabase é efêmero, por que um decorator está na classe e não no método) — não para descrever o que o código faz.
