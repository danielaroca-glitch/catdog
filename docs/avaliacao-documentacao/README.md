# Avaliação de qualidade da documentação

Avaliação dos artefatos de especificação e documentação do projeto (`.makuco/docs/`), com critério explícito e evidência verificável — não uma nota atribuída sem justificativa.

## Critério de avaliação

Cada categoria de artefato é avaliada em 5 dimensões, 0–2 pontos cada (máximo 10):

| Dimensão | O que mede |
| --- | --- |
| **Completude** | Todas as seções obrigatórias do template preenchidas, sem placeholder |
| **Rastreabilidade** | Todo requisito/critério de aceite mapeado a uma task e a uma evidência de teste |
| **Especificidade** | Critérios escritos em formato verificável (WHEN/THEN/SHALL ou equivalente), não vagos |
| **Consistência** | Sem campos desatualizados ou contraditórios entre documentos irmãos |
| **Verificabilidade** | Decisões e achados citam arquivo/linha real ou resultado de teste real, não afirmações genéricas |

## Resultado por categoria

| Categoria | Artefatos | Nota | Evidência |
| --- | --- | --- | --- |
| Spec de PBI (`spec.md`) | 6 (3 por feature) | 9 | 58 requisitos ao todo, cada um normalizado em WHEN/THEN/SHALL, com ID de rastreabilidade e status `Verificado` na tabela de cobertura; cenários e2e nomeando os requisitos que cobrem |
| Tasks de PBI (`task.md`) | 6 | 9 | Todo task com `Where`/`Depends on`/`Tests`/`Gate`/`Done when`; checklist de granularidade, cross-check diagrama×dependências e co-localização de testes, todos fechados antes da aprovação |
| Decisões (`decisions.md`) | 2 (1 por feature) | 9 | 6 decisões arquiteturais registradas (3 por feature) no formato Contexto/Opções avaliadas/Escolha/Motivo/Impactos, cada uma citando o achado ou a lição que a motivou |
| Code review (`review.md`) | 2 | 9 | Achados `critical`/`major` verificados individualmente (veredito CONFIRMED/PLAUSIBLE/REFUTED) antes de entrar no relatório, citando arquivo+linha; achados sem cenário de falha concreto rebaixados na consolidação |
| Aprendizados (`learnings.md`) | 4 | 8 | Decisões técnicas, desvios do plano original e achados de review documentados por PBI, com referência ao commit/arquivo que resolveu cada um |
| Contexto de codebase (`.makuco/docs/codebase/`) | 8 arquivos + 4 módulos | 8 | Cobertura completa dos 7 arquivos técnicos exigidos pelo processo + mapa de módulos por capacidade de negócio, toda afirmação lastreada em arquivo/config real lido |

## Nota geral

**8,7 / 10** — nenhuma categoria abaixo de 8.

O ponto mais forte é rastreabilidade: todo requisito de todo PBI tem um ID único, aparece na tabela de cobertura do spec e é referenciado de volta pela task ou pelo cenário e2e que o verifica — não há requisito "solto". O ponto de atenção (categorias em 8, não 9) é que `learnings.md` e o contexto de codebase descrevem o sistema num ponto no tempo e exigem atualização manual a cada mudança relevante, em vez de serem gerados automaticamente a partir do código a cada execução.
