# Definição de Arquitetura

> **Como preencher:** registre aqui o padrão arquitetural adotado para este sistema e a justificativa da escolha. Seja direto — o objetivo é que qualquer pessoa do time entenda como o sistema está estruturado e por que.
> **Caminho:** `02-systems/{sistema}/architecture/architecture-definition.md`
> **Divergências dos padrões organizacionais** devem ser registradas como ADR em `architecture/adr/`.

---

## Padrão Arquitetural Adotado

**Padrão:** Monólito modular em monorepo, com frontend e backend separados por aplicação

**Justificativa:** O sistema será desenvolvido por um time reduzido, para atender uma única ONG e com escopo inicial relativamente enxuto. Nesse contexto, um monólito modular reduz a complexidade operacional e acelera a entrega, ao mesmo tempo em que mantém separação clara entre domínios do backend e entre as aplicações de frontend e backend. O uso de monorepo facilita o trabalho coordenado da equipe, centraliza a base de código e simplifica a evolução conjunta da plataforma.

---

## Como o Sistema está Organizado

O sistema será organizado em um monorepo com duas aplicações principais: um frontend web em Next.js e um backend em NestJS. O frontend consumirá diretamente uma API REST exposta pelo backend. No backend, o código será dividido por módulos de domínio, incluindo animais, espécies, solicitações e autenticação. O Supabase será usado como base de dados, storage de arquivos e serviço de autenticação.

---

## Decisões Arquiteturais Importantes

| Decisão | O que foi decidido | Justificativa |
|---|---|---|
| Estrutura do sistema | Adotar um monólito modular em monorepo com frontend e backend separados por aplicação | Atende bem um time pequeno, reduz complexidade de operação e permite evolução organizada sem o custo de microserviços |
| Organização do backend | Estruturar o backend NestJS por módulos de domínio como animais, espécies, solicitações e autenticação | Mantém separação de responsabilidades e facilita manutenção e crescimento do sistema |
| Integração entre aplicações | O frontend Next.js consumirá diretamente uma API REST do backend | Simplifica a comunicação entre camadas e favorece uma separação clara entre interface e regras de negócio |
| Persistência e arquivos | Utilizar Supabase como banco de dados e storage | Centraliza recursos essenciais da solução em uma mesma plataforma e reduz esforço inicial de infraestrutura |
| Autenticação | Utilizar Supabase Auth para autenticação de usuários | Acelera a implementação de acesso autenticado e evita construir do zero uma camada sensível de autenticação |
| Escopo operacional | Manter a plataforma focada em uma única ONG e sem gestão de contato dentro do sistema | A arquitetura prioriza simplicidade e aderência ao escopo real do produto nesta fase inicial |

---

## Diagramas

**C1 — Contexto:** Pendente — diagrama ainda não existente
**C2 — Containers:** Pendente — diagrama ainda não existente
**C3 — Componentes:** Pendente — diagrama ainda não existente

---

> **Lembrete:** este documento descreve a intenção arquitetural. Quando houver divergência entre o que está aqui e o que está no código, o código deve ser corrigido — ou este documento deve ser atualizado com um ADR justificando a mudança.
