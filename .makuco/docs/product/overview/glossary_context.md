# Glossário do Projeto

> **Como preencher:** registre aqui todos os termos do domínio de negócio que qualquer pessoa do time precisa conhecer para trabalhar neste projeto. Ordene alfabeticamente.
> **Caminho:** `02-systems/{sistema}/context/glossary.md`
> **Regra de ouro:** se alguém de fora do negócio não entendesse um termo nas conversas, nos requisitos ou nas telas, ele deve estar aqui.

---

## Termos do Domínio

> Escreva definições completas — o que é o termo, como funciona no contexto do negócio e quem o usa. Evite definições de uma linha.
> **Exemplo:** _Pedido — solicitação de compra com 1 ou mais produtos, realizada por um Cliente. Passa pelos seguintes status: Rascunho → Confirmado → Em separação → Entregue. Um pedido cancelado não pode ser reativado._

| Termo | Tradução EN | Definição | Evitar (sinônimos incorretos) |
|---|---|---|---|
| Administrador | Administrator | Usuário interno da ONG com permissão para operar o sistema CatDog. É responsável por cadastrar e editar animais, inativar registros quando necessário, manter o cadastro de espécies e revisar manualmente as solicitações de adoção, podendo aprová-las ou rejeitá-las conforme as regras e decisões da organização. | Não há termos a evitar definidos |
| Animal | Animal | Indivíduo registrado no sistema que pode ser disponibilizado para adoção, como um cachorro, gato ou outro tipo de animal aceito pela ONG. O animal é a entidade central da vitrine pública e do processo de adoção, sempre vinculado a uma espécie e usado tanto por administradores quanto por clientes durante consulta e solicitação. | Não há termos a evitar definidos |
| Animal disponível | Available animal | Animal que está apto para adoção e pode aparecer na lista pública para consulta dos clientes. No contexto do CatDog, um animal disponível pode receber solicitação de adoção, respeitando a regra de que só pode existir uma solicitação ativa por vez para cada animal. | Não há termos a evitar definidos |
| Cliente | Customer / Adopter applicant | Pessoa externa à ONG que acessa a plataforma para consultar os animais disponíveis e registrar uma solicitação de adoção. No contexto do sistema, o cliente interage com a vitrine pública, pode buscar, filtrar e ver detalhes dos animais, e manifesta interesse diretamente pela plataforma. | Não há termos a evitar definidos |
| Espécie | Species | Categoria biológica associada a cada animal cadastrado, como cachorro, gato ou coelho. A espécie é mantida por administradores em um cadastro próprio e serve tanto para padronizar a informação interna quanto para permitir filtros de navegação na lista pública de animais. | Não há termos a evitar definidos |
| Solicitação aprovada | Approved adoption request | Solicitação de adoção que foi analisada manualmente pela equipe da ONG e recebeu decisão positiva. Esse status indica que, no controle interno do sistema, a manifestação de interesse foi aceita pela organização para seguir conforme o processo adotado fora da plataforma. | Não há termos a evitar definidos |
| Solicitação de adoção | Adoption request | Pedido realizado por um cliente interessado em adotar um animal específico disponível na plataforma. A solicitação é criada a partir da ficha do animal, revisada manualmente por um administrador e faz parte do controle interno da ONG, mesmo que o contato posterior com o interessado continue fora do sistema. | Não há termos a evitar definidos |
| Solicitação rejeitada | Rejected adoption request | Solicitação de adoção que foi negada após análise da equipe administradora. Quando uma solicitação é rejeitada, o animal pode voltar a receber uma nova solicitação, conforme a regra do sistema de permitir apenas uma solicitação ativa por vez. | Não há termos a evitar definidos |

---

## Status e Ciclos de Vida

> Liste os status de cada entidade principal do sistema e o fluxo entre eles. Essencial para que o time entenda as transições permitidas e as regras de negócio associadas.

### Animal

Os animais cadastrados no CatDog representam os registros que podem ou não estar disponíveis para adoção pública. Seu ciclo de vida indica se o animal ainda pode receber interesse de clientes ou se já foi adotado.

| Status | Descrição | Transições permitidas |
|---|---|---|
| Disponível | Animal apto para adoção e visível para consulta pública pelos clientes. | Pode avançar para Adotado |
| Adotado | Animal cuja adoção foi concluída e que não deve mais receber novas solicitações. | Não possui transições previstas |

### Solicitação de adoção

A solicitação de adoção representa a manifestação de interesse de um cliente por um animal específico. Ela é analisada manualmente pela ONG e determina se o animal poderá seguir no processo com aquele interessado ou voltar a receber novas solicitações.

| Status | Descrição | Transições permitidas |
|---|---|---|
| Em revisão | Solicitação criada e aguardando análise manual da equipe administradora. | Pode avançar para Aprovada ou Rejeitada |
| Aprovada | Solicitação aceita pela ONG após análise interna. | Não possui transições previstas |
| Rejeitada | Solicitação negada pela ONG após análise interna. Quando isso ocorre, o animal pode voltar a receber nova solicitação. | Não possui transições previstas |

---

## Relações Entre Termos

> Descreva como os principais conceitos se relacionam — hierarquias, dependências e regras de associação. Uma frase por relação é suficiente.
> **Exemplo:** _"Um Pedido contém 1 ou mais Itens de Pedido. Um Item de Pedido pertence a exatamente 1 Pedido e referencia 1 Produto."_

- Um animal pertence a uma espécie.
- Um cliente cria uma solicitação de adoção para um animal.
- Um administrador revisa uma solicitação de adoção.
- Um animal só pode ter uma solicitação ativa por vez.

---

## Siglas e Abreviações

> Apenas siglas do negócio ou da empresa — não registre siglas técnicas universais.

Não há siglas ou abreviações específicas do negócio registradas até o momento.

---

## Histórico de Alterações

> Mudanças de nomenclatura afetam o time inteiro — registre para rastreabilidade.

| Data | Termo | Alteração | Motivo |
|---|---|---|---|
| 2026-06-15 | Administrador, Animal, Animal disponível, Cliente, Espécie, Solicitação de adoção, Solicitação aprovada, Solicitação rejeitada | Adicionado | Criação inicial do glossário do projeto CatDog |
