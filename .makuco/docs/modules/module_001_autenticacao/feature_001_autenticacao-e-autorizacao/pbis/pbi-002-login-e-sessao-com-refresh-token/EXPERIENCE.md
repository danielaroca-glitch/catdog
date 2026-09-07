---
name: CatDog
status: final
sources:
  - pbi.md
  - ../pbi-001-registro-e-confirmacao-de-conta/EXPERIENCE.md
updated: 2026-09-07
---

# CatDog — Espinha Dorsal de Experiência (PBI 2 — Login e sessão com refresh token)

> Login e gestão de sessão. Web responsiva, superfície única. shadcn/ui no Next.js + Tailwind. Vinculado a `DESIGN.md` (que herda os tokens de `../pbi-001-registro-e-confirmacao-de-conta/DESIGN.md`).

## Fundação

Web responsiva, sem app mobile nesta fase. shadcn/ui no Next.js + Tailwind CSS. A gestão de sessão (access/refresh token) é invisível ao usuário — acontece em segundo plano; esta espinha dorsal cobre a superfície de Login e os estados visíveis derivados da sessão.

## Arquitetura de Informação

| Superfície | Acessada de | Objetivo |
| --- | --- | --- |
| Login | Rota raiz não autenticada / link "Entrar" | Capturar email e senha, iniciar sessão |
| (Sem superfície própria) Renovação de sessão | Automática, em segundo plano | Trocar refresh token por um novo par de tokens antes da expiração |

A tela de Login é o ponto de entrada para usuários não autenticados; após o sucesso, o redirecionamento por papel é tratado na PBI 3.

## Voz e Tom

| Faça | Evite |
| --- | --- |
| "E-mail ou senha incorretos." | "Credenciais inválidas. Tente novamente." |
| "Confirme seu e-mail para continuar." | "Conta não verificada!" |
| "Sua sessão expirou. Entre novamente." | "Erro de autenticação (401)." |

## Padrões de Componentes

| Componente | Uso | Regras comportamentais |
| --- | --- | --- |
| Formulário de login | Login | Campos: email, senha. Submit desabilitado enquanto algum campo está vazio. |
| Alerta "e-mail não confirmado" | Login | Aparece inline acima do formulário quando `CA-02` dispara; inclui link/botão "Reenviar confirmação" (reaproveita o padrão da PBI 1). |
| Link "Criar conta" | Login | Leva à tela de Registro da PBI 1. |

## Padrões de Estado

| Estado | Superfície | Tratamento |
| --- | --- | --- |
| Envio em andamento | Login | Botão "Entrar" com spinner, desabilitado — evita duplo submit. |
| Credenciais inválidas | Login | Texto `{colors.destructive}` genérico acima do formulário — nunca indica qual campo está errado (CA-04). |
| E-mail não confirmado | Login | Alerta neutro com opção de reenvio, em vez do erro genérico (CA-02, RN-02). |
| Login bem-sucedido | Login → redirecionamento por papel | Sem tela intermediária — a decisão de destino é da PBI 3. |
| Sessão expirada durante uso | Global | Se a renovação automática (refresh) falhar por token reutilizado/inválido (RN-03), a sessão é encerrada e o usuário é redirecionado ao Login com a mensagem "Sua sessão expirou. Entre novamente." [ASSUMPTION] Momento exato de verificação (a cada requisição vs. periódica) é decisão técnica da PBI de desenvolvimento, não desta espinha dorsal. |

## Primitivas de Interação

Formulário via submit padrão (Enter envia). Foco automático no campo "Email" ao carregar a tela. Renovação de sessão é inteiramente invisível — nenhuma interação do usuário a menos que falhe.

## Piso de Acessibilidade

Labels associados a cada campo. Mensagem de erro/alerta anunciada via `aria-live="polite"`. Contraste mínimo AA para o alerta neutro e o texto de erro. Ordem de tab lógica: email → senha → submit → "Criar conta".

## Fluxos-Chave

### Login e sessão — Marina volta ao CatDog no dia seguinte

Marina confirmou sua conta ontem (PBI 1) e volta hoje para ver os animais disponíveis. Ela acessa a tela de Login, informa email e senha, e clica em "Entrar". O botão mostra um spinner por um instante — o momento-clímax é a transição imediata para a área do cliente, sem fricção, já autenticada. Dias depois, sua sessão é renovada automaticamente em segundo plano sem que ela perceba; só se algo der errado (token reutilizado) ela é levada de volta ao Login com uma mensagem clara.

### Bloqueio por e-mail não confirmado — Pedro tenta entrar cedo demais

Pedro se registrou mas ainda não abriu o e-mail de confirmação. Ele tenta fazer login e, em vez do formulário simplesmente falhar, vê um alerta claro: "Confirme seu e-mail para continuar", com um botão para reenviar a confirmação — sem precisar adivinhar o que deu errado.
