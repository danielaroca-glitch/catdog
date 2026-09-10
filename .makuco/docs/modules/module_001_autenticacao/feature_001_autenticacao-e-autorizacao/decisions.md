# Log de Decisões — Autenticação e Autorização

> Decisões detalhadas desta feature. Para resumo, veja `feature.md#Decisões Chave`.

## DEC-01 Estratégia de autenticação e autorização

**Data:** 2026-09-07
**Status:** Aceita

**Contexto:** O projeto CatDog precisa de autenticação e autorização por papel (admin/adotante) e a stack já decidida inclui Supabase (banco, auth e storage). Era preciso decidir quem cuida da identidade/sessão e onde vive o papel do usuário.

**Opções avaliadas:**
- A) Supabase Auth puro, papel em `app_metadata`: baixo custo, mas papel preso ao formato do Supabase, menos flexível para evoluir permissões.
- B) Supabase Auth (identidade/sessão/refresh) + tabela própria `profiles` para o papel: custo médio, mais flexível, papel desacoplado do provedor de identidade.
- C) Autenticação 100% custom no NestJS (bcrypt + JWT + refresh próprios): controle total, mas custo e risco altos, reimplementa o que o Supabase já resolve.

**Escolha:** B — Supabase Auth + tabela `profiles`.

**Motivo:** Aproveita a sessão/refresh/confirmação de e-mail que o Supabase já entrega nativamente, evitando reimplementação, enquanto mantém o papel do usuário em uma tabela própria — mais flexível para evoluir regras de autorização sem depender do formato de metadados do provedor de identidade.

**Impactos:** Precisa de um trigger/hook no signup do Supabase para criar automaticamente a linha em `profiles`. O envio do e-mail de confirmação usa o fluxo nativo do Supabase, não o Resend (decisão que pode ser revisitada em feature futura se for necessário e-mail transacional customizado).

## DEC-02 Cliente Supabase efêmero por chamada para fluxos de auth de usuário final (nunca reusar o singleton admin)

**Data:** 2026-09-08
**Status:** Aceita

**Contexto:** `pbi-002` (Login e sessão com refresh token, Rodada 1 do review, achado #1 crítico) revelou que o `SUPABASE_CLIENT` singleton — criado com a service role key para operações administrativas (ex. `RegisterUseCase.fetchProfileRole`) — não pode ser reutilizado para autenticar um usuário final (`signInWithPassword`, `refreshSession`). Mesmo com `persistSession: false`, o SDK ainda cacheia em memória a sessão do último usuário autenticado e passa a usá-la (em vez da service role key) em todas as chamadas seguintes do mesmo cliente — vazando identidade de usuário entre requisições concorrentes.

**Opções avaliadas:**
- A) Chamar `signOut({ scope: 'local' })` no singleton logo após extrair os tokens, para "limpar" a sessão cacheada: tentada primeiro, mas revoga a sessão recém-emitida no servidor (regressão real — a rotação de refresh token deixava de funcionar — só detectada rodando e2e contra o Supabase real, não pelos testes unitários mockados).
- B) Cliente Supabase efêmero, criado por chamada e nunca reusado, para qualquer operação que autentique como usuário final.

**Escolha:** B — fábrica de cliente efêmero (`SUPABASE_AUTH_CLIENT_FACTORY`, `services/backend/src/supabase/supabase.provider.ts`).

**Motivo:** Elimina o vazamento pela raiz (sem estado compartilhado entre chamadas), sem depender de entender/confiar na semântica de revogação de um SDK de terceiros.

**Impactos:** Qualquer caso de uso futuro (nesta feature ou outra) que autentique um usuário final contra o Supabase Auth (ex. recuperação de senha, login social) deve usar a fábrica de cliente efêmero — nunca o `SUPABASE_CLIENT` singleton, reservado a operações administrativas/service role. O cliente efêmero tem custo maior por chamada (sem reuso de conexão): endpoints que o usam precisam de rate limiting (ver `/auth/refresh`, que ficou sem controle após este fix e foi corrigido na Rodada 2 do review de `pbi-002` com `@Throttle({ limit: 30, ttl: 60000 })`).
