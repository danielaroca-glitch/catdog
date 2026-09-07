---
name: CatDog
description: Login e sessão. Herda integralmente a identidade visual definida na PBI 1 (terracota/sage sobre shadcn) — nenhum token novo necessário para esta PBI.
sources:
  - ../pbi-001-registro-e-confirmacao-de-conta/DESIGN.md
---

## Marca & Estilo

Esta PBI não introduz nenhuma decisão visual nova. A tela de Login reutiliza integralmente os tokens e componentes definidos em `../pbi-001-registro-e-confirmacao-de-conta/DESIGN.md` — mesmo `{colors.primary}` terracota, mesmo `{colors.destructive}` herdado do shadcn para erros, mesmo `Card` centralizado em `max-w-sm`. Consulte esse documento como fonte canônica dos tokens; este arquivo existe apenas para registrar as decisões de composição específicas da tela de Login.

## Componentes

- **Botão primário "Entrar"**: `{colors.primary}` / `{colors.primary-foreground}` — mesmo tratamento do botão "Registrar" da PBI 1.
- **Alerta de bloqueio por e-mail não confirmado**: variante neutra/informativa do `Alert` do shadcn — não é erro do usuário nem confirmação de sucesso, então não usa `{colors.destructive}` nem `{colors.success-sage}`.
- **Texto de erro de credenciais inválidas**: `{colors.destructive}` — mesmo padrão de erro de formulário da PBI 1.
