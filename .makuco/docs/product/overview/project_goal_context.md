# Objetivo do Projeto

---

## Identificação do Sistema

**Nome do sistema:** CatDog

**Status:** Por iniciar

**Repositório de código:** Ainda não existe repositório definido.

**Última atualização:** 2026-06-15 — Daniela

### Ambientes

| Ambiente | URL |
|---|---|
| Desenvolvimento | Ainda não definido |
| Homologação | Ainda não definido |
| Produção | Ainda não definido |

---

## Problema a Ser Resolvido

**Situação atual:** Atualmente, a adoção dos animais é operada de forma distribuída e manual, principalmente por publicações em grupos ou páginas no Facebook e por conversas no WhatsApp. Os animais disponíveis não estão organizados em um catálogo único e atualizado, o que dificulta a visualização por parte dos interessados. Ao mesmo tempo, as solicitações de adoção chegam por canais externos e ficam espalhadas entre conversas, o que torna a gestão operacional confusa para a equipe da ONG.

**Causa raiz:** O problema existe porque a organização não possui um sistema próprio para registrar os animais, centralizar sua vitrine pública e controlar internamente as solicitações de adoção. Como consequência, o processo depende de ferramentas genéricas de comunicação, sem estrutura para rastreabilidade, organização ou acompanhamento interno padronizado.

**Impacto:** Os três administradores da ONG perdem tempo organizando informações manualmente, correm risco de perder solicitações ou tratá-las de forma duplicada e não conseguem visualizar tudo em um único fluxo interno. Os clientes também são impactados, porque não têm um local centralizado para consultar os animais disponíveis com clareza, buscar por critérios e entender melhor cada animal antes de manifestar interesse.

---

## Objetivo do Projeto

**Onde devemos chegar com o projeto entregue:**

- Ter 100% dos animais disponíveis visíveis em um catálogo único e centralizado.
- Eliminar o controle das solicitações de adoção via WhatsApp como mecanismo principal de gestão.
- Permitir acompanhamento interno centralizado das solicitações pela equipe administradora da ONG.
- Reduzir a perda e a duplicidade de solicitações de adoção.

---

## Visão Geral do Sistema

### Propósito

CatDog é uma plataforma de adoção de animais usada por uma única ONG para centralizar o cadastro de animais e o controle das solicitações de adoção. O sistema terá uma vitrine pública para os clientes visualizarem os animais disponíveis e uma área administrativa para o time interno organizar os registros e acompanhar as solicitações. Seu propósito é substituir a operação manual hoje feita em redes sociais e WhatsApp por um fluxo centralizado e rastreável.

### Público-Alvo e Usuários

**Perfil 1 — Administrador da ONG**  
Descrição: membro da equipe interna responsável pela operação de adoção dentro da organização. Atua no cadastro e manutenção dos animais e no acompanhamento administrativo das solicitações.  
O que faz e quando faz: registra animais, edita informações, inativa registros quando necessário, cadastra espécies e revisa manualmente as solicitações de adoção, podendo aprová-las ou rejeitá-las conforme a análise interna da ONG.

**Perfil 2 — Cliente / Interessado em adoção**  
Descrição: pessoa externa à ONG que procura um animal para adoção e acessa a plataforma para consultar os animais disponíveis.  
O que faz e quando faz: navega pela lista pública de animais, busca e filtra resultados, visualiza detalhes de cada animal e registra uma solicitação de adoção quando identifica um animal de interesse.

**Perfil 3 — Stakeholder gestora da ONG**  
Descrição: responsável pela organização e pela orientação de negócio do projeto, com interesse direto no funcionamento da operação de adoção.  
O que faz e quando faz: acompanha as necessidades do processo, define prioridades de negócio e valida se o sistema atende à operação da ONG e às expectativas de organização do fluxo de adoção.

### Contexto de Mercado e Posicionamento

**Contexto de mercado:** O sistema atua no segmento de adoção de animais e apoio operacional a ONGs de proteção animal. Nesse contexto, muitas organizações pequenas ainda operam com processos manuais e comunicação distribuída em redes sociais e aplicativos de mensagem, o que gera baixa organização operacional.

**Posicionamento:** CatDog não foi concebido como um marketplace amplo nem como uma plataforma multi-organização. Seu posicionamento é o de uma solução simples e dedicada à operação de uma única ONG, com foco em centralizar catálogo de animais e controle administrativo das solicitações de adoção.

**Público-alvo de mercado:** O sistema se destina, neste projeto, à operação específica de uma única ONG de adoção animal, atendendo tanto a equipe administradora quanto os interessados em adoção que consultam os animais disponíveis.

### Contexto de Uso pelo Cliente

A ONG utilizará o CatDog no dia a dia para registrar os animais disponíveis para adoção, manter essas informações atualizadas e controlar internamente as solicitações recebidas. Os clientes usarão a plataforma para consultar os animais em uma lista pública centralizada, com possibilidade de busca, filtro e visualização de detalhes. O sistema substituirá a dependência operacional de Facebook e WhatsApp para organização interna, embora o contato direto e a continuidade da conversa com o interessado ainda aconteçam fora da plataforma.

---

## Contexto de Negócio

**Sobre o negócio:** CatDog é uma plataforma criada para apoiar a operação de uma ONG de adoção animal. O projeto busca organizar digitalmente um processo que hoje é manual, descentralizado e dependente de canais informais de comunicação.

**Domínio e segmento:** O sistema está inserido no domínio de adoção de animais e gestão operacional de solicitações de adoção dentro de uma organização do terceiro setor.

**Processo atual (como as pessoas fazem hoje):** Hoje a ONG publica os animais no Facebook. Quando uma pessoa se interessa, entra em contato via WhatsApp. Uma administradora revisa manualmente esse interesse e o acompanhamento seguinte continua fora de qualquer sistema estruturado, por mensagens e interações externas.

**Restrições e regras de negócio relevantes:** Apenas administradores podem cadastrar e gerenciar animais e espécies. Cada animal deve estar obrigatoriamente associado a uma espécie. As solicitações de adoção são revisadas manualmente pela equipe da ONG. O contato e o avanço da conversa com o adotante acontecem fora do sistema. Não haverá automação de mensagens, notificações, e-mails ou gestão do processo de comunicação com o interessado dentro da plataforma. O sistema atenderá apenas uma única organização.

---

## Escopo Macro do Projeto

| # | Módulo / Epic | Prioridade |
|---|---|---|
| 1 | Registro de animais | Alta |
| 2 | Lista pública de animais disponíveis | Alta |
| 3 | Gestão de solicitações de adoção | Alta |
| 4 | Cadastro de espécies | Média |

---

## Escopo Negativo do Projeto

| O que não será feito | Motivo |
|---|---|
| Pagamentos dentro da plataforma | Não faz parte do processo atual da ONG e não é necessário para a primeira versão. |
| Gestão da comunicação com interessados por mensagens, notificações ou e-mail | O contato continuará sendo feito por canais externos; o sistema terá apenas controle interno administrativo. |
| Suporte a múltiplas organizações | O projeto foi definido para atender apenas uma única ONG. |

---

## Pessoas e Interesses (Stakeholders)

| Nome | Empresa / Área | Papel no Projeto |
|---|---|---|
| Maria | ONG CatDog / Direção | Dona da ONG / patrocinadora de negócio |
| Daniela | Desenvolvimento | Desenvolvedora / responsável pela documentação |

---