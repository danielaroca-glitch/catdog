---
stage: documentation
feature: autenticacao-e-autorizacao
pbi: login-e-sessao-com-refresh-token
created_at: 2026-09-10
status: done
---

# Learnings: Login e sessão com refresh token

## O que foi implementado

Endpoint de login (email/senha) autenticando contra o Supabase Auth, retornando access token + refresh token; bloqueio de login para e-mail não confirmado com opção de reenvio (RN-02); endpoint de refresh emitindo novo par de tokens; invalidação de toda a sessão ao reuso de um refresh token já rotacionado (RN-03); rate limiting em `/auth/login` e (adicionado na rodada 2) em `/auth/refresh`; contexto de sessão em memória no frontend com renovação automática antes da expiração e redirecionamento com mensagem ao Login quando a renovação falha por reuso/token inválido. Aprovado na Rodada 2 de review, após 2 rodadas.

## Decisões tomadas

| Decisão | Alternativa considerada | Motivo da escolha |
| ------- | ------------------------ | ------------------ |
| Cliente Supabase efêmero por chamada para `signInWithPassword`/`refreshSession` (ver DEC-02 em `decisions.md`) | `signOut({ scope: 'local' })` no cliente singleton logo após extrair os tokens | A alternativa causou uma regressão real (revogava a sessão recém-emitida no servidor); o cliente efêmero elimina o vazamento de identidade pela raiz, sem depender de semântica de revogação de SDK de terceiro |
| Rate limit `@Throttle({ limit: 30, ttl: 60000 })` em `/auth/refresh` | Manter `/auth/refresh` sem rate limit (decisão original — renovação automática legítima não deveria esbarrar em limite) | O cliente efêmero por chamada (decisão 1) tornou cada requisição não autenticada mais cara, expondo o endpoint sem nenhum controle compensatório |
| Retry (até 5x, 5s de intervalo) antes de tratar falha de refresh como logout; só resposta HTTP real com status < 500 conta como rejeição de autenticação | Tratar qualquer falha (rede fora do ar, 5xx) como sessão expirada | Falha transiente deslogava o usuário com uma mensagem falsa de "sessão expirou" mesmo com sessão válida |
| Mensagem de sessão expirada via código (`?reason=session_expired`) resolvido contra allowlist fixa no cliente | Texto livre na URL (`?message=...`) | Texto livre era vetor de phishing (link do domínio oficial exibindo texto arbitrário sobre o campo de senha) |
| `EmailNotConfirmedException` estende `ForbiddenException` (403) com um `code` no corpo da resposta | Erro genérico 401, igual ao de credenciais inválidas | Frontend precisa distinguir os dois casos para oferecer a opção de reenvio de confirmação (RN-02), sem revelar qual campo está errado no caso de credenciais inválidas (RN via LOGIN-04) |

## Desvios do planejado

T9 foi originalmente concluída com um gap real e conscientemente aceito pelo usuário para fechar a PBI no prazo: o redirecionamento em falha de refresh (`/login?message=...`) não tinha nada em `login-form.tsx`/`page.tsx` que lesse o parâmetro e exibisse a mensagem (LOGIN-07 incompleto ponta a ponta apesar de todas as 9 tasks marcadas concluídas). Esse gap foi fechado durante a própria Rodada 1 do review (achados #2 e #3: hook de renovação nunca montado na app real, e mensagem nunca exibida) antes da aprovação — não ficou como desvio no estado final aprovado. Na Rodada 2, os 2 achados `major` novos (custo/rate-limit do cliente efêmero; falha transiente tratada como logout) foram corrigidos e verificados pelo próprio orquestrador via testes automatizados e suíte completa, sem uma Rodada 3 independente de review — ressalva de prazo, documentada explicitamente em `review.md`.

## Problemas encontrados

- **Crítico (Rodada 1)**: `SUPABASE_CLIENT` singleton (service role) reusado para `signInWithPassword`/`refreshSession` vazava a identidade do usuário autenticado para chamadas subsequentes do mesmo cliente (`persistSession: false` não impede o cache de sessão em memória — só troca o storage adapter). Sob RLS, isso já quebrava o fluxo de cadastro e, sob tráfego concorrente, intercalava identidade entre requisições de usuários diferentes.
- O primeiro fix tentado (`signOut({ scope: 'local' })`) causou uma regressão real: revogava a sessão recém-emitida no servidor, quebrando o próprio fluxo de refresh (E2E-05). Só foi detectado rodando a suíte e2e contra o Supabase real — os testes unitários mockados continuaram verdes.
- **Major novos (Rodada 2), causados pelos próprios fixes da Rodada 1**: (1) o cliente efêmero por chamada tornou `/auth/refresh` mais caro por requisição, endpoint que seguia sem nenhum rate limit; (2) `refresh-scheduler.ts` tratava qualquer falha (rede fora do ar, 5xx) como reuso/token inválido, deslogando o usuário com uma mensagem falsa de sessão expirada mesmo com sessão válida.
- **Minor**: a mensagem de sessão expirada trafegava como texto livre na URL (`?message=...`) — vetor de phishing (link oficial exibindo texto arbitrário sobre o campo de senha), corrigido para um código resolvido contra allowlist.
- O teste e2e de reuso de refresh token (E2E-05) inicialmente presumiu que bastava esperar o "Refresh token reuse interval" (10s) do dashboard; o comportamento real do GoTrue (tokens v2) tolera incondicionalmente o reuso do token imediatamente anterior (proteção contra perda de resposta de rede) — só reuso de 2+ gerações atrás é rejeitado. Teste corrigido para incluir uma rotação intermediária antes do reuso.

## O que ficou fora do escopo

- Redirecionamento por papel pós-login — PBI 3 (`autorizacao-por-papel-e-redirecionamento`).
- Recuperação de senha — fora de escopo da feature inteira.
- Renovação de sessão custom fora do mecanismo nativo do Supabase — decisão de arquitetura (reusa a rotação nativa, não reimplementa).
- Guard/middleware de proteção de rota autenticada (401 em token ausente/inválido) — PBI 3; não havia endpoint protegido dentro do escopo desta PBI para justificar o guard agora.
- Uma Rodada 3 de review independente para os 2 achados major da Rodada 2 — recomendada em `review.md`, não executada por decisão de prazo (verificação ficou a cargo do próprio orquestrador).
- `makuco-project-research` completo (preencheria `OVERVIEW.md`/`conventions.md`/`architecture.md`/`structure.md`, hoje ausentes em `.makuco/docs/codebase/`) — fora de escopo desta PBI e desta etapa de documentação; a Rodada 2 do review recomenda rodá-lo para evitar achados de padrão (pass 7) em PBIs futuras.

## Documentação atualizada

| Arquivo | O que mudou |
| ------- | ----------- |
| `.makuco/docs/codebase/testing.md` | Nova seção "Testes unitários mockados vs. comportamento real de SDK externo (Supabase Auth)", inserida antes de "Gate Check Commands". Captura a lição do achado crítico #1 da Rodada 1: um fix que envolve uma API de cleanup/revogação de um SDK de terceiro precisa ser verificado contra o comportamento real do SDK (código-fonte/docs, não o nome do parâmetro) e testado contra o serviço real — teste unitário mockado não é suficiente. Convenção durável para qualquer PBI futura que integre com SDKs externos. |
| `.makuco/docs/modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/decisions.md` | Nova `DEC-02`: cliente Supabase efêmero por chamada (`SUPABASE_AUTH_CLIENT_FACTORY`) para qualquer fluxo que autentique um usuário final contra o Supabase Auth — nunca reusar o `SUPABASE_CLIENT` singleton (reservado a operações administrativas/service role). Decisão arquitetural que qualquer caso de uso futuro desta feature (ou outra) que precise autenticar usuário final deve seguir; registra também a exigência de rate limiting acompanhando qualquer endpoint que passe a usar cliente efêmero. |

`feature.md` e `pbis.md` (estrutura da feature) foram lidos e comparados — RN-02 e RN-03 já descreviam exatamente o comportamento implementado, sem drift; não precisaram de alteração. `EXPERIENCE.md` do PBI também foi comparado — descreve o resultado de UX (mensagem de sessão expirada exibida), não o mecanismo técnico (código vs. texto livre na URL), então não há drift a corrigir ali.

## Aprendizados para próximos PBIs

- Um "fix" que chama uma API de cleanup/revogação de um SDK de terceiro (ex. `signOut`) precisa ser verificado contra o comportamento REAL do SDK (ler código-fonte/docs, não assumir pelo nome do parâmetro) e testado contra o serviço real antes de ser dado como resolvido — testes unitários mockados não pegam esse tipo de regressão.
- Corrigir um achado crítico pode introduzir achados major novos (custo por chamada, controle ausente) como efeito colateral direto do próprio fix — reservar tempo na mesma sessão de review para uma segunda passada focada no fix, não só no código original.
- Mensagens de erro/estado carregadas via query string devem ser um código resolvido contra allowlist fixa no servidor/cliente, nunca texto livre — texto livre em uma URL de domínio oficial é superfície de phishing.
- Decisões que introduzem um cliente efêmero (sem reuso de conexão) devem vir acompanhadas de rate limiting no mesmo commit/decisão, não como follow-up — foi o gap que gerou o achado major #1 da Rodada 2.
- Testes de reuso de refresh token contra um provedor de auth real (Supabase/GoTrue) precisam de pelo menos 2 rotações antes do reuso testado — uma única rotação anterior é tolerada incondicionalmente por design (proteção contra perda de resposta de rede), não é suficiente para provar rejeição.

---

Próximo passo Todos os stages desse PBI estão completos.
