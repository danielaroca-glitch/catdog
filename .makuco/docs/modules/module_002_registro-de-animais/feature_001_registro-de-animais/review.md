---
stage: review
feature: registro-de-animais
created_at: 2026-09-11
status: done
---

# Review — Módulo Registro de Animais (3 PBIs)

> **Escopo desta rodada:** a pedido do usuário, esta revisão cobre as **3 PBIs da feature `registro-de-animais` juntas** — `pbi-001-alta-de-animal`, `pbi-002-edicao-de-animal`, `pbi-003-inativacao-de-animal` — numa única rodada, em vez de uma revisão por PBI. Por isso este artefato vive na raiz da feature (`review.md`), não em `pbis/{slug}/review.md`.

## Rodada de revisão 1 — 2026-09-11

**Modo**: PBI (3 PBIs juntas — `pbi-001-alta-de-animal`, `pbi-002-edicao-de-animal`, `pbi-003-inativacao-de-animal`, a pedido do usuário) · **Veredito**: NECESSITA CORREÇÕES

**Tasks revisadas:**
- `pbi-001-alta-de-animal`: task-01 a task-06
- `pbi-002-edicao-de-animal`: task-01 a task-06
- `pbi-003-inativacao-de-animal`: task-01 a task-02

## Resumo

Revisão única cobrindo o módulo `registro-de-animais` completo (39 arquivos, 3 PBIs). Passes 1-7 executados. Todos os 24 requisitos das 3 PBIs (ALTA-01..08, EDICAO-01..10, INATIVACAO-01..06) verificados contra o código e os e2e reais — nenhuma divergência de spec/task (pass 1) e nenhum problema de escopo/contrato/comportamento removido (pass 2). 1 achado `major` (bug real, confirmado) bloqueia aprovação; 11 achados `minor` e 4 `suggestion` documentados, não bloqueantes.

## Achados

| # | Severidade | Arquivo | Descrição | Recomendação |
| - | ---------- | ------- | --------- | ------------ |
| 1 | major | `services/frontend/src/components/animals/animals-list-view.tsx:28,72-73,106` | O estado `error` é compartilhado entre a carga inicial da lista e o toggle de ativo/inativo de uma única linha. Se `toggleActive` falhar (rede instável, 500 transiente), `error` vira truthy e a condição de render da tabela (`!error && !isLoading && animals.length > 0`) esconde a lista INTEIRA — mesmo com `animals` já carregado com sucesso. O admin perde a visão da lista até recarregar a página. Sem teste que cubra esse caminho de erro. | Separar o estado de erro da carga inicial do erro de toggle (ex.: `loadError` vs. erro por linha/`toggleError`), sem deixar uma falha pontual esconder dados já carregados. Adicionar teste cobrindo o caminho de erro do toggle. |
| 2 | minor | `services/backend/src/animals/use-cases/create-animal.use-case.ts:12-18`, `list-animals.use-case.ts:8`, `update-animal.use-case.ts:12` | O tipo de domínio `Animal` é definido dentro de `create-animal.use-case.ts` e importado por `list-animals.use-case.ts`/`update-animal.use-case.ts` — dependência invertida (casos de uso de listagem/edição dependem do caso de uso de criação só para obter um tipo). | Extrair `Animal` para um arquivo próprio (ex. `animals/animal.ts`) e os 3 use cases importarem dali. |
| 3 | minor | `create-animal.use-case.ts:20-23`, `list-animals.use-case.ts:10-13`, `update-animal.use-case.ts:14-17`, `species/species.service.ts:14-17` | A mesma forma `{ data: T \| null; error: { message: string } \| null }` é redeclarada 4 vezes com nomes diferentes (`AnimalInsertResult`, `AnimalsListResult`, `AnimalUpdateResult`, `SpeciesListResult`). | Extrair um tipo genérico único (`SupabaseResult<T>`) em um módulo compartilhado e reusar nos 4 arquivos. |
| 4 | minor | `services/backend/src/animals/animals.controller.ts:36-40` | `AnimalsController` injeta 3 use cases (`create`/`update`/`list`), acima da diretriz de 2 variáveis de instância por classe (Calisthenics). Padrão comum de controller fino, mas vale registrar. | Se a lista crescer mais, considerar agrupar por operação; aceitável como está. |
| 5 | minor | `create-animal.dto.ts:6`, `update-animal.dto.ts:14` | O limite `120` de `MaxLength` é repetido como número mágico nos dois DTOs. | Extrair para uma constante compartilhada (`ANIMAL_NAME_MAX_LENGTH`). |
| 6 | minor | `services/frontend/src/lib/api/species.ts:21-29`, `services/frontend/src/components/animals/animal-form.tsx:76-81` | Duas instâncias do mesmo problema de tratamento de erro fraco no fluxo de espécies: (a) `listSpecies` sempre lança a mensagem genérica, nunca lê o corpo real do erro do backend — diferente de `createAnimal`/`updateAnimal`/`listAnimals` em `animals.ts`, que usam `extractErrorMessage`; (b) o `.catch()` do `useEffect` de `AnimalForm` que chama `listSpecies` não distingue `ApiError` de erro inesperado, ao contrário de `handleValidSubmit` no mesmo arquivo. | Extrair um helper único de extração de mensagem de erro em `lib/api` e reusar em `species.ts` também; no componente, aplicar a mesma distinção `instanceof ApiError` já usada em `handleValidSubmit`. |
| 7 | minor | `services/frontend/src/components/animals/animal-form.tsx` (useEffect sem `initialSpecies`, L71-82) | O caminho real de produção (`/admin/animais/novo`, `/admin/animais/[id]/editar` não passam `initialSpecies`) — carregamento de espécies via `listSpecies` e o branch de erro (`animal-form-species-error`) — tem 0% de cobertura automatizada; os 4 testes existentes sempre injetam `initialSpecies`. | Adicionar teste renderizando `<AnimalForm />` sem `initialSpecies`, mockando `listSpecies` (sucesso e falha). |
| 8 | minor | `services/frontend/src/components/animals/edit-animal-view.tsx:43-45` | O branch de erro genérico de `listAnimals` (distinto do caso "não encontrado") nunca é testado. | Adicionar teste com `listAnimalsMock.mockRejectedValue(...)`. |
| 9 | minor | `create-animal.dto.spec.ts`, `update-animal.dto.spec.ts` | A validação `@MaxLength(120)` de `name` não tem teste em nenhum dos dois DTOs. | Adicionar teste com `name` de 121+ caracteres em cada DTO. |
| 10 | minor | `services/backend/src/animals/use-cases/create-animal.use-case.ts:47-57`, `update-animal.use-case.ts:64-72` | Nenhuma das mutações administrativas novas (criar/editar/inativar animal) registra log de auditoria (quem/quando/o quê). | Emitir log estruturado (`userId`, ação, id do recurso) nos 3 use cases, se/quando o projeto adotar um padrão de auditoria — não bloqueante hoje. |
| 11 | minor | `create-animal.use-case.ts:47-57`, `update-animal.use-case.ts:64-72` | TOCTOU: `SpeciesService.exists` é checado e só depois o `insert`/`update` é enviado — janela onde a espécie poderia ser removida entre o check e a escrita. Risco baixo hoje (não existe CRUD de espécies ainda). | Documentar a suposição, ou revalidar via FK do banco quando o módulo de espécies ganhar delete. |
| 12 | minor | `services/frontend/src/components/animals/animals-list-view.tsx:130-138` | O botão "Inativar"/"Reativar" não tem `disabled`/guarda de requisição em andamento — duplo clique rápido dispara 2 PATCHs concorrentes com o mesmo payload (inofensivo hoje por idempotência do backend, mas desperdiça requisição e pode interagir com o achado #1). | Desabilitar o botão da linha enquanto aquele toggle está em voo. |
| 13 | suggestion | `services/backend/src/animals/use-cases/update-animal.use-case.ts` (44 linhas) | `execute()` mistura montagem de payload, validação condicional e persistência. Dentro dos limites já aprovados do projeto (CC≤10, ≤50 linhas/função — ambos verificados no fechamento das 3 PBIs), mas extraível para leitura. | Extrair `buildUpdatePayload`/`ensureHasFieldsToUpdate`, opcional. |
| 14 | suggestion | `services/frontend/src/components/animals/animal-form.tsx` | Branching por `isEditMode` em 5 pontos distintos; só o rótulo do botão foi extraído (`submitButtonLabel`). | Consolidar textos dependentes do modo numa função única, opcional. |
| 15 | suggestion | `services/backend/src/animals/dto/update-animal.dto.ts` | `UpdateAnimalDto` mistura edição de conteúdo (`name`/`species_id`) e status (`active`) no mesmo contrato — decisão já documentada e aprovada com o usuário (reuso do PATCH genérico, pbi-003). | Nenhuma ação — considerar comentário explicando a convivência dos campos. |
| 16 | suggestion | `services/backend/src/animals/use-cases/list-animals.use-case.ts` | `GET /animals` retorna a tabela inteira sem paginação — decisão já documentada como deliberada (EDICAO-10, escopo de listagem administrativa pequena). | Reconsiderar só se o volume crescer muito. |

## Cobertura dos critérios de aceite

Todos os 24 requisitos das 3 PBIs — **Verificado** (ver rastreabilidade completa em cada `spec.md`). Nenhum critério falhou.

## Notas de verificação

O achado #1 (major) foi verificado diretamente no código (`animals-list-view.tsx:106`, condição de render) — cenário de falha concreto: toggle falha → tabela inteira some, mesmo com dados já carregados. **CONFIRMED**.

Os achados que os passes 3/4 relataram como `major` — tipo `Animal` mal posicionado, 4 interfaces de resultado duplicadas, `execute()` de 44 linhas, e as lacunas de cobertura de teste em `AnimalForm`/`AnimalsListView` — foram reclassificados para `minor`/`suggestion` na consolidação: nenhum tem cenário de falha concreto (código organiza mal, mas funciona corretamente), e "cobertura insuficiente" é `minor` pela própria tabela de severidade deste skill — não `major`. A lacuna de cobertura do toggle de `AnimalsListView` foi absorvida no achado #1, já que o teste que faltava é exatamente o que teria pego o bug.

## Rodada de revisão 2

**Data**: 2026-09-11
**Modo**: PBI (3 PBIs juntas) · **Veredito**: APROVADO

### Resumo

Correção do único achado `major` da Rodada 1 (AnimalsListView escondia a lista inteira quando o toggle de ativo/inativo falhava). Verificado por teste automatizado dedicado ao mecanismo (não por um novo fan-out de subagentes independentes — ver ressalva de escopo abaixo) + suíte completa (frontend 106/106) + build/lint limpos.

### Rodada anterior — status do achado major

| # | Achado (rodada 1) | Status |
| - | - | - |
| 1 | major — `AnimalsListView` compartilhava o mesmo estado `error` entre a carga inicial da lista e o toggle de ativo/inativo de uma linha; uma falha de toggle escondia a tabela inteira já carregada | **Corrigido.** Estado `toggleError` separado, introduzido só para o resultado do toggle — nunca entra na condição de render da tabela (`!error && !isLoading && animals.length > 0`, inalterada). Teste novo (`shows a toggle-specific error without hiding the already-loaded table`) prova que a tabela permanece visível e o item já carregado continua exibido quando o toggle falha. |

### Ressalva de escopo (por continuidade da sessão)

O fix acima foi verificado pelo próprio orquestrador (teste automatizado novo e dedicado ao mecanismo, suíte completa, build e lint), sem uma segunda revisão adversarial independente via subagentes nesta rodada — mesma decisão já registrada nas Rodadas 2 de `pbi-002`/`pbi-003` do módulo de Autenticação. Recomenda-se uma Rodada 3 leve (só no arquivo tocado) numa sessão futura, se o rigor total for necessário antes de produção.

### Achados minor/suggestion remanescentes (não bloqueiam aprovação)

Os 11 achados `minor` + 4 `suggestion` da Rodada 1 seguem em aberto, documentados e não bloqueantes: tipo `Animal` mal posicionado; 4 interfaces de resultado do Supabase duplicadas; `AnimalsController` com 3 dependências injetadas; número mágico `120` repetido; tratamento de erro fraco no fluxo de espécies (`species.ts` + `AnimalForm`); lacunas de cobertura em `AnimalForm`/`EditAnimalView`/DTOs; ausência de log de auditoria; TOCTOU na validação de espécie; botão de toggle sem guarda contra duplo clique; `UpdateAnimalUseCase.execute()` extraível; branching de `isEditMode` inconsistente; `UpdateAnimalDto` misturando conceitos (decisão já aprovada); `GET /animals` sem paginação (decisão já aprovada).

### Cobertura dos critérios de aceite (atualizada)

Todos os 24 requisitos das 3 PBIs (ALTA-01..08, EDICAO-01..10, INATIVACAO-01..06) — **Verificado**. Nenhum critério de aceite foi afetado pelo achado major (era um bug de UI introduzido durante a implementação de `pbi-003`, fora do que qualquer CA testava diretamente, mas coberto agora por teste dedicado).

---

Próximo passo: módulo aprovado. Seguir para `makuco-documentation`.
