/**
 * Cliente da API de autenticação (REG-02, REG-05).
 *
 * Fala com `POST /auth/register` do backend NestJS
 * (`services/backend/src/auth/auth.controller.ts`). O shape do payload
 * espelha 1:1 o `RegisterDto` do backend (`nome`, `email`, `senha`,
 * `confirmarSenha`) — não há divergência de nomes de campo entre os dois
 * lados, então nenhum mapeamento é necessário aqui.
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
 * Erro tipado lançado por `registerUser` para qualquer resposta HTTP não-2xx,
 * carregando o status para que quem chama possa decidir o tratamento (ex.:
 * 409 = e-mail já cadastrado, REG-05).
 */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
    ) {
      return (data as { message: string }).message
    }
  } catch {
    // Corpo não é JSON válido (ou vazio) — cai no fallback abaixo.
  }

  return GENERIC_ERROR_MESSAGE
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
