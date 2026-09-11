# Integrations

## Databases

- **Supabase Postgres** — único banco de dados do projeto. Tabelas próprias: `profiles` (papel do usuário, populada por trigger no signup), `species` (seed fixo), `animals` (FK para `species`). Acesso via `@supabase/supabase-js`, nunca SQL direto/driver Postgres no código da aplicação (migrations são o único lugar com SQL cru).

## External APIs / Auth Provider

- **Supabase Auth (GoTrue)** — identidade, sessão, refresh token rotativo. JWT assinado com chave assimétrica (ES256/JWKS, `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`) — não HS256/segredo compartilhado, apesar de `SUPABASE_JWT_SECRET` existir no `.env` (contém o `kid` da chave, não um segredo utilizável).

## Message Brokers / Cloud Services

Nenhum.

## Monitoring & Observability

- **SonarQube** — análise de qualidade estática (issues, duplicação, cobertura nova) via `sonar-project.properties` na raiz. Scanner rodado via `npx @sonar/scan` (alternativa sem Docker) ou via `sonar-run`/`get-sonar-issues` do `makuco-mcp` quando o Docker Desktop está disponível.
- Nenhum logger estruturado, APM ou error tracker (Sentry/Datadog/etc.) configurado em nenhum dos dois serviços.

## CI/CD

Nenhum pipeline de CI configurado (sem `.github/workflows/`, sem Azure Pipelines/GitLab CI/Jenkinsfile no repositório). Gates de qualidade rodam localmente/manualmente (ver `testing.md`).

## Infrastructure as Code

Nenhuma (sem Terraform/Pulumi/CloudFormation) — a única infraestrutura externa é o projeto Supabase, provisionado manualmente fora deste repositório.

## Variáveis de ambiente

| Variável | Serviço | Uso |
| --- | --- | --- |
| `SUPABASE_URL` | backend | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | Chave service-role (bypassa RLS) — usada pelo `SUPABASE_CLIENT` singleton |
| `SUPABASE_JWT_SECRET` | backend | Contém o `kid` da chave JWKS (não um segredo HS256 usável) |
| `FRONTEND_URL` | backend | Origem permitida no CORS |
| `PORT` | backend | Porta HTTP (default 3001) |
| `NEXT_PUBLIC_API_URL` | frontend | Base URL da API backend consumida pelo browser |

Ver `.env.example` em cada serviço.
