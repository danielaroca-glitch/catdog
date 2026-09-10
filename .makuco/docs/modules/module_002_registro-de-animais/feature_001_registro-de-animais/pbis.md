---
stage: structure
feature: registro-de-animais
created_at: 2026-09-10
status: done
---

# Estrutura — Registro de Animais

## Objetivo da feature

Cadastro centralizado de animais disponíveis para adoção pelos administradores da ONG (Alta, Edição, Inativação), com espécie obrigatória vinda de uma tabela mínima seedada — substitui o controle disperso em planilhas/mensagens.

## PBIs

### alta-de-animal — Alta de animal

**Descrição:** Administrador cadastra um novo animal, com dados básicos e espécie obrigatória (de lista seedada).
**Depende de:** nenhum

### edicao-de-animal — Edição de animal

**Descrição:** Administrador atualiza os dados de um animal existente, incluindo trocar a espécie associada.
**Depende de:** alta-de-animal (conceitualmente — testável isolado com dado seedado)

### inativacao-de-animal — Inativação de animal

**Descrição:** Administrador inativa (soft-delete) ou reativa um animal, sem apagar seu registro.
**Depende de:** alta-de-animal (conceitualmente — testável isolado com dado seedado)

## Justificativa da decomposição

O roadmap de produto (`.makuco/docs/product/scope_features_context.md`) lista 4 features para este módulo, incluindo "Associação com espécie" como item separado. Na decomposição em PBIs, essa 4ª feature foi fundida dentro de Alta de animal e Edição de animal, porque RN-03 (espécie obrigatória e válida em todo cadastro) torna a associação um campo obrigatório da criação/edição, não um passo independente e testável isoladamente — como feature própria, falharia o critério Independent do INVEST (não haveria valor perceptível em "associar espécie" sem que a alta ou a edição já existissem). A divisão final segue as 3 operações naturais do CRUD administrativo (criar, editar, inativar), cada uma entregando incremento observável e testável isoladamente (com dado seedado quando a etapa anterior ainda não está implementada) — mesmo racional de decomposição já usado no módulo de Autenticação e Autorização.

---

Próximo passo rode `makuco-desenvolver` no primeiro PBI.
