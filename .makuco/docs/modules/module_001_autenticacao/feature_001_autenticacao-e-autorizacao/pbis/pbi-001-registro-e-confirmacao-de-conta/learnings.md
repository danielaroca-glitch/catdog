---
stage: documentation
feature: autenticacao-e-autorizacao
pbi: registro-e-confirmacao-de-conta
created_at: 2026-09-07
status: done
---

# Learnings: Registro e confirmação de conta

## O que foi implementado

Fluxo de registro e confirmação de conta, aprovado na Rodada de revisão 4 após 4 rodadas de review. Cobre o cadastro do usuário, a confirmação da conta e os tratamentos de borda associados (e-mail duplicado, falha na criação do perfil, rate limiting no endpoint de registro).

## Decisões tomadas

| Decisão | Alternativa considerada | Motivo da escolha |
| ------- | ----------------------- | ------------------ |
| `configureApp()` extraído para `services/backend/src/configure-app.ts`, separado de `main.ts` | Manter tudo em `main.ts` | `main.ts` executa `bootstrap()` como efeito colateral de módulo; importar dele em teste subiria um segundo servidor real (`EADDRINUSE`) |
| Rate limiting (`@nestjs/throttler`) aplicado só no endpoint `POST /auth/register` via `@UseGuards`/`@Throttle` | Aplicar globalmente via `APP_GUARD` | Evitar afetar outros endpoints que não precisam do limite |
| `trust proxy` deliberadamente NÃO configurado agora | Configurar preventivamente | Decisão de produto/técnica a ser revisitada quando existir uma topologia de deploy real (documentada em T13) |
| Detecção de e-mail duplicado via `error.code === 'email_exists'` do Supabase, com fallback por regex na mensagem | Confiar apenas no fallback por regex, ou bloquear até a API do Supabase expor um código estável | Risco de drift futuro da API do Supabase aceito (achado #3 da Rodada 1, rebaixado a minor) |
| REG-08 (falha ao criar linha em `profiles` após signup) resolvida via trigger transacional de banco | Rollback manual em código | Consistência garantida no nível de banco, sem depender de lógica compensatória na aplicação |

## Desvios do planejado

Nenhum desvio significativo.

## Problemas encontrados

Nenhum problema relevante.

## O que ficou fora do escopo

- REG-09 (reenvio de e-mail de confirmação): ficou como limitação conhecida — a Supabase Admin API não expõe status de envio de e-mail, então o botão de reenvio hoje só reinicia o cooldown visual, sem chamada real de API. Decisão documentada no próprio código (T7, T10), não um desvio silencioso.
- `trust proxy` não configurado no backend — decisão deliberada e documentada (T13), a ser revisitada quando uma topologia de deploy real existir.
- Abstração de gateway de autenticação (desacoplar `RegisterUseCase` do SDK concreto do Supabase) — sugestão (severidade `suggestion`) do review, não bloqueante, não implementada; fica como dívida técnica para PBIs futuras.
- Extração de tipos compartilhados entre backend e frontend — sugestão do review, não bloqueante, não implementada; fica como dívida técnica para PBIs futuras.
- Endpoint real de reenvio de e-mail de confirmação — sugestão do review, não bloqueante, não implementada; fica como dívida técnica para PBIs futuras.

## Documentação atualizada

| Arquivo | O que mudou |
| ------- | ----------- |
| `.makuco/docs/codebase/testing.md` (linha 23) | Corrigido drift: o texto dizia que `configure-app.ts` só era exercitado por `test/cors.e2e-spec.ts` (e2e); isso ficou desatualizado após a correção de T14 (achado #1 da Rodada 3), que fez `test/trust-proxy.e2e-spec.ts` também chamar `configureApp()`. Atualizado para citar os dois specs, e acrescentada a menção de que a mesma exclusão de cobertura precisa ser espelhada em `sonar.coverage.exclusions` (achado já registrado em `.makuco/STATE.md`, Lessons Learned, e já resolvido no código — só a documentação estava desatualizada). |
| `.makuco/docs/codebase/testing.md` (linha 28) | A nota `[ASSUMPTION]` sobre os scripts de `package.json` (gate check commands) foi confirmada como verdadeira contra os `package.json` reais de `services/backend` e `services/frontend` (T1/T2); atualizada para deixar de soar como suposição para esses dois serviços já existentes, mantendo o aviso apenas para um serviço novo futuro. |

## Aprendizados para próximos PBIs

- Ao extrair uma configuração de app para testabilidade (ex.: `configureApp()`), lembrar de manter tanto a documentação de qual(is) spec(s) e2e a exercitam quanto as exclusões de cobertura (`sonar.coverage.exclusions`) sincronizadas — um drift entre código e doc pode passar despercebido por rodadas de review inteiras se ninguém revisitar a doc explicitamente.
- Decisões de escopo aceitas conscientemente (ex.: risco de drift de API externa, feature não implementada por limitação de terceiro) só evitam confusão futura quando documentadas no próprio código/artefato no momento em que são tomadas — foi o caso aqui (T7, T10, T13) e evitou que aparecessem como achados de review recorrentes.
- Projeto ainda greenfield em `.makuco/docs/codebase/`: só `testing.md` existe. Não criar `OVERVIEW.md`/`conventions.md`/`architecture.md`/`structure.md` do zero nesta etapa — isso está fora do escopo da documentação pós-PBI (regra: nunca recriar do zero) e não é uma lacuna introduzida por este PBI.

---

Próximo passo Todos os stages desse PBI estão completos.
