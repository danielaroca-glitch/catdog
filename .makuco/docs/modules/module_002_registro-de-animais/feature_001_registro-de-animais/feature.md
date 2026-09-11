---
stage: feature
feature: registro-de-animais
created_at: 2026-09-10
status: done
---

# Feature: Registro de Animais

**ID:** feature_001 (local)
**Data:** 2026-09-10
**Responsável:** Não definido (ver `MAKUCO.md` — `analise.aprovador: nenhum`)
**Status:** Aprovada e documentada (3/3 PBIs concluídas)

---

## Problema / Oportunidade

Hoje não existe lugar centralizado para os administradores da ONG cadastrarem os animais disponíveis para adoção — dados dispersos em planilhas/mensagens, sem padronização, prejudicando a qualidade das informações exibidas aos interessados.

## Solução Proposta

CRUD padrão de animais (Alta, Edição, Inativação, Associação com espécie) exposto apenas a administradores, reusando o guard de papel (`RolesGuard`/`@Roles('admin')`) já entregue no módulo de Autenticação e Autorização — nenhum mecanismo novo de autorização é criado aqui.

## Regras de Negócio

1. RN-01: Somente um administrador autenticado pode criar, editar, inativar um animal ou associar/alterar sua espécie.
2. RN-02: Inativar um animal NUNCA apaga seu registro — é um soft-delete (flag `ativo`/equivalente), que apenas remove o animal da futura vitrine pública; o registro pode ser reativado depois.
3. RN-03: Todo animal cadastrado precisa estar associado a uma espécie válida e previamente registrada — não é permitido cadastro sem espécie.
4. RN-04: A lista de espécies desta feature é mantida como uma tabela própria mínima (id + nome), populada por seed inicial — não é o módulo completo de gestão de espécies (esse é um módulo futuro do roadmap, "Registro de espécies"). O vínculo criado aqui não deve exigir migração quando esse módulo futuro assumir a gestão completa do domínio.

## Escopo

### IN — O que esta feature entrega
- Alta de animal
- Edição de animal
- Inativação de animal (soft-delete)
- Associação com espécie (tabela mínima + seed)

### OUT — O que NÃO está incluído nesta feature
- Vitrine pública de animais (módulo futuro "Lista pública de animais disponíveis")
- Gestão de solicitações de adoção (módulo futuro)
- CRUD completo de espécies — cadastro/edição/inativação de espécies pelo admin (módulo futuro "Registro de espécies")
- Upload/gestão de fotos do animal (não mencionado no roadmap; considerar campo simples de URL se necessário, sem pipeline de upload)

## Critérios de Sucesso

| Métrica | Baseline atual | Meta | Prazo |
|---|---|---|---|
| Animais informados pela ONG cadastrados na plataforma com espécie associada | 0% | 100% | Entrega da feature |

## Premissas e Decisões de Produto

| # | Decisão / Premissa | Justificativa |
|---|---|---|
| 1 | Reusa a infraestrutura de autenticação/autorização já entregue (Supabase Auth + `profiles` + `RolesGuard`) sem nenhuma mudança nela | Evita duplicar mecanismo de autorização já validado no módulo de Autenticação |
| 2 | Banco de dados Supabase Postgres | Decisão de stack já tomada, mesma do módulo de Autenticação |

## Decisões Chave

> Resumo das principais escolhas de abordagem desta feature. Detalhamento completo em `decisions.md`.

| # | Decisão | Alternativas descartadas | Motivo da escolha |
|---|---|---|---|
| 1 | Inativação de animal = soft-delete (campo `ativo`), nunca exclusão física | Exclusão física (mais simples) | Preserva histórico administrativo; alinhado à descrição do roadmap de produto, que fala em "sem apagar seu registro" |
| 2 | Espécie = tabela própria mínima (id+nome) com seed inicial, não texto livre | Campo texto livre | Evita re-trabalho/migração quando o módulo futuro "Registro de espécies" assumir a gestão completa do domínio |

## Alternativas Consideradas e Rejeitadas

> Alimentado pelo brainstorming/discovery — o que foi explorado e descartado.

| Alternativa | Por que foi considerada | Por que foi descartada |
|---|---|---|
| Exclusão física do animal ao inativar | Mais simples de implementar | Perde histórico e contradiz a descrição do roadmap de produto, que fala em "sem apagar seu registro" |
| Espécie como campo texto livre | Mais rápido de implementar agora | Sem padronização e sem suporte a filtro/consistência |

## Dependências

- Módulo `Autenticação e Autorização` já entregue (guards `JwtAuthGuard`/`RolesGuard`, tabela `profiles`) — nenhuma dependência de módulo futuro.

## Referências

- Decisões detalhadas: `decisions.md`

---

Próximo passo: rode `makuco-analisar` (passo 05) para decompor a feature em PBIs.
