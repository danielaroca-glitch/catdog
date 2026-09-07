---
stage: review
feature: autenticacao-e-autorizacao
pbi: registro-e-confirmacao-de-conta
created_at: 2026-09-07
status: done
---

# Review — Registro e confirmação de conta

## Rodada de revisão 1 — 2026-09-07

**Veredicto:** NECESSITA CORREÇÕES
**Tasks revisadas:** task-01, task-02, task-03, task-04, task-05, task-06, task-07, task-08, task-09, task-10

### Resumo

Revisão completa (modo PBI, rodada 1) dos 23 arquivos de código desta PBI — 7 passes executadas (fan-out completo: 5 subagentes em paralelo para as passes 3-7, mais passes 1-2 no orquestrador), 18 achados após dedup/verificação (1 critical, 1 major, 10 minor, 6 suggestion), a partir de 23 candidatos brutos. Veredicto NECESSITA CORREÇÕES por 1 achado crítico (CORS ausente — impede o fluxo de cadastro de funcionar de verdade em um navegador real) e 1 achado major (endpoint público de cadastro sem rate limiting).

### Achados

| # | Severidade | Arquivo | Linha | Categoria | Descrição | Recomendação |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | critical | `services/backend/src/main.ts` | L5-9 | boundary/CORS | **CONFIRMED.** `bootstrap()` nunca chama `app.enableCors()`, e não há proxy/rewrite em `services/frontend/next.config.ts` (verificado — arquivo vazio, sem `rewrites`). O frontend chama `fetch` direto para `http://localhost:3001` a partir da origem do Next.js (porta diferente). Qualquer usuário real abrindo a aplicação no navegador tem a requisição de registro bloqueada pela política de CORS — o fluxo de cadastro (REG-01 a REG-09) nunca funciona fora dos testes automatizados, porque nem Supertest (chama o servidor Nest direto) nem o `fetch` mockado nos testes de frontend passam pela política de CORS de um navegador real. | Adicionar `app.enableCors({ origin: '<origem do frontend>' })` em `main.ts`, antes de `app.listen`. |
| 2 | major | `services/backend/src/auth/auth.controller.ts` | L29-31 | segurança (OWASP A04) | **CONFIRMED.** `POST /auth/register` é público, sem nenhum rate limiting (`ThrottlerModule` ausente de `app.module.ts`, confirmado). Um script simples pode criar contas em massa, sondar e-mails já cadastrados via respostas 409 repetidas, e esgotar a quota da Admin API do Supabase. | Adicionar `@nestjs/throttler` (ou guard equivalente) com limite agressivo neste endpoint. |
| 3 | minor | `services/backend/src/auth/use-cases/register.use-case.ts` | L98-103 | robustez / contrato externo | **PLAUSIBLE** (rebaixado de major na verificação — depende de uma mudança futura da API do Supabase, não é um bug hoje). Detecção de e-mail duplicado usa `error.code === 'email_exists'` com fallback por regex na mensagem. Corresponde ao contrato documentado do `@supabase/auth-js` hoje; se a mensagem mudar (localização, nova versão do GoTrue) e `code` vier ausente, um cadastro duplicado passaria a cair em 500 genérico em vez de 409 (REG-05). | Preferir só `error.code` como critério primário; se manter o regex como fallback, logar quando ele for o único critério que bateu, para detectar esse drift em produção. |
| 4 | minor | `services/frontend/src/lib/api/auth.ts` | L48-64 | contrato / tratamento de erro | **CONFIRMED, mas sem consequência visível hoje** (rebaixado de major — verificado que `register-form.tsx` L100-105 só lê `error.status === 409` e ignora `error.message` para qualquer outro status, então o bug é inerte no fluxo atual). `extractErrorMessage` só aceita `message` como `string`; o `ValidationPipe` do Nest retorna `message` como **array** em erros 400 de validação. A função cai no fallback genérico nesse caso. Vira um problema real assim que outra tela passar a exibir `error.message` diretamente. | Tratar `message: string[]` explicitamente (`Array.isArray(message) ? message.join(', ') : message`). |
| 5 | minor | `services/backend/src/auth/dto/register.dto.ts` | L5-13 | validação de entrada | Sem `@MaxLength` em `nome`/`senha` (payloads arbitrariamente grandes chegam à Admin API do Supabase) e `nome` aceita string só de espaços (`@IsNotEmpty` não rejeita `"   "`). | Adicionar `@MaxLength` (ex.: 72 em `senha`, compatível com bcrypt; 100-200 em `nome`) e `@Matches(/\S/)` ou `trim()` em `nome`. |
| 6 | minor | `services/backend/src/main.ts` | L7 | segurança (OWASP A05) | `ValidationPipe` global sem `whitelist`/`forbidNonWhitelisted`/`transform`. Hoje inofensivo porque o use case só lê campos explícitos do DTO, mas é uma lacuna de defesa em profundidade. | `new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`. |
| 7 | minor | `services/backend/src/auth/use-cases/register.use-case.ts` | L53-93 | observabilidade (OWASP A09) | Nenhum evento de segurança é logado (sucesso de cadastro, tentativa de e-mail duplicado, erro do Supabase) — sem trilha para detectar abuso ou diagnosticar falha em produção. | Logar os eventos relevantes (sem PII sensível/senha), preservando as mensagens genéricas já retornadas ao cliente. |
| 8 | minor | `services/backend/src/main.ts` (L8) vs `services/frontend/src/lib/api/auth.ts` (L11) | — | configuração | Fallback de porta do backend é `3000`; fallback de URL do frontend é `http://localhost:3001`. `.env.example` documenta `PORT=3001`, mas um clone novo sem copiar `.env` primeiro sobe os dois serviços apontando para lugares incoerentes entre si. | Alinhar os fallbacks, ou falhar cedo (erro no boot) se `PORT` não estiver definido. |
| 9 | minor | `services/backend/src/auth/dto/match.validator.ts` | L21 | consistência de idioma | Mensagem de validação padrão em inglês ("must match {campo}") — a única do módulo que não está em PT-BR. | Traduzir para "deve corresponder a {campo}". |
| 10 | minor | `services/backend/src/auth/use-cases/register.use-case.ts` (L53-58) e `services/frontend/src/app/registro/confirmacao-pendente/page.tsx` (L47-51) | — | Object Calisthenics (nível de indentação) | `if` aninhado em ambos os arquivos (tratamento de erro do Supabase; limpeza do intervalo de cooldown) — dois níveis de indentação onde um bastaria. | Achatar com guard clauses/early return em cada um. |
| 11 | minor | `services/backend/src/auth/use-cases/register.use-case.ts` (L11), `services/frontend/src/lib/api/auth.ts` (L22), `services/backend/src/auth/dto/register.dto.ts` (campos) | — | linguagem ubíqua | `UserRole = 'admin' \| 'adotante'` mistura inglês/português no mesmo tipo, duplicado (sem contrato compartilhado) entre backend e frontend; `RegisterDto`/`RegisteredUser` também mesclam campos PT (`nome`, `senha`) e EN (`email`, `id`, `role`) na mesma classe. | Padronizar o idioma dos termos de domínio; avaliar extrair um contrato de tipos compartilhado entre backend/frontend numa PBI futura. |
| 12 | minor | `services/frontend/src/app/registro/confirmacao-pendente/page.tsx` | L56 | clareza | Literal `1000` (ms) no `setInterval` não é nomeado, ao contrário de `RESEND_COOLDOWN_SECONDS`, já extraído. | Extrair para uma constante `ONE_SECOND_IN_MILLISECONDS`. |
| 13 | suggestion | `services/backend/src/auth/use-cases/register.use-case.ts` | L42 | SOLID-D | `RegisterUseCase` depende diretamente do SDK concreto do Supabase e do formato de erro específico dele. | Extrair uma abstração de domínio (ex.: `AuthUserGateway`) injetada, isolando o caso de uso do provedor de autenticação. |
| 14 | suggestion | `services/frontend/src/components/auth/register-form.tsx` | L134-234 | duplicação | Quatro blocos `Controller`+`Field`+`Input`+`FieldError` (nome/email/senha/confirmarSenha) repetem a mesma estrutura com pequenas variações. | Extrair um componente `RegisterFormField` parametrizado por nome/label/tipo/autoComplete. |
| 15 | suggestion | `services/frontend/src/components/auth/register-form.tsx` | L85-88 | tratamento de erro | Caminho `onSubmit` (usado principalmente em testes) não tem `try/catch`, diferente do caminho padrão via `registerUser`. | Envolver também essa chamada em `try/catch`, atualizando `submitError` em caso de falha. |
| 16 | suggestion | `services/frontend/src/app/registro/confirmacao-pendente/page.tsx` | L17 | robustez de UI | Acesso direto sem `?email=` na URL mostra "Enviamos um e-mail de confirmação para ." sem endereço algum. | Mostrar mensagem genérica sem o placeholder, ou redirecionar para `/registro`, quando `email` vier vazio. |
| 17 | suggestion | `services/backend/src/auth/use-cases/register.use-case.ts` | — | funcionalidade futura | Supabase-js expõe `auth.resend({type:'signup', email})` — o botão de reenvio (task-10) hoje só reinicia o cooldown visual, sem chamada real. | Avaliar implementar um endpoint real de reenvio usando esse método nativo, quando essa necessidade entrar em escopo de uma feature futura. |
| 18 | suggestion | `services/backend/src/main.ts` | L5-9 | hardening | Sem `helmet()` configurado no bootstrap da API. | Adicionar como hardening de baseline (não bloqueante para esta PBI). |

### Cobertura dos critérios de aceite

| Critério | Task | Status |
| --- | --- | --- |
| REG-01 | task-01, task-08 | Verificado |
| REG-02 | task-01, task-02, task-03, task-04, task-06, task-09 | Verificado |
| REG-03 | task-06, task-07 | Verificado |
| REG-04 | task-07 | Verificado |
| REG-05 | task-06, task-07, task-09 | Verificado |
| REG-06 | task-08 | Verificado |
| REG-07 | task-05, task-08 | Verificado |
| REG-08 | task-06 | Verificado |
| REG-09 | task-07, task-10 | Parcialmente implementado — divergência declarada no código (`[NOTA]`), motivo técnico válido (Supabase Admin API não expõe status de envio de e-mail); não bloqueia por si só |

### Notas de escopo

- Fora de escopo de achado: scaffold gerado por `create-next-app`/`nest new` (controllers/páginas padrão, arquivos de configuração), manifestos de dependência (`package.json`/lock), e as 8 primitivas geradas pelo shadcn CLI (`services/frontend/src/components/ui/**`) — seriam sobrescritas no próximo `npx shadcn add`.
- 2 candidatos descartados por não serem achados (não entram na tabela): política de senha além do mínimo de 8 caracteres (Pass 5) já está dentro do escopo definido por REG-07, não é uma violação; reformatação cosmética incidental de `match.validator.ts` misturada num commit de fix — estilo que o formatter/Prettier já cobre.
- 2 achados originalmente marcados `major` pela Pass 6 (bugs) foram rebaixados para `minor` na verificação desta consolidação — ver achados #3 e #4 acima para o motivo de cada rebaixamento.
- `<CODEBASE_DIR>` (`.makuco/docs/codebase/`) tem apenas `testing.md` — projeto greenfield, sem `OVERVIEW.md`/`conventions.md`/`architecture.md` ainda. A Pass 7 derivou os padrões de posicionamento observando a própria estrutura criada nesta PBI, já que ela é a primeira feature do projeto.
- Fan-out completo nesta rodada: 5 subagentes em paralelo (passes 3-7), mais passes 1-2 executadas pelo orquestrador em paralelo ao fan-out. Nenhuma pass foi `SKIP` ou `N/A`.

---

Próximo passo: volte ao `makuco-desenvolver` nas tasks task-01 (main.ts/CORS) e task-07 (auth.controller.ts/rate limiting) — os dois achados bloqueantes — e rode uma nova rodada de review depois.
