# STATE — CatDog

## Recent Decisions

- **2026-09-07** — Autenticação e autorização do projeto: Supabase Auth cuida de identidade/sessão/refresh; uma tabela própria `profiles` guarda o papel do usuário (admin/adotante). Qualquer módulo futuro que precise checar papel deve seguir este mesmo padrão (ver `modules/module_001_autenticacao/feature_001_autenticacao-e-autorizacao/decisions.md#DEC-01`).
- **2026-09-07** — Sistema de componentes do frontend assumido como shadcn/ui sobre Next.js + Tailwind, por ser o padrão idiomático do stack já decidido. Ainda não confirmado formalmente com o time — ver open question abaixo.
- **2026-09-07** — Paleta de marca inicial (terracota `#D97706` + sage `#15803D`) proposta como ponto de partida em `pbis/pbi-001-registro-e-confirmacao-de-conta/DESIGN.md` — não existia identidade visual prévia no projeto.

## Deferred Ideas (fora de escopo desta feature)

- Recuperação de senha ("esqueci minha senha") — vira PBI futuro dentro do módulo de Autenticação.
- Criação de conta admin pela própria plataforma (fluxo de convite) — hoje é seed manual, fora de escopo.
- E-mails transacionais customizados via Resend — a feature de Autenticação usa o fluxo nativo do Supabase para o e-mail de confirmação; Resend fica reservado para features futuras que precisem de e-mail com marca própria.

## Open Questions

- Validar a paleta de marca (terracota/sage) e o sistema de componentes (shadcn/ui) com a ONG/PO — nenhuma identidade visual formal existia antes da feature de Autenticação.
