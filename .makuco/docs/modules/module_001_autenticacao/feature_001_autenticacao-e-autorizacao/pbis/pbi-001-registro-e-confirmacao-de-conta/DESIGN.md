---
name: CatDog
description: Plataforma de adoção de animais de uma ONG única. shadcn/ui no Next.js + Tailwind — este DESIGN.md especifica o delta de marca sobre os padrões shadcn. [ASSUMPTION] shadcn/ui assumido como sistema de componentes por ser o padrão idiomático do stack já decidido (Next.js); não confirmado com o time.
colors:
  # Sobrescritas de marca sobre os padrões shadcn. Tokens não listados (background,
  # foreground, muted, muted-foreground, popover, card, border, input, ring,
  # destructive) herdam do shadcn.
  primary: '#D97706'
  primary-foreground: '#FFFFFF'
  primary-dark: '#F59E0B'
  primary-foreground-dark: '#1A1208'
  success-sage: '#15803D'
  success-sage-dark: '#4ADE80'
typography:
  # Body/label/caption herdam a escala padrão do shadcn (Geist Sans). Nenhuma
  # sobrescrita nesta PBI.
rounded:
  # Padrões shadcn herdados como estão.
spacing:
  # Padrões shadcn / Tailwind herdados como estão.
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
  success-alert:
    background: '{colors.success-sage}'
    foreground: '{colors.primary-foreground}'
  form-error-text:
    color: '{colors.destructive}'
---

## Marca & Estilo

CatDog é uma plataforma de adoção de animais operada por uma única ONG. Quem chega ao formulário de registro está prestes a iniciar um processo real de adoção — a marca precisa comunicar acolhimento e confiança, sem infantilizar a experiência. [ASSUMPTION] Paleta e tom de marca aqui propostos ainda não foram validados com a ONG/PO; servem como ponto de partida editável para a primeira tela com UI do projeto.

CatDog herda integralmente os padrões do shadcn/ui. Este documento especifica apenas os deltas de marca — uma cor primária calorosa e uma cor de sucesso usada exclusivamente em confirmações reais. Componentes de formulário (Input, Button, Form, Alert, Label) vêm do shadcn como estão.

## Cores

- **Primary Terracotta (`#D97706` claro / `#F59E0B` escuro)** é a cor de marca — calorosa e acolhedora, evocando cuidado e adoção. Usada em botões primários (Registrar, Confirmar, Reenviar) e em links de destaque. Substitui o `primary` padrão do shadcn.
- **Success Sage (`#15803D` claro / `#4ADE80` escuro)** é usada exclusivamente para confirmar sucesso real (ex.: "e-mail enviado", conta confirmada). Nunca decorativa, nunca usada em chrome.
- **Todos os outros tokens** (`background`, `foreground`, `muted`, `border`, `input`, `ring`, `card`, `destructive`) herdam os padrões do shadcn — inclusive `destructive` para mensagens de erro de formulário.

Evite: mais de duas cores de marca, uso decorativo do sage fora de confirmações reais, cores customizadas de erro (use `destructive` do shadcn).

## Tipografia

Herdada integralmente do shadcn (Geist Sans). Nenhuma sobrescrita nesta PBI — o fluxo de registro não pede um momento editorial próprio.

## Layout & Espaçamento

Formulário centralizado em um único `Card`, largura máxima `max-w-sm` (384px). Escala de espaçamento shadcn/Tailwind padrão (4, 8, 12, 16, 20, 24, 32).

## Elevação & Profundidade

Herdada do shadcn — sombra sutil padrão do `Card`, sem elevação adicional.

## Formas

`rounded/md` padrão do shadcn para inputs, botões e o card do formulário — nenhuma sobrescrita.

## Componentes

- **Botão primário**: fundo `{colors.primary}`, texto `{colors.primary-foreground}`.
- **Texto de erro de formulário**: `{colors.destructive}` (herdado do shadcn), exibido abaixo do campo correspondente.
- **Alerta de sucesso** (e-mail enviado): fundo `{colors.success-sage}`, texto `{colors.primary-foreground}`, ícone de check.

## Do's e Don'ts

- Faça: use terracotta apenas em ações primárias (um botão primário por tela).
- Faça: reserve sage exclusivamente para confirmações reais de sucesso.
- Não faça: não invente uma terceira cor de marca sem justificativa.
- Não faça: não customize os componentes shadcn herdados (Input, Button, Card, Alert) além dos tokens acima.
