# CatDog

Plataforma de adoção de animais para uma ONG — centraliza o cadastro de pets disponíveis e, nas próximas etapas, a vitrine pública e a gestão de solicitações de adoção.

> **Status: Beta.** Este release resolve a dor mais urgente da ONG — sair de planilhas/mensagens dispersas para um cadastro único, seguro e controlado por papel — e já pode ser colocado em uso pela equipe administrativa. As demais features do roadmap (vitrine pública, gestão de solicitações, espécies) são incrementos planejados para os próximos ciclos, não bloqueadores deste lançamento.

## Por que este beta já entrega valor

Hoje a ONG depende de canais dispersos (planilhas, WhatsApp) para saber quais animais estão disponíveis. Este beta resolve exatamente esse ponto: a equipe administrativa passa a ter login seguro, controle de acesso por papel e um cadastro único e confiável dos animais — a base sobre a qual a vitrine pública e a gestão de solicitações (próximos ciclos) vão ser construídas sem retrabalho.

## Stack

- **Backend**: NestJS + Supabase (Auth + Postgres)
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind + shadcn/ui

## O que já está no beta

### Autenticação e Autorização
- Registro e confirmação de conta por e-mail
- Login com sessão JWT + refresh token rotativo (proteção contra reuso de token)
- Autorização por papel (admin / adotante) com redirecionamento pós-login

### Registro de animais
- Cadastro de animais (nome + espécie, validada contra uma lista seedada)
- Edição de animais existentes (incluindo troca de espécie)
- Inativação/reativação de animal (soft-delete — nunca exclusão física, preserva histórico)
- Telas administrativas: listagem, cadastro e edição (`/admin/animais`)

Ambas as features passaram pelo ciclo completo de desenvolvimento (spec → implementação com testes reais → code review → documentação), incluindo testes e2e contra um projeto Supabase real — a base já sai testada, não só funcional.

## Próximos passos do roadmap

Com o núcleo administrativo no ar, os próximos incrementos planejados são:

- **Lista pública de animais disponíveis** — a vitrine para os clientes finais, consumindo o mesmo cadastro já construído
- **Gestão de solicitações de adoção** — fluxo de análise e decisão sobre pedidos recebidos
- **Registro completo de espécies** — hoje uma lista mínima seedada, evolui para gestão própria sem precisar migrar dados
- Recuperação de senha

Fora de escopo do produto (decisão deliberada, não uma lacuna): pagamentos, notificações e integrações externas.

## Rodando localmente

```bash
# Backend
cd services/backend
npm install
npm run start:dev

# Frontend
cd services/frontend
npm install
npm run dev
```

Ambos os serviços exigem um projeto Supabase configurado (ver `.env.example` em cada serviço).
