# Cross-Cutting Concerns

## Authentication & Authorization

- **Autenticação**: JWT do Supabase Auth, verificado via `supabase.auth.getClaims()` (`JwtAuthGuard`) — nunca decodificação manual. Cobre HS256 e ES256 automaticamente (o SDK escolhe conforme o `kid`).
- **Autorização por papel**: `RolesGuard` + decorator `@Roles(...)` (`Reflector.getAllAndOverride`, nível de método com prioridade sobre classe). Papel do usuário (`admin`/`adotante`) consultado em `profiles` a cada requisição via `ProfileRoleLookup` — nunca cacheado no token.
- **Regra de fail-open documentada**: ausência de `@Roles(...)` em ambos os níveis (classe e método) faz `RolesGuard` liberar qualquer usuário autenticado. Controllers admin-only por design colocam o decorator na **classe** para evitar esse fail-open em handlers futuros (ver `AdminController`, `AnimalsController`).
- **Frontend**: `RequireRole` (client component) — sem sessão → redireciona para `/login`; sessão com papel errado → `AccessDenied`. Não é uma fronteira de segurança real (o backend é); é só UX, já que a sessão vive em memória e o middleware do Next não a enxerga.

## Logging

Nenhum logger estruturado configurado — sem uso de `Logger` do NestJS além do default do framework, sem log de auditoria nas mutações administrativas (achado documentado, não bloqueante, no review de `registro-de-animais`).

## Error Handling

- **Backend**: exceções tipadas do NestJS (`BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ForbiddenException`, `InternalServerErrorException`), sempre com mensagem em PT-BR. Nenhum filtro de exceção global customizado — usa o formatador padrão do Nest.
- **Frontend**: classe `ApiError` própria (`status` + `message`) lançada pelos clientes HTTP (`lib/api/*.ts`); componentes distinguem `ApiError` de erro inesperado via `instanceof` e caem num fallback genérico em PT-BR quando não é.

## Validation

- **Backend**: `class-validator` + `class-transformer` via `ValidationPipe` global (`configure-app.ts`) — decorators nos DTOs (`@IsEmail`, `@IsUUID`, `@IsOptional`, `@MaxLength`, etc.).
- **Frontend**: zod + `@hookform/resolvers` nos formulários (`react-hook-form`), schema espelhando os DTOs do backend campo a campo.

## Rate Limiting

`@nestjs/throttler`, aplicado **por endpoint** via `@Throttle(...)` + `@UseGuards(ThrottlerGuard)` (nunca `APP_GUARD` global) — cada endpoint declara seu próprio limite conforme o risco (ex.: 30/min nos endpoints admin, para mitigar o custo de verificação de JWT com `kid` desconhecido).

## Security

- **CORS**: habilitado via `configureApp()`, origem restrita a `FRONTEND_URL`.
- **`trust proxy`**: deliberadamente **não** configurado — decisão documentada (`STATE.md`), já que não há topologia de deploy real definida ainda; revisitar quando houver.
- **RLS (Row Level Security)**: habilitado em todas as tabelas próprias (`profiles`, `species`, `animals`), sem policy permissiva — todo acesso passa pela API via `SUPABASE_CLIENT` (service role, ignora RLS por padrão); RLS existe como defesa em profundidade contra acesso direto client-side futuro.
- **Least privilege**: cliente Supabase de auth de usuário final é sempre efêmero (nunca o singleton service-role) — ver `architecture.md`.

## Internationalization (i18n)

Nenhuma — projeto monolíngue PT-BR (texto de UI e mensagens de erro hardcoded em português, sem biblioteca de i18n).

## Performance

Sem paginação em nenhum endpoint de listagem (`GET /animals`, `GET /species`) — decisão deliberada de escopo para um volume administrativo pequeno, documentada como não bloqueante. Sem cache, sem lazy loading/code splitting customizado além do que o Next.js já faz por padrão.
