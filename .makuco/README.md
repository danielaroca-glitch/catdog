# Makuco

O Makuco é um framework para desenvolvimento assistido por IA, projetado para facilitar fases de especificação, planejamento e codificação, focando em qualidade das entregas.

## MAKUCO.md

O arquivo `./MAKUCO.md` é o **ponto de entrada do workspace**: índice dos repositórios + configuração/políticas dos agentes (`analise.aprovador`, `research.referencias`). Ele **não** guarda síntese do projeto.

O contexto de cada repositório fica em `.makuco/docs/codebase/`, gerado pelo `makuco-project-research`. O `makuco init` sempre cria a pasta `repos/` na raiz do workspace, então a existência dela não diz nada: o workspace é multi-repo quando `repos/` tem ao menos uma sub-pasta de repositório, e aí o contexto vive em `repos/<nome>/.makuco/docs/codebase/`. Com `repos/` sem nenhuma sub-pasta (só o `README.md`), o contexto fica na raiz.

- `OVERVIEW.md` — papel do repo no negócio, apelidos e status, quem consome o quê, e o **mapa de módulos**. É por aqui que os agentes começam.
- `modules/<slug>.md` — capacidades de negócio de cada módulo (quando o repo tem 4+ módulos separáveis).
- `stack.md`, `structure.md`, `architecture.md`, `conventions.md`, `integrations.md`, `concerns.md`, `testing.md` — o detalhe técnico.

## Estrutura do pacote

O pacote do Makuco entrega os seguintes diretórios em `./`:

- **agents/**: As 3 definições de agente (`*.agent.md`) de apoio ao fluxo (veja a seção [Agentes](#agentes)).
- **skills/**: Skills especializadas carregadas sob demanda — formatação de cada artefato (`makuco-artifact-*`), passes de review (`makuco-reviewer-*`), práticas de código/testes/UX e geração de diagramas. Inclui também as três skills orquestradoras autônomas, que conduzem o trabalho de ponta a ponta: `makuco-analisar` (análise → PRD + PBIs), `makuco-desenvolver` (PBI → código commitado) e `makuco-code-review` (mudança pronta → `review.md` + veredito). Veja [Fluxo das skills](#fluxo-das-skills).
- **templates/**: Templates de artefato (`task-template`, `spec-template`, `status-template.yml`, checklists) para que as skills e agentes gerem arquivos em formato padronizado.
- **prompts/**: Prompt pré-pronto para montar a base de conhecimento do projeto (`start-makuco`).
- **mcp/**: Configurações de MCP por ferramenta (`claude/` e `vscode/`).

### Estrutura de saída (artefatos no seu projeto)

Conforme você executa as skills, os artefatos são gravados na pasta `.makuco/` do **seu** projeto:

```
.makuco/
├── docs/
│   ├── modules/module_NNN_<nome>/feature_NNN_<nome>/
│   │   ├── status.yml          # fonte da verdade do fluxo (estágios + estado dos PBIs)
│   │   ├── structure.md        # decomposição da feature em PBIs
│   │   └── pbis/{slug}/
│   │       ├── business.md  technical.md  spec.md  plan.md
│   │       ├── review.md  learnings.md
│   │       └── tasks/task-NN.md
│   ├── discovery/explorations/discovery_<slug>.md
│   ├── codebase/   # contexto do repo: OVERVIEW.md, modules/<slug>.md, arquitetura,
│   │               # convenções, stack, integrações, concerns, testes
│   │               # (multi-repo: em repos/<nome>/.makuco/docs/codebase/)
│   │               # veja repos/README.md na raiz do workspace
│   ├── architecture/  # ADRs, C4, ERDs
│   └── product/    # contexto de negócio
├── quick/NNN-<slug>/{TASK.md, SUMMARY.md}   # artefatos do Quick Mode
└── STATE.md        # log de quick tasks concluídas + lições aprendidas
```

> O `status.yml` é a **fonte da verdade** do fluxo e permite retomar o trabalho entre sessões (session handoff). Apenas o agente `makuco-copy-writer` escreve nele.

## Agentes

O Makuco possui **3 agentes**, e você não invoca dois deles: o `makuco-copy-writer` e o `makuco-documentation` são acionados pelas skills. O trabalho de ponta a ponta é conduzido pelas três **skills orquestradoras** (ver [Fluxo das skills](#fluxo-das-skills)).

| Agente | Para que serve | Resultado esperado | Tier de modelo | Modelo Claude sugerido |
|---|---|---|---|---|
| **makuco-copy-writer** | Acionado pelas skills ao final de uma etapa: formata o artefato, persiste com o frontmatter obrigatório e atualiza o `status.yml`. É o **único** que escreve no `status.yml`. Você não o invoca. | Artefato formatado + `status.yml` atualizado | Rápido | Haiku 4.5 |
| **makuco-documentation** | Acionado pelo `makuco-code-review` quando o veredito é APROVADO: compara o implementado com a documentação atual, atualiza só o que mudou e captura aprendizados. Você não o invoca. | `learnings.md` + docs do projeto atualizadas | Equilibrado | Sonnet 4.6 |
| **makuco-quick** | Express lane para mudanças pequenas (≤3 arquivos, ≤1h, causa conhecida, sem novas deps/arquitetura). Pula o fluxo completo. | `quick/NNN-<slug>/{TASK.md, SUMMARY.md}` + commit atômico | Equilibrado | Sonnet 4.6 |

> **Agentes removidos.** `makuco-discovery`, `makuco-structure`, `makuco-business-analyst`, `makuco-technical-analyst`, `makuco-specify`, `makuco-plan`, `makuco-codegen` e `makuco-reviewer` foram removidos: as três skills orquestradoras cobrem as mesmas etapas e passaram a ser o único caminho. Os artefatos e o `status.yml` não mudaram — os mesmos stages continuam sendo gravados, pelas skills. Quem tinha esses agentes instalados os perde no próximo `makuco init`; o substituto de cada um está na tabela do [Fluxo das skills](#fluxo-das-skills).

> **Sobre os modelos:** hoje todos os agentes são entregues com `model: inherit` no frontmatter (`agents/*.agent.md`), ou seja, herdam o modelo da sua sessão. A tabela acima é uma **recomendação** de como configurá-los conforme o equilíbrio entre custo e qualidade. Os tiers genéricos ("raciocínio avançado", "equilibrado", "rápido") servem para mapear em qualquer ferramenta (Claude, Copilot, etc.); a coluna Claude indica o equivalente sugerido na família Anthropic.

## Unidades

Temos configurações específicas com arquivos por unidade, para que os agentes possam adaptar suas entregas e se especializar de acordo com as necessidades de cada unidade.

## Configuração Makuco (MCP e SonarQube)

**Requisitos**:

- Chave SSH para acesso ao repositório do MCP.

1. Acesse o arquivo `mcp.json` e configure as credenciais:
    - `SONAR_URL`: URL do SonarQube utilizado para análise de código
    - *Atenção*: o Sonar é chamado via API, então é necessário garantir que a URL esteja correta e acessível para que as análises de código possam ser realizadas com sucesso. Ex: `https://sonar.lughy.com.br`
    - `SONAR_TOKEN`: Token do tipo `User Token  para acessar o SonarQube
    - *Atenção*: o token é utilizado para autenticar as requisições feitas para a API do SonarQube, garantindo que apenas usuários autorizados possam acessar as informações e funcionalidades do SonarQube. Certifique-se de utilizar um token válido e com as permissões adequadas para garantir o funcionamento correto das análises de código.

2. É necessário que seu projeto tenha um arquivo `sonar-project.properties` configurado corretamente para que as análises de código possam ser realizadas com sucesso. Certifique-se de configurar esse arquivo de acordo com as necessidades do seu projeto e as diretrizes do SonarQube.

## Configurar o MCP do Azure DevOps

A integração com Azure DevOps é **opcional** — sem ela, o Makuco opera 100% local-only. Ela usa o server oficial `@azure-devops/mcp` (Microsoft), com autenticação diferente por ferramenta.

### Fluxo assistido (`makuco init`)

Ao rodar `makuco init`, responda **"sim"** para "Usa Azure DevOps?" e informe:

1. **Projeto**
2. **Personal Access Token (PAT)** — perguntado apenas se o VSCode estiver entre as ferramentas selecionadas (o Claude não precisa de PAT)

A **organização** não é perguntada: é fixa em `db1global`. Para apontar para outra
organização, edite `org:` em `.makuco/integrations/azure-devops.yml` e o argumento
da org nos `mcp.json` (`.mcp.json` e/ou `.vscode/mcp.json`).

O `init` já grava:

- `.makuco/integrations/azure-devops.yml` com `org`/`project` preenchidos (nomes de work-item, estados e custom fields ficam comentados — são descobertos em runtime, ou você pode mapeá-los manualmente depois)
- o server `azure-devops` no `.mcp.json` (Claude, autenticação interativa) e/ou `.vscode/mcp.json` (VSCode, `--authentication pat` + `envFile`)
- (somente se VSCode) `PERSONAL_ACCESS_TOKEN=<base64>` no `.env`, garantindo que `.env` está no `.gitignore`

Responder **"não"** não cria nenhum arquivo relacionado ao Azure DevOps — o Makuco segue local-only.

### Autenticação por ferramenta

- **Claude Code**: autenticação **interativa** — a primeira chamada de uma tool do Azure DevOps abre o login pelo navegador (MSAL). Não precisa de AZ CLI nem de PAT.
- **VSCode + Copilot / ambientes headless / CI**: autenticação via **PAT**, enviado como `PERSONAL_ACCESS_TOKEN` (base64 de `email:pat`) via `.env`.

### Configuração manual do PAT (sem passar pelo `init`, ou para CI/headless)

1. Crie um PAT no Azure DevOps (**User Settings → Personal Access Tokens**) com o escopo mínimo recomendado: **Work Items (Read & Write)**.
2. Gere o `base64` de `email:pat` (qualquer e-mail não vazio serve — só o PAT importa):

   - **Linux/macOS**: `echo -n "seu-email@exemplo.com:SEU_PAT" | base64`
   - **Windows (PowerShell)**: `[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("seu-email@exemplo.com:SEU_PAT"))`

   ⚠️ Garanta que o comando **não quebra linha** no resultado — um token com quebra de linha corrompe a autenticação.

3. Adicione ao `.env` do projeto (nunca versionado — confirme que `.env` está no `.gitignore`):

   ```
   PERSONAL_ACCESS_TOKEN=<base64 gerado acima>
   ```

4. No `.vscode/mcp.json`, o server `azure-devops` deve apontar `envFile: "${workspaceFolder}/.env"` e usar `--authentication pat`.

> O segredo (PAT/base64) **nunca** deve ir para um arquivo versionado. Sempre em `.env`, sempre no `.gitignore`.

## Fluxo das skills

O trabalho é conduzido por três **skills orquestradoras autônomas**. Você as invoca direto no chat, elas conduzem o próprio fluxo em etapas e mantêm o próprio estado de sessão — não é preciso escolher agente a cada passo. Use **um chat por sessão** para preservar a janela de contexto; o `status.yml` registra o estado e permite retomar de onde parou.

| Skill | Entrada | Saída |
|---|---|---|
| **makuco-analisar** | Uma oportunidade vaga (modo DESCOBERTA) ou um problema já entendido (modo SOLUÇÃO) | `feature.md` (PRD) + `decisions.md` + PBIs validados por INVEST |
| **makuco-desenvolver** | Um PBI pronto (local ou work-item do Azure DevOps) | `spec.md` + `task.md` + código implementado em commits atômicos, com gates de teste e qualidade |
| **makuco-code-review** | Uma mudança pronta — o PBI recém-implementado, ou uma branch/PR/working tree avulsa | `review.md` (ou `.makuco/reviews/`) + veredito APROVADO / NECESSITA CORREÇÕES |

```
makuco-analisar → makuco-desenvolver → makuco-code-review → makuco-documentation
                        ↑                      │
                        └──── NECESSITA CORREÇÕES
```

### Nível Feature (uma vez por feature)

1. **makuco-analisar** — traga a ideia crua ou o problema já entendido. A skill valida se faz sentido, explora o problema, produz o PRD e decompõe em PBIs atômicos validados por INVEST.

### Nível PBI (repetir o ciclo abaixo para cada PBI)

2. **makuco-desenvolver** — gera `spec.md` + `task.md` a partir do PBI e implementa task por task (RED → GREEN → VERIFY → COMMIT), com gate de qualidade antes de cada commit.
3. **makuco-code-review** — roda os 7 passes de review → `review.md` + veredito. Se `NECESSITA CORREÇÕES`, volte ao passo 2 nas tasks apontadas.
4. **makuco-documentation** — o `makuco-code-review` o aciona automaticamente quando aprova: atualiza a documentação do projeto e registra `learnings.md`. Não é um passo que você dispara.

O `makuco-code-review` executa os passes 1–2 e despacha os passes 3–7 para cinco subagentes em paralelo, e **nunca altera código** — os achados voltam para o `makuco-desenvolver`. Em modo PBI ele grava `review.md` pelo `makuco-copy-writer` e atualiza o `status.yml`; em modo diff avulso grava direto em `.makuco/reviews/`, sem tocar no `status.yml`. Rodadas de review se acumulam no mesmo arquivo, então o histórico do que foi achado e corrigido fica preservado.

> Ao final de **cada** etapa que produz artefato canônico, o `makuco-copy-writer` formata o artefato e atualiza o `status.yml` — você não o invoca manualmente, a skill o aciona.
>
> **Dica:** após cada geração de código, crie um chat novo, apague o antigo e dê reload no VSCode. O VSCode usa memória em cache, e isso pode fazê-lo perder o contexto do projeto. Um chat novo + reload limpa esse cache e garante que ele use o contexto atualizado.

## Workflow Simplificado (cenários simples)

Nem toda mudança precisa do fluxo completo. Escolha o fluxo pelo tamanho e risco da mudança:

| Cenário | Critério | Fluxo |
|---|---|---|
| **Quick Mode** | ≤3 arquivos, ≤1h, causa conhecida, sem novas deps/arquitetura | `makuco-quick` |
| **Pipeline completo** | Feature com múltiplos PBIs, regras de negócio ou decisões de arquitetura | discovery → structure → estimate → (por PBI) business → technical → specify → plan → codegen → reviewer → documentation |

### Quick Mode (`makuco-quick`)

Para alterações cirúrgicas — bug fix com causa conhecida, ajuste de config, bump de dependência, pequeno tweak de UI. Selecione o agente `makuco-quick` e escreva o prompt seguindo boas práticas de prompt engineering. O agente:

1. Reformula a tarefa em uma frase e checa os guardrails (≤3 arquivos, ≤1h, sem novas deps/arquitetura, causa conhecida).
2. Apresenta um **bloco de pré-implementação** (Arquivos / Abordagem / Verificação) e **aguarda sua aprovação**.
3. Faz a mudança cirúrgica (sem refactor, sem novas abstrações, casando com o estilo existente).
4. Verifica (gate `quick` + testes dos arquivos tocados) e propõe um commit atômico.
5. Persiste em `.makuco/quick/NNN-<slug>/` e registra a tarefa no `.makuco/STATE.md`.

Se durante a execução o escopo crescer (mais de 3 arquivos, surge decisão de arquitetura ou nova dependência), o agente **para** e recomenda migrar para o fluxo completo via `makuco-analisar`.
