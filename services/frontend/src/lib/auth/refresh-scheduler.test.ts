import { act, renderHook } from "@testing-library/react"
import { createElement, type ReactNode } from "react"

/**
 * `useRefreshScheduler` (T9) depende de `useRouter` (next/navigation) para
 * redirecionar ao `/login` quando a renovação falha. Mockado com o mesmo
 * padrão já usado em `register-form.test.tsx`/`register-form.register-api.test.tsx`
 * (caminho relativo — o alias "@/..." só é resolvido em tempo de transform,
 * não pelo resolver de `jest.mock`).
 */
const pushMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

import { SessionProvider, useSession } from "./session-context"
import { SESSION_EXPIRED_MESSAGE, useRefreshScheduler } from "./refresh-scheduler"

const ONE_HOUR_IN_SECONDS = 3600
const ONE_HOUR_IN_MS = ONE_HOUR_IN_SECONDS * 1000
const REFRESH_MARGIN_MS = 60_000
const API_URL = "http://localhost:3001"

function wrapper({ children }: { readonly children: ReactNode }) {
  return createElement(SessionProvider, null, children)
}

// Combina o contexto de sessão com o scheduler sob teste — o teste precisa
// de `setSession`/`session` (de `useSession`) para montar o cenário e
// observar o resultado do scheduler, que não expõe nenhum retorno próprio
// (é um hook "headless": só agenda efeitos colaterais).
function useTestHarness() {
  const sessionApi = useSession()
  useRefreshScheduler()
  return sessionApi
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(body),
  } as Response
}

describe("useRefreshScheduler", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    pushMock.mockClear()
    globalThis.fetch = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("schedules a setTimeout to renew the session shortly (60s) before expires_at", async () => {
    const fetchMock = globalThis.fetch as jest.Mock
    // Resposta válida configurada mesmo esta task só verificando o
    // agendamento: sem isso, o timeout que dispara ao final do teste
    // encadearia uma promise que rejeita (resposta indefinida) e só se
    // resolveria depois do teste já ter terminado, vazando um `act`
    // warning para o próximo teste que rodar (fetch sem mock configurado
    // não retorna uma Promise).
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: "access-2",
        refresh_token: "refresh-2",
        expires_in: ONE_HOUR_IN_SECONDS,
      })
    )
    const { result } = renderHook(() => useTestHarness(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: ONE_HOUR_IN_SECONDS,
      })
    })

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

  it("on success, updates the session context with the new token pair and reschedules the next renewal", async () => {
    const fetchMock = globalThis.fetch as jest.Mock
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        access_token: "access-2",
        refresh_token: "refresh-2",
        expires_in: ONE_HOUR_IN_SECONDS,
      })
    )

    const { result } = renderHook(() => useTestHarness(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: ONE_HOUR_IN_SECONDS,
      })
    })

    await act(async () => {
      await jest.advanceTimersByTimeAsync(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS)
    })

    expect(result.current.session).toMatchObject({
      access_token: "access-2",
      refresh_token: "refresh-2",
    })

    // Reagendamento: um 2º ciclo completo deve disparar um 2º refresh.
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        access_token: "access-3",
        refresh_token: "refresh-3",
        expires_in: ONE_HOUR_IN_SECONDS,
      })
    )

    await act(async () => {
      await jest.advanceTimersByTimeAsync(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS)
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.current.session).toMatchObject({
      access_token: "access-3",
      refresh_token: "refresh-3",
    })
  })

  it("on failure (401 — reused/invalid refresh token), clears the session and redirects to /login with the session-expired message", async () => {
    const fetchMock = globalThis.fetch as jest.Mock
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "Sessão inválida ou expirada." }, false)
    )

    const { result } = renderHook(() => useTestHarness(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: ONE_HOUR_IN_SECONDS,
      })
    })

    await act(async () => {
      await jest.advanceTimersByTimeAsync(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS)
      // Flush a mais: a cadeia fetch -> json() -> catch -> clearSession
      // atravessa mais voltas de microtask do que o advance sozinho
      // percorre, então um `act` sem isso reporta a atualização de estado
      // (dispatch de clearSession) como "fora" do act.
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.session).toBeNull()
    expect(pushMock).toHaveBeenCalledWith(
      `/login?message=${encodeURIComponent(SESSION_EXPIRED_MESSAGE)}`
    )
  })

  it("clears the scheduled timer on unmount, so no stray refresh leaks between a logout and a new login", () => {
    const fetchMock = globalThis.fetch as jest.Mock
    const { result, unmount } = renderHook(() => useTestHarness(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: ONE_HOUR_IN_SECONDS,
      })
    })

    unmount()

    act(() => {
      jest.advanceTimersByTime(ONE_HOUR_IN_MS)
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
