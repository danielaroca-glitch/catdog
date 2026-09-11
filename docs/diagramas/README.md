# Diagramas — catdog

Diagramas de arquitetura e dados do produto, gerados em PlantUML (fonte `.puml`, renderizados em `.svg`/`.png`).

## C4 (arquitetura)

| Diagrama | Arquivo | Nível |
| --- | --- | --- |
| Contexto | [c4-contexto-catdog.puml](c4-contexto-catdog.puml) / [.png](c4-contexto-catdog.png) | C4 Nível 1 — atores (Administrador, Adotante), o sistema catdog e o Supabase como sistema externo |
| Contêineres | [c4-conteineres-catdog.puml](c4-conteineres-catdog.puml) / [.png](c4-conteineres-catdog.png) | C4 Nível 2 — Frontend (Next.js) e Backend (NestJS), e como cada um fala com o Supabase Auth/Postgres |
| Componentes (Backend) | [c4-componentes-backend-catdog.puml](c4-componentes-backend-catdog.puml) / [.png](c4-componentes-backend-catdog.png) | C4 Nível 3 — os módulos NestJS do backend (Auth, Admin, Animals, Species, Supabase Provider) e como se relacionam |

## Modelo de dados

| Diagrama | Arquivo |
| --- | --- |
| DER | [der-catdog.puml](der-catdog.puml) / [.png](der-catdog.png) |

Cobre as tabelas atuais do Postgres (via Supabase): `profiles` (vinculada a `auth.users`, papel admin/adotante), `species` (seed fixo) e `animals` (FK para `species`).

## Fonte

Gerados a partir de `.makuco/docs/codebase/OVERVIEW.md`, `architecture.md` e das migrations SQL em `services/backend/supabase/migrations/`. Atualizar manualmente quando a arquitetura ou o schema mudarem.
