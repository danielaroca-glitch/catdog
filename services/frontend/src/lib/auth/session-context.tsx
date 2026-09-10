"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

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
 * `expires_in`) espelha 1:1 o retorno de `POST /auth/login` e
 * `POST /auth/refresh` do backend (`AuthenticatedSession`/`RefreshedSession`
 * em `services/backend/src/auth/use-cases/`), para que `LoginForm` (T8) e o
 * futuro `refresh-scheduler` (T9) repassem a resposta da API diretamente,
 * sem remapeamento de campos.
 */

export interface Session {
  readonly access_token: string
  readonly refresh_token: string
  readonly expires_at: number
}

export interface SetSessionInput {
  readonly access_token: string
  readonly refresh_token: string
  readonly expires_in: number
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

export interface SessionProviderProps {
  readonly children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSessionState] = useState<Session | null>(null)

  const setSession = useCallback((input: SetSessionInput) => {
    setSessionState({
      access_token: input.access_token,
      refresh_token: input.refresh_token,
      expires_at: expiresAtFromNow(input.expires_in),
    })
  }, [])

  const clearSession = useCallback(() => {
    setSessionState(null)
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({ session, setSession, clearSession }),
    [session, setSession, clearSession]
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
