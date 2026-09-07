# Registro e confirmação de conta — Dev Spec

**Parent Feature**: `../../feature.md` (Autenticação e Autorização) — ver lá o problema/objetivo completos, não repetidos aqui.
**Work-item**: nenhum (local-only) · **PBI**: pbi-001-registro-e-confirmacao-de-conta

## Scope

Registro de um novo usuário (nome, email, senha, confirmação de senha) via Supabase Auth, criação automática do seu papel (`adotante`) na tabela `profiles`, e envio do e-mail de confirmação nativo do Supabase.

## Out of Scope

| Item | Reason |
| --- | --- |
| Login | PBI 2 (login-e-sessao-com-refresh-token) |
| Redirecionamento por papel | PBI 3 (autorizacao-por-papel-e-redirecionamento) |
| Recuperação de senha | Fora de escopo da feature (ver `feature.md#Escopo`) |
| E-mail de confirmação customizado (Resend) | Decisão DEC-01 — usa o fluxo nativo do Supabase por ora |

---

## Acceptance Criteria

Source: PBI artifact (`pbi.md`) de `makuco-analisar`. Tratados como imutáveis — normalizados aqui em WHEN/THEN/SHALL, não re-derivados.

1. REG-01: WHEN o usuário envia o formulário de registro com senha e confirmação de senha diferentes THEN o sistema SHALL bloquear o registro e exibir uma mensagem de erro indicando que as senhas não coincidem.
2. REG-02: WHEN o usuário envia o formulário de registro com dados válidos (nome, email, senha e confirmação coincidentes) THEN o sistema SHALL criar o usuário no Supabase Auth e SHALL criar automaticamente uma linha correspondente na tabela `profiles` com papel `adotante`.
3. REG-03: WHEN um novo usuário é registrado com sucesso THEN o sistema SHALL enviar um e-mail de confirmação com link ao endereço informado.
4. REG-04: WHEN a conta ainda não teve seu e-mail de confirmação acessado THEN o sistema SHALL manter a conta em estado não confirmado (a aplicação desse estado no login é verificada no PBI 2).

## Edge Cases

Surfaced while writing this spec — não presentes nas CA originais.

- REG-05: WHEN o e-mail informado no registro já está cadastrado THEN o sistema SHALL rejeitar o registro com mensagem clara, sem revelar se a conta existente está confirmada ou não (evita enumeração de contas).
- REG-06: WHEN o formato do e-mail informado é inválido THEN o sistema SHALL bloquear o envio no frontend com erro de validação, sem chamar o backend.
- REG-07: WHEN a senha informada tem menos de 8 caracteres THEN o sistema SHALL bloquear o registro com mensagem de erro específica. (Confirmado com o usuário — não estava definido em nenhum artefato upstream.)
- REG-08: WHEN a criação do usuário no Supabase Auth é bem-sucedida mas a criação da linha em `profiles` falha THEN o sistema SHALL tratar a falha de forma que nenhum usuário fique autenticável sem papel definido (rollback ou reconciliação).
- REG-09: WHEN o Supabase falha ao enviar o e-mail de confirmação THEN o sistema SHALL informar ao usuário que o registro foi criado mas o e-mail pode não ter chegado, oferecendo reenvio.

## Cenários e2e

| ID | Requisitos verificados | Cenário |
| --- | --- | --- |
| E2E-01 | REG-02, REG-03, REG-04 | Fluxo feliz: usuário preenche o formulário com dados válidos, a conta é criada com papel `adotante`, um e-mail de confirmação é enviado, e a conta permanece não confirmada até o link ser acessado. |
| E2E-02 | REG-01 | Usuário informa senha e confirmação diferentes; o formulário é bloqueado com mensagem de erro, sem chamada ao backend. |
| E2E-03 | REG-05 | Usuário tenta registrar um e-mail já cadastrado; o registro é rejeitado com mensagem clara. |

**E2E-01 — Registro com sucesso**
- **Dado** um visitante não autenticado na tela de Registro
- **Quando** ele preenche nome, email, senha e confirmação de senha válidos e coincidentes, e envia o formulário
- **Então** a conta é criada com papel `adotante`, um e-mail de confirmação é enviado, e o usuário é redirecionado à tela de confirmação pendente

**E2E-02 — Senhas não coincidem**
- **Dado** um visitante na tela de Registro
- **Quando** ele preenche senha e confirmação de senha diferentes e envia
- **Então** o formulário exibe "As senhas não coincidem" e nenhuma chamada é feita ao backend

**E2E-03 — E-mail já cadastrado**
- **Dado** um e-mail já registrado no sistema
- **Quando** um visitante tenta se registrar com esse mesmo e-mail
- **Então** o registro é rejeitado com uma mensagem clara, sem indicar se a conta existente está confirmada

**Fora do e2e** — verificado por teste unitário/integração, deliberadamente não duplicado aqui:

| Requisito | Por que não é e2e |
| --- | --- |
| REG-06 | Validação pura de formato de e-mail no cliente — sem travessia de camada, unitário já cobre |
| REG-07 | Regra pura de validação de senha — unitário já cobre |
| REG-08 | Cenário de falha de infraestrutura (rede/DB) — instável em e2e real, coberto por teste de integração com mocks |
| REG-09 | Depende de falha do serviço externo de e-mail — coberto por teste unitário/integração com mock do client Supabase |

---

## Requirement Traceability

| Requirement ID | Source | Phase | Status |
| --- | --- | --- | --- |
| REG-01 | CA (original) | Verified | Verified (backend — E2E-02, T7; client-side — T8) |
| REG-02 | CA (original) | Verified | Verified (E2E-01, T4+T7+T9) |
| REG-03 | CA (original) | Verified | Verified (E2E-01, T7; UI — T10) |
| REG-04 | CA (original) | Verified | Verified (E2E-01, T7; UI — T10) |
| REG-05 | Edge case | Verified | Verified (E2E-03, T7; UI — T9) |
| REG-06 | Edge case | Verified | Verified (client-side, T8) |
| REG-07 | Edge case | Verified | Verified (backend — T5; client-side — T8) |
| REG-08 | Edge case | Verified | Verified (unit, T6) |
| REG-09 | Edge case | Verified | Documentado como limitação conhecida (T7, T10) — Supabase Admin API não expõe status de envio do e-mail; reenvio hoje é só cooldown visual |

**ID format:** `REG-NN`

**Status values:** Pending → In Tasks → Implementing → Verified

**Coverage:** 9 total, 9 implementadas e verificadas, 0 sem mapeamento

---

## Success Criteria

- [ ] Toda CA (original + edge cases) tem Requirement ID e mapeia para ao menos uma task
- [ ] Todo Requirement ID que descreve um fluxo de usuário aparece em um cenário `E2E-NN`, ou na tabela "Fora do e2e" com o motivo
- [ ] Nada aqui duplica o Problema/Objetivo do `feature.md` — apenas referenciado
