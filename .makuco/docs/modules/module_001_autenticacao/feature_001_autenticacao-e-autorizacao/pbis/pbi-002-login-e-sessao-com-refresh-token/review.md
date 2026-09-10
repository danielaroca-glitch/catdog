---
stage: review
feature: autenticacao-e-autorizacao
pbi: login-e-sessao-com-refresh-token
created_at: 2026-09-10
status: done
---

# Review — Login e sessão com refresh token

## Rodada de revisão 1

**Data**: 2026-09-08
**Modo**: PBI · **Veredito**: NECESSITA CORREÇÕES

### Resumo

Revisão da `pbi-002-login-e-sessao-com-refresh-token` (T1-T9), diff `272134a..3b20175` (24 arquivos de código). 1 achado `critical` e 4 `major` bloqueiam aprovação — o mais grave é um cliente Supabase compartilhado que vaza identidade de usuário entre requisições após o primeiro login/refresh.

### Passes executados

1 (spec/task) e 2 (diff) rodados pelo orquestrador. 3 (qualidade), 4 (testes), 5 (segurança), 6 (bugs) rodados em subagentes paralelos. **7 (padrões): SKIP — subagente travou (timeout de 600s, sem recuperação do watchdog)**; não foi possível reexecutar dentro do prazo desta rodada.

Docs de convenção (`<CODEBASE_DIR>`): só `testing.md` existe (`OVERVIEW.md`/`conventions.md`/`architecture.md`/`structure.md` ausentes — projeto nunca rodou `makuco-project-research` completo). Pass 3/7 derivaram padrões direto do código.

### Achados

| # | Severidade | Arquivo | Linha | Categoria | Descrição | Recomendação |
| - | - | - | - | - | - | - |
| 1 | critical | `services/backend/src/supabase/supabase.provider.ts`; `services/backend/src/auth/use-cases/login.use-case.ts`; `refresh.use-case.ts` | provider.ts:26-41; login.use-case.ts:45; refresh.use-case.ts:37 | segurança / estado compartilhado (OWASP A01) | `SUPABASE_CLIENT` é um singleton NestJS (sem `Scope.REQUEST`) criado com a **service role key**. `persistSession: false` NÃO desliga o cache de sessão — troca só o storage para `memoryLocalStorageAdapter` (verificado em `node_modules/@supabase/auth-js/dist/main/GoTrueClient.js:222-241`); toda chamada de `signInWithPassword`/`refreshSession` roda `_saveSession` (mesmo arquivo, `_saveSession` definido em L4231, chamado em L1395/L1533 entre outras). `SupabaseClient._getAccessToken()` (`node_modules/@supabase/supabase-js/dist/index.cjs:1396-1401`) retorna `session.access_token ?? supabaseKey` — ou seja, depois do PRIMEIRO login/refresh bem-sucedido no processo, toda chamada REST/Postgrest subsequente do MESMO cliente (ex. `RegisterUseCase.fetchProfileRole` → `.from('profiles')`) passa a rodar com o JWT do último usuário autenticado em vez da service role key. Sob RLS, isso já quebra o fluxo de cadastro (a linha de `profiles` do novo usuário some da perspectiva de um cliente autenticado como outro usuário) e, sob tráfego concorrente, intercala identidade entre requisições de usuários diferentes. **Verificação: CONFIRMED** — mecanismo e gatilho citados linha a linha no código-fonte real do SDK instalado (`@supabase/supabase-js@2.109.0`). | Não autenticar usuário final no cliente admin compartilhado: criar um cliente dedicado por requisição (`Scope.REQUEST`, chave anon, `persistSession: false`) para `LoginUseCase`/`RefreshUseCase`, OU, mínimo viável, chamar `await this.supabase.auth.signOut({ scope: 'local' })` logo após extrair os tokens em ambos os use cases, garantindo que o singleton volte à identidade de service role antes da próxima requisição. |
| 2 | major | `services/frontend/src/lib/auth/refresh-scheduler.ts` | 93 | spec-compliance / bug (código nunca executado) | `useRefreshScheduler()` não é chamado em NENHUM componente da árvore real da aplicação — confirmado por grep (só aparece no próprio arquivo e em `refresh-scheduler.test.ts`); `app/layout.tsx` só monta `SessionProvider`. `EXPERIENCE.md` declara a renovação de sessão como "Automática, em segundo plano" (Arquitetura de Informação) e descreve no Fluxo-Chave "Marina volta ao CatDog" que a sessão é renovada "automaticamente em segundo plano sem que [a usuária] perceba". Hoje isso nunca acontece: a sessão nunca é renovada e, quando o `access_token` expira, chamadas autenticadas futuras simplesmente falham sem nenhum tratamento — LOGIN-06 (intenção de renovação automática) e LOGIN-07 (redirecionamento em falha) ficam não implementados de ponta a ponta, apesar de 100% cobertos por teste unitário isolado (`renderHook`, que não precisa do hook estar montado). **Verificação: CONFIRMED** — ausência de qualquer call site fora do próprio módulo/teste. | Montar `useRefreshScheduler()` em um componente cliente dentro do `SessionProvider`, na raiz autenticada da app (ex. um `<SessionRefresher />` renderizado em `app/layout.tsx`), com um teste de integração (não só o hook isolado) provando que a montagem acontece. |
| 3 | major | `services/frontend/src/app/login/page.tsx`; `services/frontend/src/lib/auth/refresh-scheduler.ts:85` | — | design-contract (EXPERIENCE.md) | Mesmo corrigido o achado #2, `refresh-scheduler.ts` redireciona para `/login?message=Sua+sess%C3%A3o+expirou...` mas nada em `login/page.tsx`/`login-form.tsx` lê `searchParams.message` e o exibe — confirmado por grep. `EXPERIENCE.md` (Padrões de Estado, "Sessão expirada durante uso", e a tabela Voz e Tom) definem esse texto como contrato de UX obrigatório para esse fluxo. Hoje o usuário é deslogado e redirecionado em silêncio. **Verificação: CONFIRMED.** (Gap já identificado durante o fechamento desta PBI e registrado em `.makuco/STATE.md` como follow-up aceito pelo usuário — incluído aqui porque a revisão documenta o estado real do código, independentemente de quando a correção acontecer.) | Ler o query param em `app/login/page.tsx` (via prop de Server Component ou `useSearchParams` no client) e renderizar via `Alert`, mesmo padrão já usado para os outros estados do formulário de login. |
| 4 | major | `services/frontend/src/lib/auth/refresh-scheduler.ts` | 103-125 | bug / race condition | O cleanup do `useEffect` cancela apenas o `setTimeout` pendente — não cancela um `fetch`/renovação já em voo. Se `session` mudar (novo login) ou o componente desmontar enquanto `requestSessionRefresh` está pendente, a promise resolvida ainda executa `setSession(refreshed)` (sobrescrevendo a sessão mais nova) ou, no `catch`, `clearSession()` + `router.push(...)` (deslogando um usuário que já tem sessão válida). **Verificação: PLAUSIBLE** — mecanismo real e o código não tem nenhuma guarda contra ele, mas o gatilho depende de timing (uma renovação em voo coincidindo com uma troca de sessão). | Adicionar uma flag de cancelamento (`let cancelled = false` no efeito, setada `true` no cleanup, checada antes de `setSession`/`clearSession`/`router.push`) e/ou um `AbortController` passado ao `fetch` de `requestSessionRefresh`, abortado no cleanup. |
| 5 | major | `services/frontend/src/lib/auth/refresh-scheduler.ts` | 79-82 | bug / boundary | `millisecondsUntilRefresh` clampa em `0` via `Math.max(..., 0)`. Se `expires_in` chegar `<= 60` (margem `REFRESH_MARGIN_MS`) ou não-numérico (`NaN`, dado que `AuthenticatedSession`/`RefreshedSession` não são validados em runtime no cliente — ver achado minor #9 abaixo), o próximo agendamento roda com delay `0`/tratado como `0`, criando um loop apertado de `POST /auth/refresh` — justamente o único endpoint de auth sem `ThrottlerGuard` (`auth.controller.ts:71-74`, intencional para não travar renovação legítima). Sob configuração atual do dashboard Supabase (`Access token expiry` = 3600s), o caminho `expires_in <= 60` não é alcançado em operação normal — o caminho `NaN` depende de uma resposta malformada do backend. **Verificação: PLAUSIBLE** — não reproduz com a configuração atual, mas não há nenhuma guarda no código contra um `expires_in` anômalo. | Validar `expires_in` (número finito e `> 0`) em `SessionContext.setSession` antes de calcular `expires_at`, e aplicar um piso mínimo ao agendamento (`Math.max(delay, MIN_REFRESH_DELAY_MS)`) com guarda explícita contra `NaN`. |
| 6 | minor | `services/backend/src/auth/use-cases/login.use-case.ts` | 13 | clean-code (DRY) | `EMAIL_NOT_CONFIRMED_CODE` é redefinida localmente, embora já seja exportada por `exceptions/email-not-confirmed.exception.ts` (que este arquivo já importa). Duas fontes de verdade para o mesmo valor — se uma mudar sem a outra, `isEmailNotConfirmed` para de detectar o caso, silenciosamente. | Importar `EMAIL_NOT_CONFIRMED_CODE` de `../exceptions/email-not-confirmed.exception` em vez de redefinir. |
| 7 | minor | `services/backend/src/auth/dto/login.dto.ts` | 7-8 | segurança / validação (OWASP A03) | `senha` só tem `@IsNotEmpty()` — sem `@IsString()`/`@MaxLength` (diferente de `RefreshDto`, que tem os dois). Um payload com tipo inesperado (objeto, array, número) passa a validação e chega a `signInWithPassword` — confusão de tipo na fronteira de confiança; hoje só produz 401 genérico (sem impacto de segurança concreto), mas é o mesmo padrão que `RefreshDto` já corrige. | Adicionar `@IsString()` + `@MaxLength(...)` a `senha`, e `@MaxLength(...)` a `email`. |
| 8 | minor | `services/backend/src/supabase/supabase.provider.ts` | 30-38 | segurança (OWASP A02, relacionado ao achado #1) | Mesmo corrigido o achado #1, os fluxos de login/refresh de usuário final continuam rodando sob a credencial administrativa (service role) até a correção estrutural — violação de menor privilégio que amplia o raio de exposição da chave mais sensível do projeto. | Após corrigir #1, considerar migrar `LoginUseCase`/`RefreshUseCase` para um cliente com a chave anon/publishable, reservando a service role para `auth.admin.*` e operações de banco. |
| 9 | minor | `login.use-case.ts` (41-59), `refresh.use-case.ts` (41-43) | — | observabilidade (OWASP A09) | Nenhum evento de auth é logado: falha de credenciais, e-mail não confirmado, e principalmente o reuso de refresh token (RN-03) retornam 401/403 sem nenhum registro — impossível detectar força bruta ou investigar reuso depois do fato. | `Logger` do Nest nos desfechos de erro (evento, timestamp, IP/correlation id) — nunca senha/tokens no log. |
| 10 | minor | `services/frontend/src/lib/auth/refresh-scheduler.ts:28-29`, `services/frontend/src/lib/api/auth.ts:12-14` | — | segurança (OWASP A02) | `DEFAULT_API_URL = "http://localhost:3001"` é fallback silencioso — se `NEXT_PUBLIC_API_URL` faltar em produção, tokens de sessão trafegam por HTTP sem nenhuma falha visível. | Falhar rápido (ou exigir `https`) quando a env var estiver ausente fora de desenvolvimento. |
| 11 | minor | `services/frontend/src/lib/api/auth.ts` | 161-167 | bug (coerção insegura) | `authenticatedFetch` faz `{...init.headers, Authorization: ...}` — se `init.headers` for uma instância de `Headers` ou array de tuplas (formas válidas de `RequestInit`), o spread produz `{}` e os headers do chamador são descartados. Hoje sem impacto real: `authenticatedFetch` não tem nenhum chamador na aplicação (correto — não há endpoint protegido nesta PBI, per `spec.md`/Out of Scope), então é fragilidade latente, não um bug em produção. | Normalizar com `new Headers(init.headers)` antes de mesclar, quando a função ganhar seu primeiro chamador real. |
| 12 | minor | `services/frontend/src/components/auth/login-form.tsx` | 120-131 | bug (updater impuro) | O `setResendCooldownSeconds` updater executa `clearInterval`/mutação de ref dentro da própria função de update — updaters devem ser puros (React pode invocar duas vezes em StrictMode/dev). Hoje protegido por uma guarda `if (resendIntervalRef.current)`, mas é um padrão frágil. | Mover o `clearInterval` para um `useEffect` reagindo a `resendCooldownSeconds === 0`, mantendo o updater puro. |
| 13 | minor | `services/frontend/src/components/auth/login-form.tsx:162-164,174-176`; `services/frontend/src/lib/api/auth.ts:102,146` | — | bug (error swallowing / cast sem validação) | Os `catch` de `submitViaLoginApi`/`submitViaCallback` descartam o erro original sem log. `loginUser`/`registerUser` fazem cast (`as AuthenticatedSession`/`as RegisteredUser`) sem validar o shape em runtime — se o backend mudar, `expires_in` pode faltar e alimentar o achado #5 (NaN). `refresh-scheduler.ts` já resolve isso corretamente com um type guard (`isRefreshedSessionResponse`). | Logar o erro original antes de mapear para mensagem genérica; replicar o padrão de type guard de `refresh-scheduler.ts` em `loginUser`/`registerUser`. |
| 14 | minor | `services/backend/test/auth-refresh.e2e-spec.ts` | 121-156 | testes (isolamento) | E2E-04 e E2E-05 têm dependência sequencial (E2E-05 reusa o token produzido por E2E-04) — funcional (Jest roda `it`s em ordem) mas viola isolamento de teste. | Extrair um setup compartilhado que produz a sessão inicial para E2E-05, independente da execução de E2E-04. |

**Mais 2 achados `suggestion` da mesma rodada, não listados individualmente**: rate limiting de `/auth/login` só por IP (sem contador por conta) e `ValidationPipe` global sem `whitelist`/`forbidNonWhitelisted`.

### Cobertura dos critérios de aceite

| Critério | Task | Status |
| - | - | - |
| LOGIN-01 | T1,T2,T4,T6,T7,T8 | Verificado (backend E2E-01 + frontend conectado) — achado #1 (crítico) é uma falha de isolamento do MECANISMO de auth, não do critério em si |
| LOGIN-02 | T2,T4,T6,T8 | Verificado |
| LOGIN-03 | T3,T4,T5 | Verificado (E2E-05) |
| LOGIN-04 | T1,T2,T4,T6,T8 | Verificado |
| LOGIN-05 | T1,T6 | Verificado |
| LOGIN-06 | T3,T4,T9 | **Falhou** — endpoint funciona (E2E-04), mas a renovação automática nunca dispara em produção (achado #2) |
| LOGIN-07 | T9 | **Falhou** — hook nunca montado (achado #2) e mensagem nunca exibida (achado #3) |
| LOGIN-08 | T4 | Verificado |

### Notas de escopo

24 arquivos de código no diff (13 backend, 11 frontend); 5 arquivos de doc/config fora de escopo de achado (`STATE.md`, `sessao-dev.md`, `spec.md`, `task.md`, `.gitignore`). Pass 7 (padrões) não rodou — subagente travou por timeout; recomenda-se rodar isoladamente numa próxima rodada. Nenhum candidato foi descartado por ser não-finding além dos já listados como minor/suggestion — nenhum achado de compilação/lint (fora do escopo desta revisão, coberto pelo gate de build/lint já verde).

## Rodada de revisão 2

**Data**: 2026-09-08
**Modo**: PBI · **Veredito**: APROVADO

### Resumo

Re-revisão da `pbi-002-login-e-sessao-com-refresh-token`, diff `3b20175..HEAD` (19 arquivos, correções dos 5 achados críticos/major da Rodada 1 + 2 achados novos desta rodada). Todos os achados `critical`/`major` de ambas as rodadas estão corrigidos e verificados. Nenhum `critical`/`major` aberto.

### Passes executados

1 (spec/task) e 2 (diff) pelo orquestrador. 3 (qualidade), 4 (testes), 5 (segurança), 6 (bugs), 7 (padrões) em subagentes paralelos — todos completaram desta vez (pass 7 tinha travado na rodada 1).

### Rodada anterior — status dos achados críticos/major

| # | Achado (rodada 1) | Status |
| - | - | - |
| 1 | critical — cliente Supabase singleton vazando identidade | **Corrigido.** Primeira tentativa (`signOut({scope:'local'})`) causou regressão (revogava a sessão emitida) — revertida. Fix final: cliente efêmero por chamada (`SUPABASE_AUTH_CLIENT_FACTORY`). Verificado por 3 passes independentes (3, 5, 6) contra o código-fonte do SDK + 14/14 e2e reais. |
| 2 | major — `useRefreshScheduler` nunca montado | **Corrigido.** `<SessionRefresher/>` em `layout.tsx`, dentro do `SessionProvider`. |
| 3 | major — mensagem de sessão expirada não exibida | **Corrigido** (e endurecido nesta rodada — ver achado novo #2 abaixo). |
| 4 | major — race condition no cleanup do refresh | **Corrigido.** Pass 6 confirmou explicitamente: sem janela entre `cancelled=true` (síncrono no flush do React) e a continuação do `await` em voo. |
| 5 | major — delay 0/NaN sem piso | **Corrigido em duas camadas** (validação de entrada em `session-context.tsx` + piso com guarda `NaN` em `refresh-scheduler.ts`). |
| 6, 7 | minor — constante duplicada, DTO fraco | Corrigidos. |

### Achados novos desta rodada (já corrigidos nesta mesma sessão)

| # | Severidade | Arquivo | Descrição | Recomendação | Status |
| - | - | - | - | - | - |
| 1 | major | `services/backend/src/auth/auth.controller.ts` | O fix do achado crítico #1 tornou cada `POST /auth/refresh` mais caro (aloca um `SupabaseClient` por chamada) num endpoint sem nenhum rate limit (decisão original, mas sem controle compensatório). Achado do pass 5, **CONFIRMED**. | Rate limit generoso (30/min), acima do uso legítimo. | **Corrigido** — `@Throttle({ limit: 30, ttl: 60000 })` adicionado, verificação do orquestrador (testes automáticos, não subagente independente — ver ressalva de escopo). |
| 2 | major | `services/frontend/src/lib/auth/refresh-scheduler.ts` | Qualquer falha (rede fora do ar, 5xx, blip) caía no mesmo `catch` que um 401 genuíno — deslogava o usuário com mensagem falsa de "sessão expirou" mesmo com a sessão válida. Achado do pass 6, **CONFIRMED**. | Discriminar falha transiente (retry) de rejeição de autenticação real (só HTTP < 500). | **Corrigido** — `SessionRefreshTransientError` + até 5 retries com 5s de intervalo antes de desistir; 3 testes novos (retry-e-sucesso por rede, retry-e-sucesso por 5xx, esgota-retries-e-desloga). Verificação do orquestrador (mesma ressalva). |
| 3 (minor) | minor | `services/frontend/src/app/login/page.tsx` | Mensagem de sessão expirada trafegava como TEXTO LIVRE na URL (`?message=...`) — vetor de phishing (link oficial exibindo texto arbitrário sobre o campo de senha). Achado do pass 5, **CONFIRMED**. | Trafegar um código (`?reason=...`) resolvido contra allowlist fixa. | **Corrigido** — `?reason=session_expired` + `SESSION_MESSAGES_BY_REASON` allowlist; qualquer `reason` fora dela (ou `string[]`) não renderiza nada. 2 testes novos. |

### Ressalva de escopo (por prazo)

Os achados novos #1 e #2 acima foram corrigidos pelo próprio orquestrador (não por um subagente independente numa Rodada 3), verificados por: testes automatizados novos e dedicados a cada mecanismo, suíte completa (backend 43 unit + 14 e2e reais, frontend 66 unit) e build limpo — mas sem uma segunda revisão adversarial independente, por restrição de prazo (entrega no mesmo dia). Recomenda-se uma Rodada 3 leve (só nesses 2 arquivos) numa sessão futura, se o rigor total for necessário antes de produção.

### Achados minor/suggestion remanescentes (não bloqueiam aprovação)

Carry-overs da rodada 1 ainda abertos (service role key no fluxo de usuário final; ausência de log de eventos de auth; fallback silencioso de `NEXT_PUBLIC_API_URL`; type guard aceitando `NaN`/negativos; DTOs com decoradores de validação inconsistentes entre si; teto de `setTimeout` não validado contra `expires_in` anômalo; janela de corrida residual e estreita entre login concorrente e refresh em voo; acoplamento de teste a detalhe de implementação; triplicação de markup de alerta) — todos documentados, nenhum classificado como bloqueante por não atender ao critério de `major` (não são requisito não-implementado, nem falha de segurança direta, nem bug com caminho de gatilho realista em operação normal). Recomenda-se `makuco-project-research` para preencher os docs de convenção ausentes, que teriam evitado parte dos achados de padrão (pass 7).

### Cobertura dos critérios de aceite (atualizada)

Todos os 8 critérios (LOGIN-01 a LOGIN-08) — **Verificado**, incluindo LOGIN-06/07 (que tinham Falhado na rodada 1 por causa dos achados #2/#3, agora corrigidos).

---

Próximo passo: PBI aprovada. Seguir para `makuco-documentation` (atualização de docs pós-aprovação).
