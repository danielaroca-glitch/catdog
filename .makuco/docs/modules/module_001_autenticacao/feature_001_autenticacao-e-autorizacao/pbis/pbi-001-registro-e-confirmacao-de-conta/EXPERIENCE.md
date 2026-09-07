---
name: CatDog
status: final
sources:
  - pbi.md
updated: 2026-09-07
---

# CatDog — Espinha Dorsal de Experiência (PBI 1 — Registro e confirmação de conta)

> Registro e confirmação de conta. Web responsiva, superfície única. shadcn/ui no Next.js + Tailwind. Vinculado a `DESIGN.md`.

## Fundação

Web responsiva, sem app mobile nesta fase (fora de escopo do produto). shadcn/ui no Next.js + Tailwind CSS. `DESIGN.md` é a referência de identidade visual; esta espinha dorsal é a experiência.

## Arquitetura de Informação

| Superfície | Acessada de | Objetivo |
| --- | --- | --- |
| Registro | Link "Criar conta" na tela de login | Capturar nome, email, senha, confirmação de senha |
| Confirmação pendente | Redirecionamento automático pós-registro | Informar que um e-mail foi enviado, oferecer reenvio |

## Voz e Tom

Microcopy. Voz de marca e postura estética residem no `DESIGN.md`.

| Faça | Evite |
| --- | --- |
| "Confira seu e-mail para confirmar a conta." | "Yay! Quase lá! 🎉" |
| "As senhas não coincidem." | "Ops! Erro no formulário." |
| "E-mail reenviado." | "E-mail reenviado com sucesso!!!" |

## Padrões de Componentes

Comportamentais. Especificações visuais residem em `DESIGN.md.Components`.

| Componente | Uso | Regras comportamentais |
| --- | --- | --- |
| Formulário de registro | Registro | Campos: nome, email, senha, confirmação de senha. Validação de coincidência de senha no blur do campo e no submit (RN-05, CA-01). |
| Botão "Reenviar confirmação" | Confirmação pendente | Desabilitado com contagem regressiva por um cooldown curto após cada envio, para evitar reenvio abusivo. |
| Alerta de sucesso | Confirmação pendente | `{colors.success-sage}` — "Enviamos um e-mail de confirmação para {email}." |

## Padrões de Estado

| Estado | Superfície | Tratamento |
| --- | --- | --- |
| Envio em andamento | Registro | Botão "Registrar" com spinner, desabilitado — evita duplo submit. |
| Erro de senha não coincide | Registro | Texto `{colors.destructive}` abaixo do campo de confirmação de senha (CA-01). |
| Registro concluído | Registro → Confirmação pendente | Redireciona automaticamente para a tela de confirmação pendente (CA-03). |
| Link de confirmação expirado/inválido | Tela de confirmação (via link do e-mail) | Mensagem clara de link inválido + opção de solicitar novo e-mail. [ASSUMPTION] comportamento padrão do fluxo nativo do Supabase Auth assumido; não detalhado nas CAs originais — revisar quando o backend estiver implementado. |
| Tentativa de login com conta não confirmada | Fora desta PBI | Tratado no fluxo de Login (PBI 2) — apenas referenciado aqui para consistência de mensagem. |

## Primitivas de Interação

Formulário via submit padrão (Enter envia). Foco automático no campo "Nome" ao carregar a tela de registro. Sem atalhos de teclado especiais — fluxo de formulário convencional, mouse e teclado equivalentes.

## Piso de Acessibilidade

Labels associados a cada campo (`<label for>`). Mensagens de erro anunciadas via `aria-live="polite"` junto ao campo correspondente. Contraste mínimo AA para texto, estados de erro (`destructive`) e de sucesso (`success-sage`). Ordem de tab lógica: nome → email → senha → confirmação de senha → botão de submit.

## Fluxos-Chave

### Registro e confirmação — Marina se cadastra pela primeira vez

Marina descobriu o CatDog pelo Instagram da ONG e quer se cadastrar para ver os animais disponíveis para adoção. Ela acessa a tela de Registro e preenche nome, email e senha. Ao digitar a confirmação de senha diferente da senha original, vê "As senhas não coincidem" abaixo do campo — corrige, e o erro desaparece. Ela envia o formulário; o botão mostra um spinner por um instante. A tela muda para "Confirmação pendente", com a mensagem "Enviamos um e-mail de confirmação para marina@...". O momento-clímax é quando ela abre o e-mail no celular, clica no link e vê a confirmação de que sua conta está ativa — pronta para fazer login (PBI 2).
