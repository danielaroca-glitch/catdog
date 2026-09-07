# Restrições e Decisões Técnicas

> **Como preencher:** registre aqui o que não deve ser usado neste projeto e por quê. Restrições sem justificativa são ignoradas — registre o motivo com clareza.
> **Caminho:** `02-systems/{sistema}/architecture/tech-restrictions.md`
> **Importante:** restrições que exigem mais contexto ou que divergem dos padrões organizacionais devem virar um ADR em `architecture/adr/`.

---

## Tecnologias Proibidas

> Liste tecnologias, bibliotecas, frameworks ou abordagens que não devem ser usados neste projeto, independentemente do contexto.

| O que não usar | Motivo | Alternativa recomendada |
|---|---|---|
| Nenhuma tecnologia proibida por enquanto | O projeto ainda está em definição inicial e não há veto técnico formalizado até o momento | Avaliar conforme necessidade do projeto |

---

## Restrições de Ambiente

> Limitações impostas pelo ambiente do cliente, infraestrutura existente ou políticas da organização.

| Restrição | Descrição | Impacto no projeto |
|---|---|---|
| Sem restrições de ambiente por enquanto | Ainda não foram definidos limites obrigatórios de hosting, infraestrutura, rede ou plataforma | As decisões de infraestrutura continuam abertas e poderão ser definidas nas próximas etapas |

---

## Restrições de Segurança e Compliance

> Requisitos obrigatórios de segurança, privacidade ou regulação que condicionam as decisões técnicas.

| Requisito | Descrição | Como é atendido |
|---|---|---|
| Autenticação obrigatória | O sistema deverá exigir autenticação para acesso às áreas protegidas | Uso do Supabase Auth como mecanismo principal de autenticação |
| Controle de acesso por papéis | O sistema deverá restringir funcionalidades conforme o perfil do usuário | Implementação de autorização por roles no backend e no frontend |
| Criptografia em trânsito | As comunicações entre cliente e serviços autenticados devem ocorrer de forma segura | Uso de HTTPS nas integrações web e chamadas aos serviços |

---

## Decisões Tomadas e Não Reverter

> Escolhas técnicas já feitas e consolidadas que não devem ser questionadas sem um ADR. Diferente de proibições — são decisões que já custaram tempo e que reverter teria custo alto.

| Decisão | Contexto | Por que não reverter |
|---|---|---|
| Usar Supabase para autenticação | Definido como base da solução desde a etapa inicial do projeto | Trocar exigiria redesenho do fluxo de login, gestão de usuários e permissões |
| Usar Supabase PostgreSQL como base de dados | Definido como serviço principal de persistência do projeto | Trocar impactaria modelagem, acesso a dados, infraestrutura e operação |
| Usar Supabase Storage para arquivos | Definido como componente padrão para armazenamento de arquivos do sistema | Trocar exigiria refazer integrações, políticas de acesso e gestão de arquivos |
