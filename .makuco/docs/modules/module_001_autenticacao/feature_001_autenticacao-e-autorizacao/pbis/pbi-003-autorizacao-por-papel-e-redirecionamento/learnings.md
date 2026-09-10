---
stage: documentation
feature: autenticacao-e-autorizacao
pbi: autorizacao-por-papel-e-redirecionamento
created_at: 2026-09-10
status: done
---

# Learnings: Autorização por papel e redirecionamento

## O que foi implementado

Após o login, o sistema passa a identificar o papel do usuário (`admin`/`adotante`) e a proteger/redirecionar por papel: no backend, `JwtAuthGuard` (verifica o JWT do Supabase via `supabase.auth.getClaims()`) e `RolesGuard` (lê o papel em `profiles` a cada requisição via `ProfileRoleLookup`, nunca cacheado) protegem endpoints via `@Roles(...)`; `LoginUseCase` passou a retornar o `role`; `GET /auth/me` e `GET /admin/ping` (endpoint admin-only de demonstração/scaffolding) foram adicionados. No frontend, `SessionContext` guarda o `role`, `RequireRole`+`AccessDenied` protegem rotas client-side, e o login redireciona para `/admin` ou `/cliente` conforme o papel. Aprovada na Rodada 2 de review, após 2 rodadas (Rodada 1: 0 critical + 5 major + 11 minor + 2 suggestion; todos os 5 major corrigidos e verificados antes da aprovação). Fecha a feature `feature_001_autenticacao-e-autorizacao` — as 3 PBIs planejadas (registro-e-confirmacao-de-conta, login-e-sessao-com-refresh-token, autorizacao-por-papel-e-redirecionamento) estão agora aprovadas e documentadas.

## Decisões tomadas

| Decisão | Alternativa considerada | Motivo da escolha |
| ------- | ----------------------- | ------------------ |
| Verificação de JWT via `supabase.auth.getClaims()` | Verificação local com `jsonwebtoken` + `SUPABASE_JWT_SECRET` (HS256), plano original de T2 | O projeto Supabase assina com chave assimétrica (ES256/JWKS); HS256 local rejeitava todo token real. `getClaims` é o método oficial do SDK, cobre os dois algoritmos sem segredo compartilhado. |
| `@Roles('admin')` na CLASSE do `AdminController`, não no método | Decorator só no método `ping()` (implementação original de T6) | `RolesGuard` é fail-open (no-op) quando não encontra a metadata em nenhum nível; como o controller é scaffolding para módulos futuros, decorator só no método deixaria qualquer handler novo acessível a qualquer autenticado por padrão. |
| `RequireRole` separa "sem sessão" (redireciona a `/login`) de "sessão com papel errado" (`AccessDenied`) | Tratar os dois casos como o mesmo desfecho (`AccessDenied` para ambos) — implementação original de T8 | Sessão é client-side-only (decisão da pbi-002); todo visitante não autenticado via a mensagem factualmente incorreta de "sem permissão" em vez de ser levado ao login. |
| `ProfileRoleLookup` registrado como provider duplicado em `AuthModule` e `AdminModule` | `AuthModule` exportar `ProfileRoleLookup` e `AdminModule` importar `AuthModule` | Simplicidade do scaffolding — aceito como dívida técnica (achado minor #16 do review, não bloqueante), não uma escolha definitiva. |

## Desvios do planejado

T2 (`JwtAuthGuard`) foi originalmente implementada e "concluída" com verificação local HS256 (`jsonwebtoken` + `SUPABASE_JWT_SECRET`), conforme o plano original da task — mas esse caminho nunca tinha sido exercitado contra um token real do Supabase (só contra tokens fabricados no teste unitário com segredo fake). O desvio só foi descoberto ao escrever os primeiros e2e reais (T5 e T6, de forma independente e paralela): o projeto assina com chave assimétrica ES256/JWKS, não HS256 — todo token real era rejeitado. Corrigido adotando `supabase.auth.getClaims()` (fix de T5, por não exigir dependência nova), com merge de reconciliação entre os dois fixes independentes (commit `ca31f05`). Também na Rodada 1 do review, 5 achados `major` (ver Problemas encontrados) exigiram correção antes da aprovação — todos corrigidos e verificados pelo próprio orquestrador (testes automatizados dedicados + suíte completa), sem uma Rodada 3 de review independente — mesma decisão de prazo já registrada nas rodadas 2 dos reviews de pbi-001 e pbi-002.

## Problemas encontrados

- **Bug cross-cutting (achado durante execução, antes do review)**: `JwtAuthGuard` presumia HS256 e rejeitava todo token real emitido pelo Supabase (ver Desvios do planejado acima) — só descoberto pelos primeiros e2e reais.
- **5 achados `major` na Rodada 1 do review, todos corrigidos e verificados antes da aprovação**:
  1. `RequireRole` mostrava "acesso negado" para visitante sem sessão, em vez de redirecionar a `/login`;
  2. `RolesGuard`/`AdminController` fail-open — `@Roles('admin')` só no método, não na classe, deixando handlers futuros do mesmo controller acessíveis por padrão a qualquer autenticado;
  3. `/auth/me` e `/admin/ping` sem rate limit, somado ao fallback caro de `getClaims` (até 2 round-trips reais ao Supabase por token com `kid` desconhecido) = amplificação de DoS não autenticada;
  4. `role` sem validação de runtime na fronteira frontend/backend (mesmo padrão de risco já materializado com `expires_in` na pbi-002);
  5. `roleHomeRoute` tipada para devolver `string` mas podia devolver `undefined` em runtime para um papel fora do mapa conhecido.
- **Risco registrado, não bloqueante**: 1 falha intermitente em `admin-ping.e2e-spec.ts` ao rodar a suíte e2e completa em paralelo (sem `--runInBand`) — não reproduziu em 4 reruns consecutivos; suspeita de rate limiting do lado do GoTrue por múltiplos workers do Jest criando usuários de teste concorrentemente contra o mesmo projeto Supabase real. Registrado em `.makuco/STATE.md` (Active Blockers) como risco de flakiness a observar, não como bug do código.

## O que ficou fora do escopo

- Conteúdo real da área administrativa e da área do cliente — módulos futuros, `EXPERIENCE.md` desta PBI já marca como `[NOTE FOR UX]`.
- Middleware Next.js de proteção de rota — decisão de arquitetura: sessão vive só em memória do React, inacessível ao middleware/edge do Next.js (ver `spec.md`, "Nota de arquitetura").
- Gestão de papéis (promover/rebaixar usuário) — `role` seguirá seedado manualmente; não pedido pelos critérios de aceite desta PBI.
- 11 achados `minor` + 2 `suggestion` do review, documentados em `review.md` e não bloqueantes: consistência de padrão em `GET /auth/me` (lógica de negócio no controller em vez de Use Case dedicado); validação de fronteira em `ProfileRoleLookup`/`claims.sub`; semântica de erro em `RolesGuard` quando mal configurado (403 em vez de 401); error swallowing em `JwtAuthGuard` (causa original não logada); menor privilégio (guard de autenticação usa o cliente service-role só para ler o JWKS público); `aud`/`iss` do JWT não validados explicitamente; payload RSC de `/admin`/`/cliente` (Server Components); staleness do `role` entre renovações de sessão (sem reconfirmação via `GET /auth/me`); drift de mensagem de erro não testado em `RegisterUseCase`; null-safety residual em `fetchEmail`; `ProfileRoleLookup` duplicado entre módulos (ver Decisões tomadas) — todos ficam como dívida técnica para PBIs/módulos futuros.
- Uma Rodada 3 de review independente para confirmar os 5 fixes major da Rodada 1 — recomendada em `review.md`, não executada por decisão de prazo.

## Documentação atualizada

| Arquivo | O que mudou |
| ------- | ----------- |
| `.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/decisions.md` | Nova `DEC-03`: registra dois padrões arquiteturais que módulos futuros devem seguir, não reinvestigar — (1) verificação de JWT do Supabase sempre via `supabase.auth.getClaims()`, nunca verificação local com segredo HS256 assumido (este projeto assina com chave assimétrica ES256/JWKS), e que todo endpoint atrás de `JwtAuthGuard` precisa de rate limiting por causa do custo de rede do próprio `getClaims`, não só os que usam o cliente efêmero da DEC-02; (2) decorator de papel/permissão (`@Roles(...)`) em controllers admin-only vai sempre na CLASSE, nunca só no método, para o guard ficar deny-by-default em handlers futuros do mesmo controller. |

(Nenhum outro arquivo de documentação do projeto precisou de alteração — `testing.md`, `feature.md`, `pbis.md`, `EXPERIENCE.md` e `DESIGN.md` desta PBI foram comparados com a implementação e não têm drift.)

## Aprendizados para próximos PBIs

- Qualquer guard/middleware que verifique um JWT contra um provedor de identidade externo (Supabase ou não) precisa ser testado contra um token REAL emitido por esse provedor antes de ser considerado pronto — um teste unitário que fabrica seu próprio token nunca detecta uma divergência de algoritmo de assinatura (HS256 assumido vs. ES256 real, neste caso).
- Em qualquer controller desenhado como scaffolding reutilizável para endpoints futuros do mesmo domínio de acesso (ex. admin-only), o decorator de papel/permissão vai na classe, não no primeiro método — não é razoável exigir que cada handler futuro repita o decorator por disciplina.
- Todo endpoint atrás de um guard de autenticação que dependa de busca de JWKS (ou qualquer chamada de rede condicional) precisa de rate limiting — o custo por chamada vem do próprio mecanismo de verificação, não apenas de escolhas de cliente/SDK feitas em cima dele.
- Um guard de rota client-side (necessário quando a sessão é client-side-only, sem cookie/middleware) deve tratar "sem sessão" e "sessão com papel/permissão errada" como dois desfechos distintos, com ações corretivas diferentes (ir para login vs. voltar para a própria área) — colapsar os dois no mesmo estado de UI produz uma mensagem factualmente incorreta para o caso mais comum (visitante nunca autenticado).
- Qualquer campo novo adicionado a um contrato de resposta HTTP consumido pelo frontend (aqui, `role`) precisa de validação de runtime fail-closed no lado que consome, na ausência de um pacote de tipos compartilhado entre backend e frontend — mesmo padrão de risco de `expires_in` (pbi-002) se repetiu aqui com `role`.

---

Próximo passo Todos os stages desse PBI estão completos.
