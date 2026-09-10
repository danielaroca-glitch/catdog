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

function isValidExpiresIn(expiresInSeconds: number): boolean {
  return Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
}

export interface SessionProviderProps {
  readonly children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSessionState] = useState<Session | null>(null)

  const setSession = useCallback((input: SetSessionInput) => {
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
