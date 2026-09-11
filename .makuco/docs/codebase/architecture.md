# Architecture

## Pattern

**Backend**: arquitetura em camadas orientada a caso de uso, dentro de módulos NestJS por domínio (`auth`, `admin`, `animals`, `species`). Não é Clean Architecture/hexagonal formal (sem `ports`/`adapters` explícitos) — cada domínio segue Controller → Use Case → acesso direto ao `SupabaseClient` (sem camada de repositório própria; o SDK do Supabase já atua como esse limite).

**Frontend**: Next.js App Router convencional — Server Components finos por rota (`app/**/page.tsx`) delegando para Client Components (`components/`) que concentram estado e interação. Sem gerenciador de estado global — estado de sessão vive em Context (`SessionContext`), estado de UI é local a cada componente.

## Layers / Boundaries (Backend)

| Layer | Responsibility | Example Path |
| --- | --- | --- |
| Controller | Recebe HTTP, aplica guards, delega ao use case | `src/animals/animals.controller.ts` |
| DTO | Validação de entrada (`class-validator`) | `src/animals/dto/create-animal.dto.ts` |
| Use Case | Regra de negócio, uma classe por operação | `src/animals/use-cases/create-animal.use-case.ts` |
| Acesso a dados | `SUPABASE_CLIENT` (singleton, service role) ou `SUPABASE_AUTH_CLIENT_FACTORY` (cliente efêmero, um por chamada, só para auth de usuário final) | `src/supabase/supabase.provider.ts` |
| Guard (cross-cutting) | Autenticação (`JwtAuthGuard`) e autorização por papel (`RolesGuard`) | `src/auth/guards/` |

## Data Flow

Exemplo real — `POST /animals`:

```
Cliente (fetch autenticado)
  → JwtAuthGuard (valida JWT via supabase.auth.getClaims(), popula request.user)
    → RolesGuard (consulta profiles via ProfileRoleLookup, exige role='admin')
      → ThrottlerGuard (rate limit)
        → ValidationPipe (CreateAnimalDto)
          → AnimalsController.create()
            → CreateAnimalUseCase.execute()
              → SpeciesService.exists() (valida species_id antes de escrever)
              → SUPABASE_CLIENT.from('animals').insert(...)
```

## API Style

- **Tipo**: REST
- **Base path**: nenhum prefixo global (`/auth/*`, `/admin/*`, `/animals/*`, `/species/*` na raiz)
- **Autenticação**: Bearer JWT (Supabase, assinatura ES256/JWKS) no header `Authorization`
- **Documentação**: nenhuma (sem Swagger/OpenAPI configurado)

## State Management (Frontend)

- **Sessão**: React Context (`SessionContext`, `services/frontend/src/lib/auth/session-context.tsx`) — **somente em memória**, nunca `localStorage`/`sessionStorage` (decisão de produto documentada em `decisions.md` de `autenticacao-e-autorizacao`); perdida em reload de página.
- **Estado de UI**: local a cada componente (`useState`), sem store global.
- **Dados remotos**: sem cache/data-fetching library (React Query, SWR) — cada componente busca via `fetch` (`lib/api/*.ts`) diretamente em `useEffect`.

## Domain Boundaries

Mecanismo: um módulo NestJS por domínio no backend (`@Module`, pasta própria); uma pasta de componentes + uma rota no frontend, sem um mecanismo formal de "feature folder" próprio do framework.

| Domain | Path | Core Responsibility |
| --- | --- | --- |
| Autenticação | `services/backend/src/auth/` | Registro, login, refresh, guards de auth/autorização |
| Cadastro de animais | `services/backend/src/animals/` | CRUD de animais (alta, edição, inativação via campo `active`) |
| Espécies | `services/backend/src/species/` | Leitura da tabela `species` (seed fixo, sem escrita) |
| Admin scaffolding | `services/backend/src/admin/` | Endpoint de demonstração do mecanismo admin-only |

Mapa completo (incluindo frontend) → [OVERVIEW.md](OVERVIEW.md).

## Key Architectural Decisions

- **Cliente Supabase efêmero para auth de usuário final** (`SUPABASE_AUTH_CLIENT_FACTORY`) — o singleton `SUPABASE_CLIENT` (service role) nunca deve chamar `signInWithPassword`/`refreshSession`, porque o SDK cacheia a sessão resultante e a usa em chamadas subsequentes do mesmo cliente, vazando identidade entre requisições. Ver `decisions.md` da feature `autenticacao-e-autorizacao`.
- **Verificação de JWT via `supabase.auth.getClaims()`**, nunca `jsonwebtoken`/HS256 local — o projeto assina tokens com ES256 (JWKS), não com um segredo compartilhado.
- **`@Roles(...)` sempre no nível de classe** em controllers admin-only — `RolesGuard` é fail-open (permite qualquer autenticado) quando não encontra a metadata nem na classe nem no método; um decorator só no método deixaria handlers futuros acessíveis por engano.
- **`PATCH` genérico reusado para soft-delete** (`animals.active`) em vez de endpoints dedicados de inativar/reativar — inativação é tratada como "só mais um campo" do mesmo recurso.
- **Sessão do frontend nunca persiste em storage do browser** — decisão de produto deliberada (não uma lacuna), aceita a perda de sessão em reload como trade-off.
