"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type { UserRole } from "@/lib/api/auth"

/**
 * Contexto de sessão (T7 — suporte a LOGIN-01, LOGIN-06, LOGIN-07).
 *
 * Guarda `access_token`, `refresh_token` e `expires_at` **somente em
 * memória**: decisão explícita do usuário (ver `.makuco/STATE.md`) de não
 * usar `localStorage`/`sessionStorage`. A sessão se perde em reload de
 * página — aceitável para o escopo desta PBI, já que nenhuma CA pede
 * "lembrar sessão" entre recarregamentos.
 *
 * O shape de entrada de `setSession` (`access_token`, `refresh_token`,
 * `expires_in`, `role`) espelha 1:1 o retorno de `POST /auth/login` e
 * `POST /auth/refresh` do backend (`AuthenticatedSession`/`RefreshedSession`
 * em `services/backend/src/auth/use-cases/`), para que `LoginForm` (T8) e o
 * futuro `refresh-scheduler` (T9) repassem a resposta da API diretamente,
 * sem remapeamento de campos.
 *
 * `role` (pbi-003, AUTZ-01) é guardado no mesmo estado em memória dos
 * tokens — nunca `localStorage`/`sessionStorage` — para que o
 * redirecionamento pós-login por papel (T9) e o guard de rota `RequireRole`
 * (T8) o leiam via `useSession()` sem uma chamada adicional.
 */

export interface Session {
  readonly access_token: string
  readonly refresh_token: string
  readonly expires_at: number
  readonly role: UserRole
}

export interface SetSessionInput {
  readonly access_token: string
  readonly refresh_token: string
  readonly expires_in: number
  readonly role: UserRole
}

export interface SessionContextValue {
  readonly session: Session | null
  readonly setSession: (input: SetSessionInput) => void
  readonly clearSession: () => void
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined
)

const MILLISECONDS_PER_SECOND = 1000

function expiresAtFromNow(expiresInSeconds: number): number {
  return Date.now() + expiresInSeconds * MILLISECONDS_PER_SECOND
}

function isValidExpiresIn(expiresInSeconds: number): boolean {
  return Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
}

const VALID_ROLES: ReadonlySet<UserRole> = new Set(["admin", "adotante"])

// Achado #4 (major, review rodada 1 do pbi-003): `role` chegava sem NENHUMA
// validação de runtime — ao contrário de `expires_in` (mesmo motivo: backend
// e frontend são deploys independentes, sem pacote de contratos
// compartilhado, e um drift já aconteceu de verdade nesta sessão, quando o
// login da pbi-002 não incluía `role`). Sem isso, `session.role` vira
// `undefined`/lixo com tokens perfeitamente válidos, e `RequireRole` nega
// TODAS as rotas protegidas sem caminho de recuperação a não ser um novo
// login. Mesmo racional fail-closed já aplicado a `expires_in`.
function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && VALID_ROLES.has(role as UserRole)
}

export interface SessionProviderProps {
  readonly children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null)

  const setValidatedSession = useCallback((input: SetSessionInput) => {
    // Achado #5 (review pbi-002): `expires_in` chega direto da resposta da
    // API (login/refresh) sem validação de runtime. Um valor <= 0 ou NaN
    // vira `expires_at` no passado (ou inválido), o que faz
    // `refresh-scheduler` agendar com delay <= 0 — loop apertado de
    // `POST /auth/refresh`, o único endpoint de auth sem rate limit (de
    // propósito). Decisão: falhar de forma ruidosa (lança) em vez de aplicar
    // um fallback silencioso — os dois únicos chamadores (`LoginForm` e
    // `refresh-scheduler`) já tratam esse tipo de falha encerrando/negando a
    // sessão, então "fail closed" aqui é seguro e não exige tratamento novo.
    if (!isValidExpiresIn(input.expires_in)) {
      throw new Error(
        "setSession: expires_in inválido — deve ser um número finito maior que zero."
      )
    }

    if (!isValidRole(input.role)) {
      throw new Error(
        "setSession: role inválido — deve ser 'admin' ou 'adotante'."
      )
    }

    setSession({
      access_token: input.access_token,
      refresh_token: input.refresh_token,
      expires_at: expiresAtFromNow(input.expires_in),
      role: input.role,
    })
  }, [])

  const clearSession = useCallback(() => {
    setSession(null)
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({ session, setSession: setValidatedSession, clearSession }),
    [session, setValidatedSession, clearSession]
  )

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }

  return context
}
