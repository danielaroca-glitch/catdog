# CatDog

Plataforma de adoção de animais — cadastro de pets, vitrine pública e gestão de solicitações de adoção para uma ONG.

> **Status: Beta / MVP.** Projeto de prática/treinamento interno, não destinado a uso real em produção. O escopo abaixo reflete o que foi efetivamente construído, não uma promessa de roadmap.

## Stack

- **Backend**: NestJS + Supabase (Auth + Postgres)
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind + shadcn/ui

## O que está implementado

### Autenticação e Autorização
- Registro e confirmação de conta por e-mail
- Login com sessão JWT + refresh token rotativo (proteção contra reuso de token)
- Autorização por papel (admin / adotante) com redirecionamento pós-login

### Registro de animais
- Cadastro de animais (nome + espécie, validada contra uma lista seedada)
- Edição de animais existentes (incluindo troca de espécie)
- Inativação/reativação de animal (soft-delete — nunca exclusão física)
- Telas administrativas: listagem, cadastro e edição (`/admin/animais`)

Ambas as features passaram pelo ciclo completo do processo de desenvolvimento usado neste projeto (spec → implementação com testes reais → code review → documentação), incluindo testes e2e contra um projeto Supabase real.

## O que NÃO está implementado (fora do escopo deste beta)

Do roadmap de produto original, os itens abaixo não foram iniciados:

- Lista pública de animais disponíveis (vitrine para clientes finais)
- Gestão de solicitações de adoção
- Registro/gestão completa de espécies (hoje é uma tabela mínima com seed fixo)
- Recuperação de senha
- Qualquer forma de pagamento, notificação ou integração externa (explicitamente fora de escopo desde o início)

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
