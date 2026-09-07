# Log de Decisões — Autenticação e Autorização

> Decisões detalhadas desta feature. Para resumo, veja `feature.md#Decisões Chave`.

## DEC-01 Estratégia de autenticação e autorização

**Data:** 2026-09-07
**Status:** Aceita

**Contexto:** O projeto CatDog precisa de autenticação e autorização por papel (admin/adotante) e a stack já decidida inclui Supabase (banco, auth e storage). Era preciso decidir quem cuida da identidade/sessão e onde vive o papel do usuário.

**Opções avaliadas:**
- A) Supabase Auth puro, papel em `app_metadata`: baixo custo, mas papel preso ao formato do Supabase, menos flexível para evoluir permissões.
- B) Supabase Auth (identidade/sessão/refresh) + tabela própria `profiles` para o papel: custo médio, mais flexível, papel desacoplado do provedor de identidade.
- C) Autenticação 100% custom no NestJS (bcrypt + JWT + refresh próprios): controle total, mas custo e risco altos, reimplementa o que o Supabase já resolve.

**Escolha:** B — Supabase Auth + tabela `profiles`.

**Motivo:** Aproveita a sessão/refresh/confirmação de e-mail que o Supabase já entrega nativamente, evitando reimplementação, enquanto mantém o papel do usuário em uma tabela própria — mais flexível para evoluir regras de autorização sem depender do formato de metadados do provedor de identidade.

**Impactos:** Precisa de um trigger/hook no signup do Supabase para criar automaticamente a linha em `profiles`. O envio do e-mail de confirmação usa o fluxo nativo do Supabase, não o Resend (decisão que pode ser revisitada em feature futura se for necessário e-mail transacional customizado).
