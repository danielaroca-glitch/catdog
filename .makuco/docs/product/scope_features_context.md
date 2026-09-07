# Detalhamento do Escopo Macro do Projeto

> **Como preencher:** descreva a visão geral do produto, liste os módulos na ordem em que serão entregues e detalhe as features de cada um. Para cada feature, escreva pelo menos 3 linhas — o que faz, para quem serve e qual valor entrega.
> **Caminho:** `02-systems/{sistema}/product/scope-features.md`
> **Próximo passo:** com este documento aprovado, cada feature vira uma spec em `specs/{modulo}/{feature}.md` gerada pelo `makuco-specify`.

---

## Visão Geral do Produto

CatDog é uma plataforma de adoção de animais usada por uma única ONG para centralizar a gestão dos animais disponíveis e das solicitações de adoção. Hoje esse processo acontece de forma manual, com divulgação em canais externos e interações descentralizadas por WhatsApp. Quando o projeto estiver completo, os administradores poderão registrar e gerenciar os animais e as solicitações em um único sistema, enquanto os clientes poderão consultar os animais disponíveis, filtrar opções, visualizar detalhes e solicitar adoção pela própria plataforma.

---

## Roadmap

| Ordem | Módulo | O que entrega ao negócio |
|---|---|---|
| 1 | Registro de animais | Centraliza o cadastro dos animais disponíveis em um único lugar, reduzindo dependência de controles manuais e melhorando a qualidade das informações exibidas aos interessados. |
| 2 | Lista pública de animais disponíveis | Cria uma vitrine única e acessível para que os clientes visualizem os animais aptos para adoção, com mais clareza e autonomia na busca. |
| 3 | Gestão de solicitações de adoção | Organiza internamente o processo de análise das solicitações, reduzindo perda, duplicidade e descontrole operacional da equipe da ONG. |
| 4 | Registro de espécies | Padroniza a classificação dos animais por espécie e apoia a organização do cadastro e da navegação pública com filtros mais consistentes. |

---

## Módulos e Features

---

### Módulo: Registro de animais

Este módulo permite que os administradores da ONG concentrem em um único sistema todas as informações dos animais disponíveis para adoção. Ele resolve o problema de dados dispersos e pouco padronizados, além de garantir que a vitrine pública tenha conteúdo confiável e atualizado para os clientes.

#### Feature: Alta de animal

Esta feature permite que o administrador cadastre um novo animal disponível para adoção dentro da plataforma. O cadastro reúne as informações necessárias para identificação e apresentação do animal aos clientes, evitando que esses dados fiquem espalhados em planilhas, mensagens ou publicações isoladas. O valor entregue é a criação de uma base centralizada e estruturada de animais aptos para adoção.

#### Feature: Edição de animal

Esta feature permite atualizar os dados de um animal já cadastrado sempre que houver necessidade de correção, complementação ou ajuste das informações exibidas. Ela atende o time administrativo, que precisa manter os registros coerentes com a realidade operacional da ONG. O valor de negócio está em manter a qualidade e confiabilidade do catálogo, evitando informações desatualizadas para os clientes.

#### Feature: Inativação de animal

Esta feature permite retirar um animal da lista de disponíveis sem apagar seu registro da plataforma. Ela é usada quando o animal deixa de estar apto para adoção, seja por adoção concluída, indisponibilidade temporária ou decisão interna da ONG. O valor entregue é o controle do que deve ou não aparecer ao público, preservando o histórico administrativo sem confundir os interessados.

#### Feature: Associação com espécie

Esta feature garante que cada animal cadastrado esteja vinculado a uma espécie previamente registrada no sistema. Ela é importante tanto para a organização interna quanto para a navegação do cliente, que poderá usar esse dado para localizar animais conforme seu interesse. O valor entregue é a padronização da informação e o suporte a filtros e classificações relevantes na vitrine pública.

---

### Módulo: Lista pública de animais disponíveis

Este módulo oferece ao cliente uma vitrine pública centralizada com os animais disponíveis para adoção. Ele resolve a dificuldade atual de descobrir quais animais estão realmente disponíveis e permite que os interessados tenham uma experiência mais clara, organizada e autônoma ao consultar as opções.

#### Feature: Listado de animais disponíveis

Esta feature apresenta ao público a relação de animais atualmente disponíveis para adoção. Ela serve aos clientes que desejam conhecer as opções da ONG em um único lugar, sem depender de publicações dispersas em redes sociais. O valor entregue é a visibilidade centralizada do portfólio de adoção, com acesso simples e contínuo aos animais ativos.

#### Feature: Búsqueda de animales

Esta feature permite que o cliente localize animais de forma mais rápida dentro da lista pública. Ela é útil para reduzir o esforço de navegação quando houver muitos registros disponíveis e para facilitar a descoberta de opções relevantes. O valor de negócio está em melhorar a usabilidade da vitrine pública e aumentar a chance de conversão do interesse em solicitação de adoção.

#### Feature: Filtros de animales

Esta feature permite refinar a lista pública com base em critérios como a espécie do animal. Ela atende clientes que já têm alguma preferência e precisam navegar de forma mais objetiva entre as opções disponíveis. O valor entregue é uma experiência de consulta mais eficiente, além de melhor aproveitamento das informações estruturadas no cadastro.

#### Feature: Detalle del animal

Esta feature permite que o cliente visualize as informações completas de um animal antes de iniciar uma solicitação de adoção. Ela existe para apoiar a decisão do interessado, oferecendo mais contexto sobre o animal selecionado e evitando contatos desnecessários por falta de informação básica. O valor entregue é maior clareza para o cliente e melhor qualidade das solicitações recebidas pela ONG.

---

### Módulo: Gestão de solicitações de adoção

Este módulo permite que a ONG acompanhe e analise de forma centralizada as solicitações de adoção recebidas pela plataforma. Ele resolve a perda de controle que hoje acontece quando os contatos chegam por canais externos, ajudando a equipe a visualizar o status decisório de cada solicitação e aplicar as regras definidas pela organização.

#### Feature: Criação de solicitação de adoção

Esta feature permite que o cliente registre uma solicitação de adoção a partir da ficha de um animal disponível. Ela substitui o início do processo por mensagens soltas em canais externos e concentra a manifestação de interesse no próprio sistema. O valor entregue é a captura estruturada da solicitação, ligada diretamente ao animal desejado.

#### Feature: Consulta de solicitações

Esta feature permite que os administradores visualizem as solicitações recebidas e acompanhem internamente o que precisa ser analisado. Ela atende a necessidade operacional de ter uma visão organizada da demanda, sem depender de múltiplas conversas em WhatsApp. O valor entregue é controle administrativo centralizado e redução de perda ou duplicidade de atendimento.

#### Feature: Revisão por administrador

Esta feature permite que a equipe administrativa analise cada solicitação de adoção de forma manual, conforme o processo da ONG. Ela é importante porque a decisão não é automática e depende da avaliação feita internamente pelos responsáveis. O valor entregue é manter o processo decisório alinhado às regras reais da organização, mesmo sem automatizar o contato posterior com o cliente.

#### Feature: Aprovação ou rejeição de solicitação

Esta feature permite que o administrador registre formalmente a decisão sobre uma solicitação recebida. Pela regra do negócio, um animal só pode ter uma solicitação ativa por vez; se a solicitação for rejeitada, ele poderá voltar a receber nova solicitação futuramente. O valor entregue é o controle claro da disponibilidade do animal e da fila de interesse associada a ele.

---

### Módulo: Registro de espécies

Este módulo mantém a lista de espécies usada no cadastro dos animais e na navegação pública da plataforma. Ele resolve a necessidade de padronizar essa informação de domínio, evitando variações livres que prejudiquem a organização administrativa e a experiência de filtro dos clientes.

#### Feature: Alta de espécie

Esta feature permite cadastrar uma nova espécie no sistema para posterior associação aos animais. Ela é usada pelos administradores e garante que o domínio básico do produto seja controlado de forma estruturada, em vez de preenchido livremente a cada cadastro. O valor entregue é padronização e consistência da informação.

#### Feature: Edição de espécie

Esta feature permite corrigir ou ajustar o nome de uma espécie já cadastrada quando houver erro ou necessidade de padronização. Ela atende a administração do sistema e evita a propagação de nomenclaturas incorretas nos registros de animais. O valor entregue é manter a base organizada e coerente para uso interno e público.

#### Feature: Inativação de espécie

Esta feature permite desativar uma espécie para que deixe de ser utilizada em novos cadastros, sem necessariamente apagar seu histórico de uso. Ela é importante para preservar consistência dos registros já existentes e, ao mesmo tempo, impedir o uso futuro de classificações que não façam mais sentido. O valor entregue é governança simples sobre o domínio de espécies.

---

## Fora do Escopo

| Item excluído | Motivo |
|---|---|
| Pagamentos | Não faz parte do processo de adoção definido para a primeira versão da plataforma. |
| Gestão de mensagens, notificações e e-mails | O contato com o interessado continuará acontecendo fora do sistema, com uso de canais externos pela ONG. |
| Integração com Facebook e WhatsApp | O objetivo inicial é centralizar o controle interno e a vitrine, não automatizar canais externos. |
| Chat interno | Não faz parte do fluxo previsto para a primeira versão e aumentaria a complexidade sem resolver o foco principal do projeto. |
| App mobile | A primeira versão será focada na experiência web e no controle centralizado básico da operação. |
| Login social | Não é essencial para validar o fluxo principal de consulta de animais e solicitação de adoção. |
| Suporte a múltiplas organizações | O sistema será usado por apenas uma ONG, sem necessidade de operação multi-inquilino nesta fase. |
