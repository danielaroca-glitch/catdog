# Admin scaffolding

`services/backend/src/admin/`

Não resolve uma necessidade de negócio própria — é um endpoint mínimo criado junto com o mecanismo de autorização por papel, para provar e documentar o padrão que qualquer módulo admin-only futuro deve seguir (guard de classe, `@Roles('admin')` na classe para evitar fail-open em handlers futuros, rate limit).

## Capacidades

### Demonstração do mecanismo admin-only

- Responde `{ ok: true }` para um admin autenticado; nenhum outro comportamento.

## Fronteiras

**Expõe:** `GET /admin/ping` — sem consumidor real além de verificação manual/e2e do próprio mecanismo de autorização.

**Consome:** guards de Autenticação e Autorização (`JwtAuthGuard`, `RolesGuard`).

## Evidência

- `services/backend/src/admin/admin.controller.ts` — lido por inteiro (arquivo único do módulo)
- Sem documento de referência do time a reconciliar
