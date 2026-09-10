import { act, render } from "@testing-library/react"
import { useEffect, type ReactNode } from "react"

/**
 * Achado #2 (review pbi-002): `useRefreshScheduler()` nunca era chamado em
 * nenhum componente da árvore real — só em `refresh-scheduler.test.ts` (via
 * `renderHook`) e no próprio hook. Este teste prova a montagem real: monta
 * `<SessionProvider><SessionRefresher /></SessionProvider>` com uma sessão
 * já setada e confirma, com fake timers, que o `fetch` de renovação dispara
 * quando o timer chega — ou seja, que `SessionRefresher` de fato aciona o
 * agendamento ao ser montado, e não só quando chamado isoladamente via
 * `renderHook` (isso já é coberto por `refresh-scheduler.test.ts`).
 */
const pushMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

import { SessionProvider, useSession } from "@/lib/auth/session-context"
import { SessionRefresher } from "./session-refresher"

const ONE_HOUR_IN_SECONDS = 3600
const ONE_HOUR_IN_MS = ONE_HOUR_IN_SECONDS * 1000
const REFRESH_MARGIN_MS = 60_000
const API_URL = "http://localhost:3001"

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(body),
  } as Response
}

// Wrapper de teste (mencionado no achado): chama `setSession` assim que
// monta, simulando uma sessão já ativa quando `SessionRefresher` entra na
// árvore (o cenário real: usuário já logado navegando pelo app).
function SessionAlreadyActive({ children }: { readonly children: ReactNode }) {
  const { setSession } = useSession()

  useEffect(() => {
    setSession({
      access_token: "access-1",
      refresh_token: "refresh-1",
      expires_in: ONE_HOUR_IN_SECONDS,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}

describe("SessionRefresher (wiring — achado #2)", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    pushMock.mockClear()
    globalThis.fetch = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("renders as null without crashing when there is no active session", () => {
    const { container } = render(
      <SessionProvider>
        <SessionRefresher />
      </SessionProvider>
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("actually schedules and fires the session-refresh request once mounted inside SessionProvider with an active session", async () => {
    const fetchMock = globalThis.fetch as jest.Mock
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: "access-2",
        refresh_token: "refresh-2",
        expires_in: ONE_HOUR_IN_SECONDS,
      })
    )

    render(
      <SessionProvider>
        <SessionAlreadyActive>
          <SessionRefresher />
        </SessionAlreadyActive>
      </SessionProvider>
    )

    act(() => {
      jest.advanceTimersByTime(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS - 1)
    })
    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1)
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/auth/refresh`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: "refresh-1" }),
      })
    )
  })
})
