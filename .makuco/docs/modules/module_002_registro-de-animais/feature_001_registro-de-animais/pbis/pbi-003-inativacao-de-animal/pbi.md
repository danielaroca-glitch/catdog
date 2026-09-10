---
stage: pbi
feature: registro-de-animais
pbi: inativacao-de-animal
created_at: 2026-09-10
status: done
---

# PBI: Inativação de animal

**ID:** pbi-003
**Feature pai:** feature_001 — Registro de Animais

---

## O que entrega

O administrador retira um animal da lista de disponíveis para adoção sem apagar seu registro (soft-delete), podendo reverter essa decisão (reativar) quando necessário — preserva o histórico administrativo.

## Regras de Negócio

As regras de negócio desta feature estão documentadas em `feature.md` — este PBI governa RN-01 (só admin autenticado inativa/reativa) e RN-02 (inativação é sempre soft-delete via flag, nunca exclusão física).

## Critérios de Aceite

- CA-01: Um administrador autenticado consegue inativar um animal ativo — o registro permanece no sistema, apenas deixa de contar como disponível.
- CA-02: Um administrador autenticado consegue reativar um animal previamente inativado.
- CA-03: Inativar um animal já inativo (ou reativar um já ativo) é uma operação segura/idempotente — não gera erro nem estado inconsistente.
- CA-04: Um usuário não autenticado, ou autenticado sem papel admin, recebe um erro de autorização ao tentar inativar/reativar (reusa `JwtAuthGuard`+`RolesGuard`).

## Validação INVEST

| Critério    | Status | Justificativa |
| ----------- | ------ | -------------- |
| Independent | ⚠️→✅ | Depende conceitualmente de "Alta de animal" (precisa de um animal existente para inativar), mas é testável de forma isolada com um animal seedado diretamente no banco de testes — mesmo padrão já usado no módulo de Autenticação. |
| Negotiable  | ✅ | O mecanismo exato (endpoint dedicado vs. campo genérico de status) pode ser ajustado em `spec.md` sem perder o valor central. |
| Valuable    | ✅ | O administrador ganha controle sobre o que aparece na futura vitrine pública, sem perder histórico. |
| Estimable   | ✅ | Operação simples, esforço bem conhecido. |
| Small       | ✅ | Cabe em 1-2 sprints, provavelmente o menor PBI da feature. |
| Testable    | ✅ | Critérios acima são verificáveis por teste automatizado. |

## Notas

Depende conceitualmente de "Alta de animal" (pbi-001) para existir um animal a inativar, mas é desenvolvida e testada de forma isolada com dados seedados; depende também do módulo de Autenticação e Autorização já entregue.

---

Próximo passo rode `makuco-analisar` (passo 05) para propor o próximo PBI, ou — quando todos os PBIs da feature já existirem — rode `makuco-desenvolver` passando o ID deste PBI.
