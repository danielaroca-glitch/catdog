---
name: CatDog
status: final
sources:
  - pbi.md
  - ../pbi-002-login-e-sessao-com-refresh-token/EXPERIENCE.md
updated: 2026-09-07
---

# CatDog — Espinha Dorsal de Experiência (PBI 3 — Autorização por papel e redirecionamento)

> Mecanismo de redirecionamento e bloqueio por papel. Web responsiva. shadcn/ui no Next.js + Tailwind. Vinculado a `DESIGN.md` (herda de `../pbi-001-registro-e-confirmacao-de-conta/DESIGN.md`).

[NOTE FOR UX] O conteúdo real da "área administrativa" e da "área do cliente" pertence a módulos futuros (Registro de animais, Lista pública, Gestão de solicitações, Registro de espécies — ver `scope_features_context.md`). Esta espinha dorsal cobre apenas o mecanismo de entrada (redirecionamento) e o bloqueio (acesso negado); as telas de destino serão especificadas quando esses módulos forem analisados.

## Fundação

Web responsiva, superfície única do ponto de vista desta PBI. shadcn/ui no Next.js + Tailwind CSS. O redirecionamento por papel acontece imediatamente após o login (PBI 2), sem tela intermediária.

## Arquitetura de Informação

| Superfície | Acessada de | Objetivo |
| --- | --- | --- |
| Área administrativa (placeholder) | Login bem-sucedido com papel `admin` | Destino do redirecionamento — conteúdo real fora do escopo desta PBI |
| Área do cliente (placeholder) | Login bem-sucedido com papel `adotante` | Destino do redirecionamento — conteúdo real fora do escopo desta PBI |
| Acesso negado | Tentativa de acessar rota administrativa sem papel `admin` | Informar o bloqueio de forma clara e não punitiva |

## Voz e Tom

| Faça | Evite |
| --- | --- |
| "Você não tem permissão para acessar esta página." | "Acesso proibido. Erro 403." |
| "Voltar para minha área" | "Voltar" |

## Padrões de Componentes

| Componente | Uso | Regras comportamentais |
| --- | --- | --- |
| Redirecionamento pós-login | Login → Área admin/cliente | Automático, sem interação do usuário — decidido pelo papel lido em `profiles` (CA-01). |
| Estado de acesso negado | Rota administrativa acessada por não-admin | Página inteira (não modal) com ícone neutro, mensagem clara, e um botão único "Voltar para minha área" que leva ao destino correto do papel do usuário (CA-02). |

## Padrões de Estado

| Estado | Superfície | Tratamento |
| --- | --- | --- |
| Redirecionamento em andamento | Transição pós-login | [ASSUMPTION] Transição instantânea, sem loading visível perceptível — a checagem de papel é rápida o suficiente para não precisar de skeleton/spinner dedicado. Revisar se a latência real do backend (CA-03, guard a cada requisição) exigir um estado de carregamento. |
| Acesso negado | Rota administrativa, usuário sem papel `admin` | Página de acesso negado — nunca expõe se a rota existe ou não, apenas que o usuário não tem permissão. |
| Papel inconsistente/token corrompido | Global | Fora do escopo visual desta PBI — tratado como falha de sessão (ver `../pbi-002-login-e-sessao-com-refresh-token/EXPERIENCE.md`, estado "Sessão expirada"). |

## Primitivas de Interação

Nenhuma interação especial — redirecionamento é automático; a página de acesso negado tem uma única ação primária (voltar).

## Piso de Acessibilidade

A página de acesso negado tem heading claro (`<h1>`) e foco movido para ele ao carregar, para leitores de tela anunciarem o bloqueio imediatamente. Contraste mínimo AA para o texto em `{colors.muted-foreground}`.

## Fluxos-Chave

### Redirecionamento correto — Marina entra e vê sua área

Depois de fazer login (PBI 2), Marina — uma adotante — é levada automaticamente para a área do cliente, sem nenhuma tela intermediária. O momento-clímax é a ausência de fricção: ela nem percebe que houve uma decisão de roteamento acontecendo.

### Bloqueio de acesso — Marina tenta acessar uma URL administrativa

Curiosa, Marina edita a URL para tentar acessar a área administrativa diretamente. Em vez de um erro técnico ou uma tela em branco, ela vê uma página clara: "Você não tem permissão para acessar esta página", com um botão "Voltar para minha área" que a leva de volta à área do cliente — sem confusão sobre o que aconteceu.
