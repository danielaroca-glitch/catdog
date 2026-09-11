# catdog

## Papel no ecossistema

Plataforma de adoção de animais para uma ONG: centraliza o cadastro dos animais disponíveis (hoje) e, nos próximos incrementos, a vitrine pública para clientes finais e a gestão das solicitações de adoção recebidas. Resolve a dependência atual de planilhas e mensagens dispersas, dando à equipe administrativa um cadastro único, autenticado e controlado por papel.

## Apelidos e status

| Campo | Valor |
| --- | --- |
| Status | Beta — núcleo administrativo em produção (autenticação + cadastro de animais); vitrine pública e gestão de solicitações ainda não iniciadas |
| Substitui / é substituído por | Não aplicável — primeira versão digital deste processo, hoje feito manualmente |

## Consome / é consumido por

| Direção | Contraparte | Como |
| --- | --- | --- |
| consome | Supabase (projeto externo) | Auth (JWT/JWKS) + Postgres, via `@supabase/supabase-js` |
| é consumido por | `services/frontend` | REST, via `NEXT_PUBLIC_API_URL` |

Repositório único (sem `repos/` multi-repo) — backend e frontend vivem lado a lado em `services/`, não como repositórios separados.

## Mapa de módulos

| Módulo | Caminho | Papel | Doc |
| --- | --- | --- | --- |
| Autenticação e Autorização | `services/backend/src/auth/` + `services/frontend/src/components/auth/`, `app/login/`, `app/registro/` | Registro, confirmação de conta, login com refresh token, autorização por papel (admin/adotante) | [modules/autenticacao-e-autorizacao.md](modules/autenticacao-e-autorizacao.md) |
| Registro de animais | `services/backend/src/animals/` + `services/frontend/src/components/animals/`, `app/admin/animais/` | Cadastro, edição e inativação de animais disponíveis para adoção | [modules/registro-de-animais.md](modules/registro-de-animais.md) |
| Espécies (suporte) | `services/backend/src/species/` | Leitura de uma lista fixa de espécies, usada para validar o cadastro de animais | [modules/especies.md](modules/especies.md) |
| Admin scaffolding | `services/backend/src/admin/` | Endpoint de demonstração do mecanismo admin-only, sem lógica de negócio própria | [modules/admin-scaffolding.md](modules/admin-scaffolding.md) |
| Supabase provider | `services/backend/src/supabase/` | Infraestrutura compartilhada de acesso ao Supabase (cliente singleton + factory efêmera) | — |
| UI compartilhada | `services/frontend/src/components/ui/` | Primitivas shadcn/ui geradas via CLI, sem lógica de negócio | — |

## Contexto detalhado

- Stack e dependências → [stack.md](stack.md)
- Layout e entry points → [structure.md](structure.md)
- Padrão arquitetural e fronteiras → [architecture.md](architecture.md)
- Convenções de código → [conventions.md](conventions.md)
- Integrações externas → [integrations.md](integrations.md)
- Concerns transversais → [concerns.md](concerns.md)
- Testes → [testing.md](testing.md)

## Divergências

Nenhuma — sem documento de referência do time declarado (`research.referencias: []` em `MAKUCO.md`), nada a reconciliar.
