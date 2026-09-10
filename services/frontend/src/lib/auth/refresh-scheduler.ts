"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { useSession, type Session, type SetSessionInput } from "./session-context"

/**
 * Renovação automática de sessão (T9 — LOGIN-06, LOGIN-07).
 *
 * Agenda um único `setTimeout` para chamar `POST /auth/refresh` pouco antes
 * de `session.expires_at` (margem de `REFRESH_MARGIN_MS`). Em sucesso, o
 * novo par de tokens é repassado a `setSession` (T7) — o que muda
 * `session.expires_at` e, por consequência, reexecuta o efeito abaixo
 * reagendando a próxima renovação automaticamente (não há loop/recursão
 * manual). Em falha (RN-03: refresh token já rotacionado/inválido — o
 * backend responde 401 genérico, ver `refresh.use-case.ts`), a sessão é
 * encerrada e o usuário é levado ao Login com a mensagem de sessão
 * expirada (`EXPERIENCE.md` — "Sessão expirada durante uso").
 *
 * A chamada HTTP a `/auth/refresh` é implementada aqui, e não em
 * `lib/api/auth.ts` (tocado em paralelo pela T8) — segue o mesmo padrão de
 * `fetch`/tratamento de resposta de `registerUser` só como referência de
 * estilo, sem importar nada de lá.
 */

const REFRESH_MARGIN_MS = 60_000
const DEFAULT_API_URL = "http://localhost:3001"
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
const LOGIN_ROUTE = "/login"

export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Entre novamente."

interface RefreshedSessionResponse {
  readonly access_token: string
  readonly refresh_token: string
  readonly expires_in: number
}

function isRefreshedSessionResponse(
  data: unknown
): data is RefreshedSessionResponse {
  if (typeof data !== "object" || data === null) {
    return false
  }

  const candidate = data as Record<string, unknown>
  return (
    typeof candidate.access_token === "string" &&
    typeof candidate.refresh_token === "string" &&
    typeof candidate.expires_in === "number"
  )
}

async function parseRefreshedSession(
  response: Response
): Promise<SetSessionInput> {
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok || !isRefreshedSessionResponse(body)) {
    throw new Error("Falha ao renovar a sessão.")
  }

  return body
}

async function requestSessionRefresh(
  refreshToken: string
): Promise<SetSessionInput> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  return parseRefreshedSession(response)
}

function millisecondsUntilRefresh(session: Session): number {
  const millisecondsUntilExpiry = session.expires_at - Date.now()
  return Math.max(millisecondsUntilExpiry - REFRESH_MARGIN_MS, 0)
}

function sessionExpiredLoginUrl(): string {
  return `${LOGIN_ROUTE}?message=${encodeURIComponent(SESSION_EXPIRED_MESSAGE)}`
}

/**
 * Hook "headless" (sem JSX/retorno próprio): monte-o uma vez perto da raiz
 * autenticada da aplicação, dentro de um `SessionProvider`, para manter a
 * sessão renovada automaticamente em segundo plano.
 */
export function useRefreshScheduler(): void {
  const { session, setSession, clearSession } = useSession()
  const router = useRouter()
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!session) {
      return undefined
    }

    async function renewSession(currentSession: Session): Promise<void> {
      try {
        const refreshed = await requestSessionRefresh(
          currentSession.refresh_token
        )
        setSession(refreshed)
      } catch {
        clearSession()
        router.push(sessionExpiredLoginUrl())
      }
    }

    timeoutIdRef.current = setTimeout(() => {
      void renewSession(session)
    }, millisecondsUntilRefresh(session))

    return () => {
      if (timeoutIdRef.current === null) {
        return
      }
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [session, setSession, clearSession, router])
}
