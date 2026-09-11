# Registro de animais

`services/backend/src/animals/` + `services/frontend/src/components/animals/`, `app/admin/animais/`

Resolve o problema central do produto: dar à equipe administrativa um cadastro único e confiável dos animais disponíveis para adoção, substituindo o controle disperso em planilhas e mensagens. É a base de dados sobre a qual a futura vitrine pública (módulo ainda não construído) vai ser exibida sem retrabalho.

## Capacidades

### Cadastro

- Cadastra um novo animal (nome + espécie obrigatória, validada contra a lista de espécies existente).
- Recusa o cadastro quando a espécie informada não existe, sem persistir nada.
- Todo animal nasce ativo (visível para a futura vitrine pública).

### Edição

- Atualiza os dados de um animal existente (nome e/ou espécie), inclusive quando o animal está inativo.
- Recusa a troca de espécie para uma que não existe, sem aplicar nenhuma mudança.
- Distingue "animal não encontrado" de um erro genérico de sistema.

### Inativação e reativação

- Retira um animal da lista de disponíveis sem apagar o registro (soft-delete via um campo de status, nunca exclusão física) — preserva o histórico administrativo.
- Reverte a inativação quando necessário.
- Operação idempotente: inativar um animal já inativo (ou reativar um já ativo) não gera erro.

### Consulta administrativa

- Lista todos os animais cadastrados (nome, espécie, status), com atalho para editar cada um.

Todas as capacidades acima são **admin-only** — reusam a autorização por papel do módulo de Autenticação, nunca reimplementam controle de acesso próprio.

## Fronteiras

**Expõe:** `POST /animals`, `GET /animals`, `PATCH /animals/:id` — consumidos por `services/frontend`.

**Consome:** módulo Espécies (valida a existência de uma espécie antes de cadastrar/editar); guards de Autenticação e Autorização (`JwtAuthGuard`, `RolesGuard`) para todo endpoint.

## Evidência

- `services/backend/src/animals/animals.controller.ts`, `use-cases/*.use-case.ts` — lidos por inteiro
- `services/frontend/src/components/animals/animal-form.tsx`, `animals-list-view.tsx`, `edit-animal-view.tsx` — lidos por inteiro
- `services/backend/supabase/migrations/20260910190000_create_species_and_animals.sql` — schema da tabela `animals`
- Sem documento de referência do time a reconciliar
