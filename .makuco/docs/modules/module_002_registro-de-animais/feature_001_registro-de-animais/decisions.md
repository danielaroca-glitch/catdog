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
