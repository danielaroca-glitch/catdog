/**
 * Cliente da API de autenticação (REG-02, REG-05, LOGIN-01, LOGIN-02,
 * LOGIN-04).
 *
 * Fala com `POST /auth/register` e `POST /auth/login` do backend NestJS
 * (`services/backend/src/auth/auth.controller.ts`). O shape dos payloads
 * espelha 1:1 os DTOs do backend (`RegisterDto`/`LoginDto`) — não há
 * divergência de nomes de campo entre os dois lados, então nenhum
 * mapeamento é necessário aqui.
 */

const DEFAULT_API_URL = "http://localhost:3001"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL

export interface RegisterPayload {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
}

export type UserRole = "admin" | "adotante"

export interface RegisteredUser {
  id: string
  email: string
  role: UserRole
}

const GENERIC_ERROR_MESSAGE =
  "Não foi possível concluir o cadastro. Tente novamente mais tarde."

/**
 * Erro tipado lançado por `registerUser`/`loginUser` para qualquer resposta
 * HTTP não-2xx, carregando o status para que quem chama possa decidir o
 * tratamento (ex.: 409 = e-mail já cadastrado, REG-05; 403 + `code` =
 * e-mail não confirmado, LOGIN-02). `code` é opcional porque só os erros de
 * domínio do backend (ver `EmailNotConfirmedException`) o populam no corpo
 * da resposta — a maioria dos erros HTTP não tem essa distinção.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

interface ParsedErrorBody {
  readonly message?: string
  readonly code?: string
}

/**
 * Faz a única leitura do corpo JSON de uma resposta de erro, extraindo
 * `message` e `code` quando presentes. Fatorado de `extractErrorMessage`
 * (T8) para que `loginUser` também consiga ler `code` (necessário para
 * distinguir e-mail não confirmado de credenciais inválidas, LOGIN-02) sem
 * chamar `response.json()` duas vezes — o que lançaria em um `Response` real
 * (corpo já consumido).
 */
async function parseErrorBody(response: Response): Promise<ParsedErrorBody> {
  try {
    const data: unknown = await response.json()
    if (data && typeof data === "object") {
      const body = data as { message?: unknown; code?: unknown }
      return {
        message: typeof body.message === "string" ? body.message : undefined,
        code: typeof body.code === "string" ? body.code : undefined,
      }
    }
  } catch {
    // Corpo não é JSON válido (ou vazio) — cai no fallback de quem chamar.
  }

  return {}
}

async function extractErrorMessage(response: Response): Promise<string> {
  const { message } = await parseErrorBody(response)
  return message ?? GENERIC_ERROR_MESSAGE
}

export async function registerUser(
  payload: RegisterPayload
): Promise<RegisteredUser> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response))
  }

  return (await response.json()) as RegisteredUser
}

export interface LoginPayload {
  email: string
  senha: string
}

/**
 * Espelha 1:1 `AuthenticatedSession` do backend
 * (`services/backend/src/auth/use-cases/login.use-case.ts`) — mesmo shape
 * de entrada esperado por `SessionContext.setSession` (T7), então o
 * resultado de `loginUser` pode ser repassado direto, sem remapeamento.
 * `role` (pbi-003, T4 do backend) é usado pelo redirecionamento pós-login
 * por papel (T9).
 */
export interface AuthenticatedSession {
  access_token: string
  refresh_token: string
  expires_in: number
  role: UserRole
}

/**
 * `code` presente no corpo de erro de `POST /auth/login` quando a conta
 * existe mas o e-mail ainda não foi confirmado (LOGIN-02). Mesmo valor de
 * `EMAIL_NOT_CONFIRMED_CODE` em
 * `services/backend/src/auth/exceptions/email-not-confirmed.exception.ts`
 * — duplicado aqui (em vez de importado) porque frontend e backend são
 * pacotes/deploys independentes, sem um pacote compartilhado de contratos.
 */
export const EMAIL_NOT_CONFIRMED_CODE = "email_not_confirmed"

export async function loginUser(
  payload: LoginPayload
): Promise<AuthenticatedSession> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const { message, code } = await parseErrorBody(response)
    throw new ApiError(response.status, message ?? GENERIC_ERROR_MESSAGE, code)
  }

  return (await response.json()) as AuthenticatedSession
}

/**
 * Wrapper simples de `fetch` que injeta `Authorization: Bearer <token>`
 * (T8 — LOGIN-01). Recebe o `access_token` como parâmetro em vez de lê-lo
 * de `SessionContext` internamente: mantém esta função utilizável fora de
 * componentes React (sem depender de hooks) e testável sem mockar contexto
 * — quem chama decide de onde vem o token (Dependency Inversion).
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  accessToken: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
