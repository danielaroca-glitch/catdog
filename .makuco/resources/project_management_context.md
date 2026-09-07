# Gestão do Projeto e Ciclo de Desenvolvimento

> **Como preencher:** registre aqui como o projeto é gerenciado — onde o trabalho vive, como está organizado e como o time opera no dia a dia. Qualquer pessoa que entre no projeto deve conseguir entender o fluxo de trabalho lendo este documento.
> **Caminho:** `02-systems/{sistema}/management/project-management.md`

---

## Plataforma de Gestão

**Plataforma:** GitHub
**URL / Acesso:** Ainda não foi criado
**Como solicitar acesso:** Solicitar ao responsável pelo repositório ou organização no GitHub quando a estrutura do projeto estiver disponível

---

## Modelo de Organização do Trabalho

> Defina o significado de cada nível da hierarquia de trabalho neste projeto. Sem essa definição, cada pessoa do time interpreta os conceitos de forma diferente.

| Nível | Nome utilizado | O que representa | Exemplo |
|---|---|---|---|
| 1 — mais alto | Task | Unidade principal de trabalho registrada no projeto | Criar tela de login |
| 2 | Não definido | Não há segundo nível formal definido até o momento | Não se aplica |
| 3 | Não definido | Não há terceiro nível formal definido até o momento | Não se aplica |
| 4 — mais baixo | Não definido | Não há quarto nível formal definido até o momento | Não se aplica |

---

## Tamanho e Critérios de um PBI

> O tamanho máximo de um PBI define o ritmo de entrega e a capacidade de revisão do time. Estabeleça limites claros para evitar PBIs que duram semanas.

**Tamanho máximo:** Ainda não foi formalmente definido. Como o time é pequeno, as tasks devem ser mantidas simples e objetivas.

**Um bom PBI deve:**
- Ter pelo menos um critério de aceite claro
- Poder ser executado de forma objetiva pelo time
- Representar uma entrega compreensível e verificável
- Ser pequeno o suficiente para acompanhamento em equipe reduzida

**Um PBI deve ser quebrado quando:**
- Ficar grande demais para acompanhamento simples
- Misturar mais de uma responsabilidade principal
- Não permitir validação clara do resultado

---

## Modelo de Desenvolvimento

**Metodologia:** Kanban

**Duração do ciclo:** Sem sprints formais

**Início do ciclo:** Fluxo contínuo, sem início de ciclo fixo

---

## Cerimônias e Rituais

> Liste apenas as cerimônias que este time realmente pratica. Remova as que não se aplicam.

| Cerimônia | Frequência | Duração | Objetivo |
|---|---|---|---|
| Daily | Diária | 15min | Sincronizar o time e identificar bloqueios |
| Planning | Conforme necessidade | Não definido | Planejar o trabalho mais próximo |
| Review | Conforme necessidade | Não definido | Revisar entregas realizadas |
| Retrospectiva | Conforme necessidade | Não definido | Identificar melhorias no processo |
| Refinamento | Conforme necessidade | Não definido | Detalhar próximas tasks |

---

## Fluxo de Status

> Defina os status que um item percorre desde a criação até a entrega. Mapeie exatamente como está configurado na plataforma de gestão.

| Status | Descrição | Quem move para cá |
|---|---|---|
| Backlog | Item criado mas ainda não iniciado | PO ou responsável pela priorização |
| Para desenvolver | Item priorizado e pronto para execução | PO ou time |
| Em desenvolvimento | Item em execução | Pessoa responsável pela task |
| Review | Item concluído tecnicamente e aguardando validação | Pessoa responsável pela task |
| Done | Item finalizado e aceito | PO |

---

## Definição de Pronto (Definition of Done)

> Um item só pode ser marcado como Done quando todos os critérios abaixo forem atendidos. Esta lista é do time — ajuste conforme a realidade do projeto.

- Pelo menos um critério de aceite deve estar cumprido
- O resultado da task deve estar verificável pelo time ou PO
- O item deve estar em condição de ser considerado concluído no fluxo

---

## Acompanhamento e Monitoramento

**Responsável pelo acompanhamento:** PO

**Métricas acompanhadas:**

| Métrica | O que mede | Onde é acompanhada | Frequência |
|---|---|---|---|
| Quantidade de tasks concluídas | Volume de trabalho finalizado | GitHub, quando disponível | Conforme necessidade |
| Itens em andamento | Trabalho atualmente em execução | GitHub, quando disponível | Conforme necessidade |

**Reporte para stakeholders:** Ainda não foi definido um formato formal de reporte para stakeholders
