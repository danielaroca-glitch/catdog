---
stage: documentation
feature: registro-de-animais
pbi: alta-de-animal, edicao-de-animal, inativacao-de-animal
created_at: 2026-09-11
status: done
---

> **Escopo deste arquivo:** a pedido do usuário, este `learnings.md` cobre as **3 PBIs da feature `registro-de-animais` juntas** — `pbi-001-alta-de-animal`, `pbi-002-edicao-de-animal`, `pbi-003-inativacao-de-animal` — desenvolvidas e revisadas em sequência direta na mesma sessão, com uma única rodada de review cobrindo as 3. Por isso este artefato vive na raiz da feature (`learnings.md`), não em `pbis/{slug}/learnings.md` — mesmo raciocínio já aplicado ao `review.md` desta feature (que também vive na raiz e tem uma nota de escopo equivalente).

# Learnings: Registro de Animais (Alta, Edição e Inativação de animal)

## O que foi implementado

CRUD administrativo completo de animais foi implementado em 3 PBIs sequenciais na mesma sessão: tabelas `species`/`animals` via migration SQL (aplicada manualmente pelo usuário no Supabase, mesmo padrão do módulo de Autenticação), `SpeciesService.exists` + `GET /species`, `POST/GET/PATCH /animals` (o `PATCH` foi reusado tanto para edição de conteúdo quanto para inativação/reativação via campo `active`), `AnimalForm` (modos criação/edição) e as páginas `/admin/animais`, `/admin/animais/novo` e `/admin/animais/[id]/editar`. Todos os 24 requisitos das 3 PBIs (ALTA-01..08, EDICAO-01..10, INATIVACAO-01..06) foram verificados contra código e e2e reais. Aprovado na Rodada 2 de review, após a Rodada 1 encontrar 1 achado `major` (bug real, corrigido) + 11 `minor` + 4 `suggestion` (não bloqueantes).

## Decisões tomadas

| Decisão | Alternativa considerada | Motivo da escolha |
| ------- | ----------------------- | ------------------ |
| PATCH genérico reusado para inativação (`active?` em `UpdateAnimalDto`) em vez de endpoint dedicado | `POST /animals/:id/inativar` dedicado | RN-02 já trata inativação como só um campo do animal; endpoint dedicado duplicaria guards/validação/e2e sem ganho |
| `GET /animals` (listagem) criado como gap confirmado com o usuário durante pbi-002 (EDICAO-10) | Manter só criação/edição sem listagem, como o roadmap original sugeria | Sem listagem, o admin não tinha como descobrir qual animal editar/inativar |
| `GET /species` + `listSpecies` criados como addendum durante pbi-001 (T5/T6) | Formulário sem seletor dinâmico de espécie | `AnimalForm` precisa listar espécies válidas para o seletor; `SpeciesService.exists` sozinho não bastava |
| Edição descobre o animal via `listAnimals` + filtro por `id`, sem `GET /animals/:id` dedicado | Criar `GET /animals/:id` | Simplicidade aceita para o volume atual (poucos animais); registrado como débito não bloqueante |
| Seletor de espécie com `<select>` HTML nativo, não Radix `Select` (shadcn) | Radix `Select` (gerado via shadcn CLI) | Trava em testes jsdom mesmo com polyfills de `hasPointerCapture`/`scrollIntoView` |
| Estado de erro do toggle de ativo/inativo separado do erro de carga inicial da lista (`toggleError` vs `error`) — fix do achado major da Rodada 1 do review | Manter um único estado `error` compartilhado (implementação original) | Falha pontual do toggle escondia a tabela inteira já carregada — bug real, confirmado |

## Desvios do planejado

- pbi-001: `GET /species` não estava no plano original de 6 tasks; surgiu como gap durante T5/T6 (formulário precisava listar espécies).
- pbi-002: `GET /animals` (listagem) não estava previsto em nenhuma feature do roadmap; confirmado como gap com o usuário (EDICAO-10) e incorporado como T3.
- pbi-003: 1 achado `major` na Rodada 1 do review (`AnimalsListView` escondia a lista inteira quando o toggle de ativo/inativo falhava) — corrigido e verificado por teste dedicado antes da Rodada 2 aprovar. Verificação da correção feita pelo próprio orquestrador (teste automatizado dedicado + suíte completa + build/lint), sem uma 2ª rodada adversarial independente via subagentes — mesma decisão de continuidade já usada nas Rodadas 2 de pbi-002/pbi-003 do módulo de Autenticação.
- T1 de pbi-001 (migration) precisou ser aplicada manualmente pelo usuário no SQL Editor do Supabase (sem acesso automatizado ao Postgres nesta sessão) — mesmo padrão já visto no módulo de Autenticação.

## Problemas encontrados

- Bug major (Rodada 1 do review, corrigido antes da aprovação): `AnimalsListView` compartilhava o estado `error` entre a carga inicial da lista e o toggle de ativo/inativo de uma linha — falha do toggle escondia a tabela inteira já carregada, mesmo com dados já carregados com sucesso. Corrigido com estado `toggleError` separado + teste dedicado (`shows a toggle-specific error without hiding the already-loaded table`).
- Seletor Radix `Select` (shadcn) trava em testes jsdom mesmo com polyfills padrão — resolvido trocando por `<select>` nativo (ver Decisões tomadas).
- 11 achados `minor` + 4 `suggestion` documentados em `review.md`, não bloqueantes: tipo `Animal` mal posicionado (dependência invertida entre use cases); 4 interfaces de resultado do Supabase duplicadas (`AnimalInsertResult`/`AnimalsListResult`/`AnimalUpdateResult`/`SpeciesListResult`); `AnimalsController` com 3 dependências injetadas; número mágico `120` (`MaxLength`) repetido em 2 DTOs; tratamento de erro fraco no fluxo de espécies (`species.ts` + `AnimalForm`); lacunas de cobertura em `AnimalForm` (sem `initialSpecies`), `EditAnimalView` (branch de erro genérico) e nos DTOs (`MaxLength` não testado); ausência de log de auditoria nas mutações administrativas; TOCTOU entre `SpeciesService.exists` e a escrita; botão de toggle sem guarda contra duplo clique; `UpdateAnimalUseCase.execute()` extraível (44 linhas); branching de `isEditMode` inconsistente no `AnimalForm`; `UpdateAnimalDto` misturando edição de conteúdo e status (decisão já aprovada); `GET /animals` sem paginação (decisão já aprovada).

## O que ficou fora do escopo

- Upload/gestão de foto do animal — nenhum CA pediu, roadmap de produto não menciona pipeline de upload.
- CRUD completo de espécies (criar/editar/inativar espécie pelo admin) — módulo futuro "Registro de espécies" (DEC-02 de `decisions.md`); aqui a tabela `species` só é lida, nunca escrita pelo admin.
- Vitrine pública / listagem para clientes — módulo futuro "Lista pública de animais disponíveis".
- Filtros/busca/paginação na listagem administrativa de animais — decisão aceita, não bloqueante (achado #16 do review).
- `GET /animals/:id` dedicado — edição usa `listAnimals` + filtro client-side; débito aceito, não bloqueante (ver DEC-03 de `decisions.md`).
- Log de auditoria das mutações administrativas (quem/quando/o quê) — achado minor #10 do review, sem padrão de auditoria adotado pelo projeto ainda.
- Uma Rodada 3 de review independente para confirmar o fix do achado major — recomendada em `review.md`, não executada (mesma decisão de continuidade já registrada no módulo de Autenticação).

## Documentação atualizada

| Arquivo | O que mudou |
| ------- | ----------- |
| `.makuco/docs/modules/module_002_registro-de-animais/feature_001_registro-de-animais/decisions.md` | Nova DEC-03: dois padrões técnicos para módulos futuros — (1) inativação/soft-delete reusa o PATCH genérico do recurso, endpoint dedicado só se o PATCH genérico não bastar; (2) uma listagem (`GET`) é pré-requisito implícito de qualquer CRUD administrativo com edição/inativação individual, mesmo quando nenhuma feature do roadmap menciona "listar" explicitamente — como ficou evidente com `GET /animals` (EDICAO-10) e `GET /species` (addendum de pbi-001) |
| `.makuco/docs/codebase/testing.md` | Nova seção: componentes Radix UI com portal/pointer capture (ex. `Select` do shadcn) não são testáveis em jsdom mesmo com os polyfills usuais — preferir `<select>` nativo quando o campo precisar de teste via Jest+RTL neste projeto |

Nenhum outro arquivo de documentação do projeto precisou de alteração — `feature.md`, `pbis.md` e o roadmap de produto (`scope_features_context.md`) foram comparados com a implementação e não têm drift: a fusão da 4ª feature do roadmap ("Associação com espécie") dentro de Alta/Edição já estava documentada em `pbis.md` antes da implementação.

## Aprendizados para próximos PBIs

- Ao planejar uma PBI de criação que referencia outra entidade (FK/lookup table), prever desde o início se o consumidor (formulário/tela) vai precisar enumerar os valores válidos — "existe" (validação pontual) não é suficiente quando há um seletor na UI.
- Toda feature que introduzirá edição ou inativação individual de um recurso, mesmo que o roadmap de produto não mencione "listagem" explicitamente, provavelmente precisa de um endpoint de listagem antes — vale antecipar isso no `spec.md` em vez de descobrir como gap no meio da implementação.
- Um estado de erro/loading compartilhado entre "carga inicial de uma lista" e "uma ação pontual em um item da lista" (ex. toggle, delete de uma linha) é uma classe de bug recorrente: separar sempre os dois — um erro de ação pontual nunca deve esconder dados já carregados com sucesso.
- Componentes de terceiros baseados em portal/pointer capture (Radix UI) precisam ser validados cedo contra o ambiente de teste real do projeto (jsdom, aqui) antes de investir na implementação completa — descobrir isso só depois de gerar o componente custa retrabalho (gerar via shadcn, tentar, remover, trocar por HTML nativo).
- Reusar um endpoint de atualização genérico (PATCH) para uma operação que semanticamente parece uma "ação" (inativar/reativar) é preferível a um endpoint dedicado quando a regra de negócio já trata o estado como só mais um campo do recurso — evita duplicar guards/validação/e2e.

---

Próximo passo Todos os stages desse PBI estão completos.
