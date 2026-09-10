"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { useSession, type Session } from "./session-context"

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
// Achado #1 (major, review rodada 2): antes, QUALQUER falha (rede fora do
// ar, backend reiniciando, 5xx) caía no mesmo catch que um 401 genuíno
// (RN-03, refresh token reutilizado/inválido) — deslogava o usuário com uma
// mensagem falsa de "sessão expirou" mesmo quando a sessão continuava
// perfeitamente válida no Supabase, sem nenhuma tentativa nova. Erros
// TRANSIENTES (fetch não completou, ou o servidor respondeu 5xx — nunca uma
// rejeição deliberada de autenticação) agora tentam de novo algumas vezes
// antes de desistir; só uma resposta HTTP recebida com status < 500 (ex. 401
// do `RefreshUseCase`) é tratada como falha de autenticação de verdade.
const MAX_TRANSIENT_RETRIES = 5
const TRANSIENT_RETRY_DELAY_MS = 5_000
const HTTP_STATUS_SERVER_ERROR_THRESHOLD = 500

class SessionRefreshTransientError extends Error {}
// Achado #5 (review pbi-002): piso mínimo para o delay do agendamento. Sem
// isso, um `expires_in` pequeno/zero/NaN (sem validação de runtime até este
// ponto — ver validação em `session-context.tsx`) produzia delay <= 0 e um
// loop apertado de `POST /auth/refresh`, o único endpoint de auth sem rate
// limit (de propósito). 5s é curto o bastante para não atrasar uma renovação
// legítima perto da expiração, mas alto o bastante para não virar loop.
const MIN_REFRESH_DELAY_MS = 5_000
const DEFAULT_API_URL = "http://localhost:3001"
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
const LOGIN_ROUTE = "/login"

export { MIN_REFRESH_DELAY_MS }

export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Entre novamente."

// Achado #2 (minor, review rodada 2): o redirect antes trafegava o TEXTO da
// mensagem na própria URL (`?message=...`) — qualquer um podia montar um
// link `/login?message=<texto arbitrário>` e a app exibia esse texto com a
// aparência oficial, em cima do campo de senha (vetor de phishing). Agora
// trafega só um CÓDIGO (`?reason=session_expired`); `app/login/page.tsx`
// resolve o código para o texto fixo via allowlist, ignorando qualquer valor
// fora dela.
export const SESSION_EXPIRED_REASON = "session_expired"

// `POST /auth/refresh` não devolve `role` (só troca o par de tokens) — o
// papel do usuário não muda numa renovação, então é preservado da sessão
// atual em `renewSession` em vez de ser lido de novo aqui (pbi-003, T7).
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
): Promise<RefreshedSessionResponse> {
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok || !isRefreshedSessionResponse(body)) {
    throw new Error("Falha ao renovar a sessão.")
  }

  return body
}

async function requestSessionRefresh(
  refreshToken: string
): Promise<RefreshedSessionResponse> {
  let response: Response

  try {
    response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch {
    // fetch() rejeitou antes de qualquer resposta HTTP — rede indisponível,
    // DNS, CORS, backend fora do ar. Não é uma rejeição de autenticação.
    throw new SessionRefreshTransientError(
      "Falha de rede ao tentar renovar a sessão."
    )
  }

  if (response.status >= HTTP_STATUS_SERVER_ERROR_THRESHOLD) {
    // Erro do servidor (5xx) — o backend nunca responde 5xx deliberadamente
    // para uma falha de auth (`RefreshUseCase` sempre usa 401), então isso é
    // sinal de instabilidade transitória, não de token inválido.
    throw new SessionRefreshTransientError(
      `Servidor indisponível ao renovar a sessão (status ${response.status}).`
    )
  }

  return parseRefreshedSession(response)
}

// Exportada só para teste direto do piso mínimo (achado #5) — não é usada
// fora deste módulo em código de produção.
export function millisecondsUntilRefresh(session: Session): number {
  const millisecondsUntilExpiry = session.expires_at - Date.now()
  const delay = millisecondsUntilExpiry - REFRESH_MARGIN_MS

  // Guarda explícita contra NaN (ex.: `expires_at` corrompido): `Math.max`
  // com NaN sempre resulta em NaN, o que viraria um `setTimeout(..., NaN)`
  // (dispara imediatamente, na prática um delay 0).
  if (!Number.isFinite(delay)) {
    return MIN_REFRESH_DELAY_MS
  }

  return Math.max(delay, MIN_REFRESH_DELAY_MS)
}

function sessionExpiredLoginUrl(): string {
  return `${LOGIN_ROUTE}?reason=${SESSION_EXPIRED_REASON}`
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

    // Achado #4 (review pbi-002): cancela o *resultado* de uma renovação já
    // em voo, não só o `setTimeout` pendente. Sem isso, se `session` mudar
    // (reagendando um novo ciclo) ou o componente desmontar enquanto
    // `requestSessionRefresh` está pendente, a promise ainda resolvida/rejeitada
    // executaria `setSession`/`clearSession`+`router.push` com dados já
    // obsoletos — o cleanup do `clearTimeout` não tem efeito sobre uma
    // requisição HTTP já disparada.
    let cancelled = false

    async function renewSession(
      currentSession: Session,
      attempt: number
    ): Promise<void> {
      try {
        const refreshed = await requestSessionRefresh(
          currentSession.refresh_token
        )
        if (cancelled) {
          return
        }
        // `role` não vem do refresh (ver nota em `RefreshedSessionResponse`)
        // — preservado da sessão vigente antes desta renovação.
        setSession({ ...refreshed, role: currentSession.role })
      } catch (error) {
        if (cancelled) {
          return
        }

        if (
          error instanceof SessionRefreshTransientError &&
          attempt < MAX_TRANSIENT_RETRIES
        ) {
          timeoutIdRef.current = setTimeout(() => {
            void renewSession(currentSession, attempt + 1)
          }, TRANSIENT_RETRY_DELAY_MS)
          return
        }

        clearSession()
        router.push(sessionExpiredLoginUrl())
      }
    }

    timeoutIdRef.current = setTimeout(() => {
      void renewSession(session, 0)
    }, millisecondsUntilRefresh(session))

    return () => {
      cancelled = true

      if (timeoutIdRef.current === null) {
        return
      }
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [session, setSession, clearSession, router])
}
