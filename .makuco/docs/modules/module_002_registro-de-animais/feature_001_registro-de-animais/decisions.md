# Log de Decisões — Registro de Animais

> Decisões detalhadas desta feature. Para resumo, veja `feature.md#Decisões Chave`.

## DEC-01 Inativação de animal como soft-delete

**Data:** 2026-09-10
**Status:** Aceita

**Contexto:** Era preciso decidir o que acontece com o registro de um animal quando ele deixa de estar disponível para adoção (ex.: já foi adotado, ou o cadastro foi feito por engano) — se o registro é removido do banco ou apenas marcado como inativo.

**Opções avaliadas:**
- A) Exclusão física do animal: mais simples de implementar, uma operação a menos para manter.
- B) Soft-delete via flag `ativo`/equivalente: registro nunca é apagado, apenas deixa de aparecer na futura vitrine pública; pode ser reativado depois.

**Escolha:** B — soft-delete via flag `ativo`.

**Motivo:** Preserva o histórico administrativo do animal e está alinhado à descrição do roadmap de produto, que fala explicitamente em inativar "sem apagar seu registro".

**Impactos:** Consultas que listam animais precisam considerar o filtro de `ativo`; a futura vitrine pública (módulo "Lista pública de animais disponíveis") deve exibir apenas animais ativos.

## DEC-02 Espécie como tabela própria mínima, não texto livre

**Data:** 2026-09-10
**Status:** Aceita

**Contexto:** Todo animal cadastrado precisa estar associado a uma espécie. Era preciso decidir se essa associação seria um campo de texto livre ou uma entidade própria, considerando que existe um módulo futuro no roadmap ("Registro de espécies") que assumirá a gestão completa desse domínio.

**Opções avaliadas:**
- A) Campo texto livre no cadastro do animal: mais rápido de implementar agora, sem tabela adicional.
- B) Tabela própria mínima (id + nome), populada por seed inicial, com o animal referenciando essa tabela: exige uma tabela e um seed, mas padroniza os valores.

**Escolha:** B — tabela própria mínima de espécies, com seed inicial.

**Motivo:** Evita re-trabalho e migração de dados quando o módulo futuro "Registro de espécies" assumir a gestão completa do domínio — o vínculo criado agora (animal → espécie por id) continua válido, apenas a gestão da tabela de espécies evolui de seed estático para CRUD completo. Também dá padronização e suporte a filtro/consistência que um campo texto livre não oferece.

**Impactos:** Esta feature não implementa cadastro/edição/inativação de espécies pelo admin — apenas a tabela mínima e o seed inicial. O módulo futuro "Registro de espécies" deve reusar a mesma tabela e o mesmo vínculo, sem quebrar a referência já criada pelos animais existentes.

## DEC-03 Padrões técnicos consolidados nas 3 PBIs — reuso de PATCH genérico para soft-delete, e listagem como pré-requisito implícito de CRUD administrativo

**Data:** 2026-09-11
**Status:** Aceita

**Contexto:** `pbi-002` (Edição de animal) e `pbi-003` (Inativação de animal) revelaram dois desvios do plano original que viraram decisões de mecanismo reaproveitáveis por módulos futuros — em especial "Registro de espécies", que repete o mesmo formato de cadastro administrativo simples com CRUD + soft-delete.

**Decisão 1 — Inativação/reativação reusa o PATCH genérico do recurso (`active?: boolean` no mesmo `UpdateAnimalDto`/`UpdateAnimalUseCase`/`PATCH /animals/:id`), em vez de um endpoint dedicado.**

`pbi-003` poderia ter criado `POST /animals/:id/inativar`. Optou por estender o `PATCH /animals/:id` já existente de `pbi-002`, sem endpoint novo.

**Motivo:** RN-02 trata a inativação como "só mais um campo do animal" — exatamente o que uma atualização parcial genérica já cobre. Um endpoint dedicado duplicaria guards, validação e e2e sem ganho real de clareza.

**Impacto:** Qualquer entidade futura que precise de soft-delete (ex.: espécies, no módulo "Registro de espécies") deve avaliar primeiro se o PATCH genérico do recurso já resolve, antes de desenhar uma ação/endpoint dedicado.

**Decisão 2 — Uma listagem (`GET /entidade`) é um pré-requisito implícito de qualquer CRUD administrativo com edição/inativação individual, mesmo quando nenhuma feature do roadmap menciona "listar" explicitamente.**

Nem `feature.md` nem o roadmap de produto (`scope_features_context.md`) previam uma tela de listagem de animais; ela só apareceu como gap identificado e confirmado com o usuário durante `pbi-002` (EDICAO-10) — sem ela, o admin não tinha como descobrir qual animal editar/inativar. De forma similar, `GET /species` (addendum a T5 de `pbi-001`) só existiu porque o formulário de cadastro precisava popular o seletor de espécies — a feature original previa apenas leitura interna de validação (`SpeciesService.exists`), não exposição via API.

**Motivo:** Qualquer referência a uma tabela — seja a entidade principal do CRUD, seja uma tabela de lookup como espécie — que alimenta uma tela/formulário precisa de um caminho de leitura enumerável, não apenas de validação pontual (`exists`).

**Impacto:** Ao planejar uma PBI de criação/edição que referencia outra entidade (FK) ou que terá edição/inativação individual numa PBI futura da mesma feature, incluir desde o início um endpoint de listagem (ou já prever explicitamente que ele virá numa PBI seguinte) — evita gap descoberto só durante a implementação. Débito aceito e documentado, não bloqueante: `GET /animals` não pagina, e não existe `GET /animals/:id` — a tela de edição descobre o animal filtrando o resultado de `listAnimals` pelo `id` da rota; reavaliar apenas se o volume de animais crescer.
