---
name: CatDog
description: Autorização por papel e redirecionamento. Herda integralmente a identidade visual definida na PBI 1 (terracota/sage sobre shadcn) — apenas um componente novo (estado de acesso negado).
sources:
  - ../pbi-001-registro-e-confirmacao-de-conta/DESIGN.md
components:
  access-denied-icon:
    color: '{colors.muted-foreground}'
---

## Marca & Estilo

Esta PBI não introduz identidade visual nova — reutiliza integralmente `../pbi-001-registro-e-confirmacao-de-conta/DESIGN.md`. O único componente específico é o estado de "Acesso negado", tratado como neutro (não é um erro de formulário nem uma falha do sistema), usando tons `muted` do shadcn em vez de `{colors.destructive}`.

## Componentes

- **Estado de acesso negado**: ícone e texto em `{colors.muted-foreground}` — neutro, não punitivo. Não usa `{colors.destructive}` (isso é reservado a erros de formulário/credenciais, não a uma tentativa de navegação bloqueada).
