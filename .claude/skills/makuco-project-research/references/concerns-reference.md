# Concerns Reference

**Purpose:** Document cross-cutting concerns — auth, logging, errors, validation, caching, i18n, security, performance.

**Size limit:** 2,500 tokens (~1,500 words)

**Extract from:**

- Declared dependencies (they name the auth, validation, logging and security libraries before any code is read)
- Up to **6** files — at most **one per concern category**: middleware/guard, logger, validation schema, cache, i18n, security config

**Input cap:** 10 files, 6 searches, 30 results each.

One search per category, capped. A category with no hit in its one search is **omitted** from the output — that is the same discipline as the "omit empty sections" rule below, and it is cheaper than proving an absence.

Template and guidance for documenting cross-cutting concerns in `<CODEBASE_DIR>/concerns.md`.

## Template

```markdown
# Cross-Cutting Concerns

## Authentication & Authorization

- **Strategy**: JWT / Session / OAuth 2.0 / API Key
- **Implementation**: [Library or custom — e.g., Passport.js, next-auth, custom middleware]
- **Location**: [Path to auth middleware, guards, or decorators]
- **Authorization model**: RBAC / ABAC / ACL / Custom
- **Token storage**: HTTP-only cookies / localStorage / sessionStorage

## Error Handling

- **Global handler**: [Path to global error handler or middleware]
- **Custom error classes**: [Path to error class definitions]
- **Error response format**:
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Resource not found",
      "details": []
    }
  }
  ```
- **Unhandled errors**: [How are unhandled exceptions caught? Process-level handler?]

## Logging

- **Library**: Winston / Pino / Bunyan / console / custom
- **Format**: JSON structured / Plain text
- **Levels**: error, warn, info, debug
- **Location**: [Path to logger configuration]
- **Destination**: stdout / file / external service (CloudWatch, Datadog)

## Validation

- **Library**: Zod / Joi / class-validator / Yup / custom
- **Where applied**: Request DTOs / Service layer / Both
- **Location**: [Path to validation schemas or decorators]

## Caching

- **Strategy**: In-memory / Redis / CDN / HTTP cache headers
- **Cache invalidation**: TTL / Event-based / Manual
- **Location**: [Path to cache configuration or decorators]

## Security

- **CORS**: [Configuration location and allowed origins strategy]
- **Rate limiting**: [Library and configuration — e.g., express-rate-limit]
- **Input sanitization**: [Approach — e.g., DOMPurify, helmet, custom middleware]
- **HTTPS**: [Enforced at app level or infrastructure level?]
- **CSP**: [Content Security Policy configuration location if applicable]

## Internationalization (i18n)

- **Library**: i18next / react-intl / vue-i18n / custom
- **Default locale**: pt-BR / en-US
- **Translation files location**: [Path to translation files]
- **Strategy**: Key-based / ICU message format

## Performance

- **Lazy loading**: [How and where — e.g., React.lazy, dynamic imports]
- **Code splitting**: [Bundler configuration for splitting]
- **Pagination**: [Strategy — cursor-based / offset-based, default page size]
- **Database optimization**: [Indexes strategy, query optimization patterns]
```

## Field Guidance

- **Location**: Always include the file path where the concern is configured or implemented. This is the most useful information for agents.
- **Strategy**: Name the specific approach, not just the concept. "JWT with refresh tokens stored in HTTP-only cookies" is more useful than "Token-based auth".
- **Libraries**: Include the actual package name so agents can look up the correct API.
- **Omit empty sections**: If the project doesn't have i18n or caching, omit those sections entirely rather than writing "Not implemented".

## Where to Find This Information

| Source | What it reveals |
|--------|----------------|
| Middleware chain / pipeline | Auth, logging, error handling, validation |
| `src/middleware/`, `src/guards/` | Security and auth implementations |
| Logger imports and configuration | Logging approach |
| Validation schema files | Validation library and patterns |
| `helmet`, `cors`, `rate-limit` imports | Security middleware |
| `i18n` or `locale` folders | Internationalization setup |
| Route definitions with decorators | Per-route concerns (auth, cache, validation) |
