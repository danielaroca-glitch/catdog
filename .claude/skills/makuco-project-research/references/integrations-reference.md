# Integrations Reference

**Purpose:** Document external dependencies — databases, APIs, brokers, cloud services, CI/CD.

**Size limit:** 2,000 tokens (~1,200 words)

**Extract from:**

- **Declared dependencies** in the manifests the inventory listed — this is the primary source for which SDKs and clients exist
- `.env.example` / `.env.sample`, `docker-compose.yml`
- Up to **4** CI/CD and IaC files
- Integration config code (`src/config/`, `src/infra/`) only when a dependency's purpose is otherwise unclear

**Input cap:** 10 files, 6 searches, 30 results each.

The SDK inventory comes from **declared dependencies**, not from a repo-wide import sweep. When you do need to know whether a declared package is actually wired up, use one alternation search over the package names (`rg -l --max-count 1 -e '<pkg-a>' -e '<pkg-b>' | head -30`) — not one search per package.

Template and guidance for documenting project integrations in `<CODEBASE_DIR>/integrations.md`.

## Template

```markdown
# Integrations

## Databases

| Database | Client/ORM | Config Location | Purpose |
|----------|-----------|-----------------|---------|
| PostgreSQL | Prisma | prisma/schema.prisma | Primary data store |
| Redis | ioredis | src/config/redis.ts | Caching and sessions |

## External APIs

| Service | SDK/Client | Base URL Env Var | Purpose |
|---------|-----------|------------------|---------|
| Stripe | @stripe/stripe-node | STRIPE_API_URL | Payment processing |
| SendGrid | @sendgrid/mail | SENDGRID_API_KEY | Transactional emails |

## Authentication Providers

| Provider | Protocol | Config Location | Purpose |
|----------|----------|-----------------|---------|
| Auth0 | OAuth 2.0 / OIDC | src/config/auth.ts | User authentication |
| Google | OAuth 2.0 | .env (GOOGLE_CLIENT_ID) | Social login |

## Message Brokers / Queues

| Broker | Client | Config Location | Purpose |
|--------|--------|-----------------|---------|
| RabbitMQ | amqplib | src/infra/messaging/ | Async event processing |
| SQS | @aws-sdk/client-sqs | src/config/aws.ts | Background jobs |

## Cloud Services

| Service | SDK | Purpose |
|---------|-----|---------|
| S3 | @aws-sdk/client-s3 | File storage |
| CloudWatch | @aws-sdk/client-cloudwatch | Monitoring |

## CI/CD

| Platform | Config File | Key Stages |
|----------|-------------|------------|
| GitHub Actions | .github/workflows/*.yml | lint, test, build, deploy |
| Azure DevOps | azure-pipelines.yml | build, test, deploy |

## Monitoring & Observability

| Tool | Integration Point | Purpose |
|------|-------------------|---------|
| Sentry | src/config/sentry.ts | Error tracking |
| Datadog | dd-trace import | APM and tracing |

## Environment Variables

List the key environment variables that configure integrations (from .env.example or similar):

| Variable | Integration | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL | Yes |
| REDIS_URL | Redis | Yes |
| STRIPE_SECRET_KEY | Stripe | Yes |
| SENTRY_DSN | Sentry | No |
```

## Field Guidance

- **Config Location**: Point to the actual file where the integration is configured or the client is instantiated.
- **Base URL Env Var**: For external APIs, note which environment variable holds the URL — this prevents hardcoded values.
- **Environment Variables**: Only list variables related to integrations. General app config (PORT, NODE_ENV) belongs in conventions.
- **Required**: Mark whether the integration is required for the app to start or optional (graceful degradation).

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| `.env.example`, `.env.sample` | Required environment variables |
| `docker-compose.yml` | Infrastructure dependencies (DB, Redis, queues) |
| Package dependencies | SDKs and clients in use |
| `src/config/`, `src/infra/` | Integration configuration code |
| CI/CD pipeline files | Build and deployment integrations |
| Import statements for SDKs | Which services are actually used in code |
