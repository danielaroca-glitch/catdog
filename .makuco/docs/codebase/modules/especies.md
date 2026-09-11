# Espécies

`services/backend/src/species/`

Módulo de suporte ao cadastro de animais: garante que todo animal seja associado a uma espécie de um vocabulário controlado, em vez de texto livre. Hoje é intencionalmente mínimo (lista fixa, populada por seed) — evolui para gestão completa (cadastro/edição/inativação de espécies pelo admin) num módulo futuro do roadmap, sem exigir migração do vínculo já criado.

## Capacidades

### Consulta de espécies

- Lista as espécies disponíveis (id + nome), para popular o seletor do formulário de cadastro/edição de animal.
- Verifica se uma espécie existe, usado pelo módulo de Registro de animais antes de cadastrar/editar um animal.

Não há criação, edição ou inativação de espécie pelo admin — fora de escopo deliberado até o módulo futuro de gestão de espécies.

## Fronteiras

**Expõe:** `GET /species` — consumido por `services/frontend` e internamente pelo módulo de Registro de animais.

**Consome:** tabela `species` (Postgres, seed fixo: Cachorro, Gato, Ave, Outro).

## Evidência

- `services/backend/src/species/species.controller.ts`, `species.service.ts` — lidos por inteiro
- `services/backend/supabase/migrations/20260910190000_create_species_and_animals.sql` — schema + seed
- Sem documento de referência do time a reconciliar
