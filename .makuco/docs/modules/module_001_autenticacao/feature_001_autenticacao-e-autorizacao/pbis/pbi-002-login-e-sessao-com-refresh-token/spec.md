# Login e sessão com refresh token — Dev Spec

**Parent Feature**: `../../feature.md` (Autenticação e Autorização) — ver `decisions.md#DEC-01` para a decisão de usar Supabase Auth (identidade/sessão/refresh nativos) + tabela `profiles`.
**Work-item**: nenhum (local-only) · **PBI**: pbi-002-login-e-sessao-com-refresh-token

## Scope

Endpoint de login (email/senha) que autentica contra o Supabase Auth e retorna access token + refresh token; bloqueio de login para e-mail não confirmado; erro genérico para credenciais inválidas.

## Out of Scope

| Item | Reason |
| --- | --- |
| Redirecionamento por papel pós-login | PBI 3 (`autorizacao-por-papel-e-redirecionamento`) |
| Recuperação de senha | Fora de escopo da feature inteira (`feature.md`) |
| Renovação de sessão custom (rotação própria fora do Supabase) | Ver nota de arquitetura abaixo — reaproveita o mecanismo nativo do Supabase, não reimplementa |
| Guard/middleware de proteção de rota autenticada (401 em token ausente/inválido/expirado) | PBI 3 — não há nenhum endpoint protegido dentro do escopo desta PBI para justificar o guard agora; construí-lo aqui seria trabalho especulativo sem nada para proteger |

---

## Nota de arquitetura — reuso da rotação nativa do Supabase (não reimplementar)

Per `decisions.md#DEC-01`, esta feature evita reimplementar o que o Supabase Auth já resolve. O GoTrue (motor de auth do Supabase) já implementa **rotação de refresh token com detecção de reuso** nativamente, configurável no próprio projeto Supabase (Auth → Sessions: "Refresh Token Rotation" + "Reuse Interval"). Isso muda o formato de CA-03:

- O backend NestJS **não implementa** lógica própria de família/geração de refresh token — ele expõe endpoints (`POST /auth/login`, `POST /auth/refresh`) que chamam `supabase.auth.signInWithPassword()` / `supabase.auth.refreshSession()` e propagam o resultado (sucesso ou erro) do Supabase.
- CA-03 (RN-03) é satisfeito **desde que** a configuração "Refresh Token Rotation" esteja habilitada no projeto Supabase — uma configuração de infraestrutura, não de código.
- **[ASSUMPTION]** Não há como confirmar essa configuração via API (testado: `GET /auth/v1/settings` do GoTrue não expõe rotação/reuso — só provedores externos, signup, SMS, SAML, passkeys; confirmar exigiria a Management API do Supabase, sem token configurado neste projeto). Decisão do usuário: seguir assumindo que está habilitada (comportamento padrão de projetos novos do Supabase), com uma task explícita pedindo confirmação/ativação manual no dashboard (Authentication → Sessions) antes do fechamento desta PBI.

---

## Acceptance Criteria

Fonte: `pbi.md` (`analisar`). Tratados como imutáveis — normalizados aqui, não re-derivados.

1. **LOGIN-01** — WHEN um usuário com conta confirmada informa email e senha corretos THEN o sistema SHALL retornar um access token e um refresh token (via `supabase.auth.signInWithPassword()`).
2. **LOGIN-02** — WHEN um usuário com e-mail não confirmado tenta fazer login THEN o sistema SHALL bloquear o login e a resposta SHALL indicar que existe a opção de reenviar a confirmação (RN-02).
3. **LOGIN-03** — WHEN um refresh token já rotacionado (usado uma vez) é reutilizado THEN o sistema SHALL invalidar toda a sessão associada (RN-03, via rotação nativa do Supabase — ver nota de arquitetura acima).
4. **LOGIN-04** — WHEN as credenciais (email ou senha) estão incorretas THEN o sistema SHALL retornar um erro genérico, sem indicar qual campo (email ou senha) está errado.

## Edge Cases

Surgidos ao escrever esta spec — não presentes nas CA originais.

- **LOGIN-05** — WHEN o payload de login chega malformado (email ausente/inválido, senha ausente) THEN o sistema SHALL retornar 400 com mensagem de validação, antes de consultar o Supabase.
- **LOGIN-06** — WHEN um refresh token válido (ainda não rotacionado) é apresentado antes de expirar THEN o sistema SHALL emitir um novo par access/refresh token (endpoint `POST /auth/refresh`).
- **LOGIN-07** — WHEN a renovação automática de sessão falha (reuso de refresh token detectado, RN-03) THEN o frontend SHALL redirecionar o usuário ao Login com a mensagem "Sua sessão expirou. Entre novamente." (per `EXPERIENCE.md`).
- **LOGIN-08** — WHEN `POST /auth/login` recebe requisições repetidas de um mesmo IP THEN o sistema SHALL aplicar rate limiting (mesmo padrão de `POST /auth/register`, ver `review.md` da pbi-001 achado #2 e `.makuco/STATE.md`) — evita força bruta de senha.

## Cenários e2e

| ID | Requisitos verificados | Cenário |
| --- | --- | --- |
| E2E-01 | LOGIN-01 | Usuário com conta confirmada faz login com credenciais corretas e recebe access+refresh token. |
| E2E-02 | LOGIN-02 | Usuário com e-mail não confirmado tenta login e recebe bloqueio com opção de reenvio. |
| E2E-03 | LOGIN-04 | Usuário informa senha errada e recebe erro genérico (não revela se o problema é o email ou a senha). |
| E2E-04 | LOGIN-06 | Usuário apresenta refresh token válido e recebe um novo par de tokens. |
| E2E-05 | LOGIN-03 | Usuário reapresenta um refresh token já rotacionado e a sessão inteira é invalidada (próxima tentativa de refresh com qualquer token da família falha). |
| E2E-06 | LOGIN-08 | 6ª tentativa de login em menos de 60s a partir do mesmo IP recebe 429. |

**E2E-01 — Login bem-sucedido**
- **Dado** um usuário com conta confirmada (seedado ou registrado via pbi-001) existe no Supabase
- **Quando** ele envia `POST /auth/login` com email e senha corretos
- **Então** a resposta é 200/201 com `access_token` e `refresh_token`

**Fora do e2e** — verificado por teste unitário, deliberadamente não duplicado aqui:

| Requisito | Por que não é e2e |
| --- | --- |
| LOGIN-05 | Validação de payload é regra pura do `ValidationPipe`/DTO, sem travessia de camada real — unitário do DTO já cobre |

---

## Requirement Traceability

| Requirement ID | Source | Phase | Status |
| --- | --- | --- | --- |
| LOGIN-01 | CA-01 (original) | Tasks | Pending |
| LOGIN-02 | CA-02 (original) | Tasks | Pending |
| LOGIN-03 | CA-03 (original) | Tasks | Pending |
| LOGIN-04 | CA-04 (original) | Tasks | Pending |
| LOGIN-05 | Edge case | Tasks | Pending |
| LOGIN-06 | Edge case | Tasks | Pending |
| LOGIN-07 | Edge case | Tasks | Pending |
| LOGIN-08 | Edge case | Tasks | Pending |

**ID format:** `LOGIN-NN`

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** 8 total, 8 a mapear em `task.md`, 0 unmapped.

---

## Success Criteria

- [ ] Toda CA (original + edge case) tem Requirement ID e mapeia para ao menos uma task
- [ ] Todo Requirement ID que descreve um fluxo de usuário aparece num cenário `E2E-NN`, ou na tabela "Fora do e2e" com o motivo
- [ ] Nada aqui duplica o Problem Statement/Goals da feature pai — referencia em vez de copiar
