# STATE — CatDog

## Recent Decisions

- **2026-09-07** — Autenticação e autorização do projeto: Supabase Auth cuida de identidade/sessão/refresh; uma tabela própria `profiles` guarda o papel do usuário (admin/adotante). Qualquer módulo futuro que precise checar papel deve seguir este mesmo padrão (ver `modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/decisions.md#DEC-01`).
- **2026-09-07** — Sistema de componentes do frontend assumido como shadcn/ui sobre Next.js + Tailwind, por ser o padrão idiomático do stack já decidido. Ainda não confirmado formalmente com o time — ver open question abaixo.
- **2026-09-07** — Paleta de marca inicial (terracota `#D97706` + sage `#15803D`) proposta como ponto de partida em `pbis/pbi-001-registro-e-confirmacao-de-conta/DESIGN.md` — não existia identidade visual prévia no projeto.

- **2026-09-07** — `pbi-001-registro-e-confirmacao-de-conta` concluída (10/10 tasks, Quality Gate Sonar OK). Ver Lessons Learned abaixo sobre a configuração do `sonar-project.properties` — qualquer PBI futura deve herdar essa config, não repetir a investigação.

## Lessons Learned

- **2026-09-07 — Configuração do Sonar para monorepo com testes colocados** — Context: primeira análise real do projeto (`sonar-project.properties` só tinha `projectKey`/`projectName`/`exclusions`). Problema: sem `sonar.javascript.lcov.reportPaths`, o Sonar reportava 0% de cobertura mesmo com Jest em 95%+ localmente; sem `sonar.test.inclusions`, arquivos `*.spec.ts`/`*.test.tsx` eram tratados como código de produção sem cobertura, derrubando a métrica geral; e setar `sonar.tests=.` (redundante quando os testes estão na mesma árvore que o código, sem pasta separada) zerou o escopo de `sonar.sources` inteiro, fazendo o scanner reportar "0 issues" por não analisar nada. Solução final (ver `sonar-project.properties`): `sonar.javascript.lcov.reportPaths` apontando para os dois `coverage/lcov.info`, `sonar.test.inclusions` (sem `sonar.tests`) para os padrões `*.spec.ts`/`*.e2e-spec.ts`/`*.test.ts`/`*.test.tsx`, e `sonar.coverage.exclusions` para arquivos de wiring (`*.module.ts`, `main.ts`) e primitivas geradas pelo shadcn (`components/ui/**`). O que isso evita: uma próxima PBI rodando `makuco-quality-gate` (Gate 5) não precisa reinvestigar nada disso — a config já está correta e commitada.
- **2026-09-07 — `@sonar/scan` via npx roda sem Docker/MCP** — Como `makuco-mcp` não estava conectado neste ambiente (sem `sonar-run`/`get-sonar-issues`), rodar `npx -y @sonar/scan` diretamente (com `SONAR_HOST_URL`/`SONAR_TOKEN` no ambiente) funciona como alternativa real — baixa JRE+engine na primeira vez (~10-15min), depois cacheia em `~/.sonar/cache` e cada análise subsequente leva ~1-3min. Resultados consultáveis via API REST do Sonar (`/api/issues/search`, `/api/qualitygates/project_status`, `/api/measures/component_tree`) com o mesmo `SONAR_TOKEN`.

## Deferred Ideas (fora de escopo desta feature)

- Recuperação de senha ("esqueci minha senha") — vira PBI futuro dentro do módulo de Autenticação.
- Criação de conta admin pela própria plataforma (fluxo de convite) — hoje é seed manual, fora de escopo.
- E-mails transacionais customizados via Resend — a feature de Autenticação usa o fluxo nativo do Supabase para o e-mail de confirmação; Resend fica reservado para features futuras que precisem de e-mail com marca própria.

## Open Questions

- Validar a paleta de marca (terracota/sage) e o sistema de componentes (shadcn/ui) com a ONG/PO — nenhuma identidade visual formal existia antes da feature de Autenticação.
