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

import { SessionProvider, useSession, type Session } from "./session-context"
import {
  MIN_REFRESH_DELAY_MS,
  SESSION_EXPIRED_REASON,
  millisecondsUntilRefresh,
  useRefreshScheduler,
} from "./refresh-scheduler"

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
        role: "adotante",
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
        role: "adotante",
      })
    })

    await act(async () => {
      await jest.advanceTimersByTimeAsync(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS)
    })

    expect(result.current.session).toMatchObject({
      access_token: "access-2",
      refresh_token: "refresh-2",
      // pbi-003 (T7): `POST /auth/refresh` não devolve `role` — precisa
      // continuar vindo da sessão anterior, não virar `undefined`.
      role: "adotante",
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
        role: "adotante",
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
    expect(pushMock).toHaveBeenCalledWith(`/login?reason=${SESSION_EXPIRED_REASON}`)
  })

  it("on a network error (fetch rejects), retries instead of logging out immediately — a blip does not cost the session (achado #1, review rodada 2)", async () => {
    const fetchMock = globalThis.fetch as jest.Mock
    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(
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
        role: "adotante",
      })
    })

    await act(async () => {
      await jest.advanceTimersByTimeAsync(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS)
    })

    // 1ª tentativa falhou na rede — sessão continua de pé, sem logout.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.session).not.toBeNull()
    expect(pushMock).not.toHaveBeenCalled()

    // Retry agendado (5s) — 2ª tentativa é bem-sucedida.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000)
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.current.session).toMatchObject({ access_token: "access-2" })
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("on a 5xx server error, retries the same way as a network error (not treated as a real auth rejection)", async () => {
    const fetchMock = globalThis.fetch as jest.Mock
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ message: "Service Unavailable" }),
      } as Response)
      .mockResolvedValueOnce(
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
        role: "adotante",
      })
    })

    await act(async () => {
      await jest.advanceTimersByTimeAsync(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS)
    })

    expect(result.current.session).not.toBeNull()
    expect(pushMock).not.toHaveBeenCalled()

    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000)
    })

    expect(result.current.session).toMatchObject({ access_token: "access-2" })
  })

  it("gives up after repeated transient failures and logs out (does not retry forever)", async () => {
    const fetchMock = globalThis.fetch as jest.Mock
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))

    const { result } = renderHook(() => useTestHarness(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: ONE_HOUR_IN_SECONDS,
        role: "adotante",
      })
    })

    await act(async () => {
      await jest.advanceTimersByTimeAsync(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS)
    })

    // 1 tentativa inicial + 5 retries (MAX_TRANSIENT_RETRIES) = 6 chamadas,
    // cada uma separada por 5s, antes de desistir.
    for (let retry = 0; retry < 5; retry += 1) {
      expect(result.current.session).not.toBeNull()
      await act(async () => {
        await jest.advanceTimersByTimeAsync(5_000)
      })
    }

    expect(fetchMock).toHaveBeenCalledTimes(6)
    expect(result.current.session).toBeNull()
    expect(pushMock).toHaveBeenCalledWith(`/login?reason=${SESSION_EXPIRED_REASON}`)
  })

  it("clears the scheduled timer on unmount, so no stray refresh leaks between a logout and a new login", () => {
    const fetchMock = globalThis.fetch as jest.Mock
    const { result, unmount } = renderHook(() => useTestHarness(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: ONE_HOUR_IN_SECONDS,
        role: "adotante",
      })
    })

    unmount()

    act(() => {
      jest.advanceTimersByTime(ONE_HOUR_IN_MS)
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  // Achado #4 (review pbi-002): o cleanup do efeito cancelava só o
  // `setTimeout` pendente, não uma renovação (`fetch`) já em voo. Estes
  // testes controlam manualmente quando o `fetch` mockado resolve/rejeita,
  // para provar que uma promise que só se resolve *depois* do
  // desmontar/reagendar não aplica mais `setSession`/`clearSession`.
  it("ignores a stale in-flight refresh's result when the session changes before it resolves", async () => {
    let resolveFetch: (value: Response) => void = () => {}
    const fetchMock = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        })
    )
    globalThis.fetch = fetchMock

    const { result } = renderHook(() => useTestHarness(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: ONE_HOUR_IN_SECONDS,
        role: "adotante",
      })
    })

    act(() => {
      jest.advanceTimersByTime(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Sessão muda enquanto o refresh acima ainda está em voo (ex.: outro
    // fluxo já renovou/trocou a sessão) — o efeito antigo deve ser
    // cancelado no cleanup, mesmo sem o timeout ainda ter disparado de novo.
    act(() => {
      result.current.setSession({
        access_token: "access-B",
        refresh_token: "refresh-B",
        expires_in: ONE_HOUR_IN_SECONDS,
        role: "adotante",
      })
    })

    await act(async () => {
      resolveFetch(
        jsonResponse({
          access_token: "access-STALE",
          refresh_token: "refresh-STALE",
          expires_in: ONE_HOUR_IN_SECONDS,
        })
      )
      await Promise.resolve()
      await Promise.resolve()
    })

    // Sem cancelamento, `setSession` seria chamado com os tokens "STALE",
    // sobrescrevendo a sessão B já vigente.
    expect(result.current.session).toMatchObject({ access_token: "access-B" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("does not clear the session nor redirect when a failing refresh resolves after unmount", async () => {
    let rejectFetch: (reason?: unknown) => void = () => {}
    const fetchMock = jest.fn(
      () =>
        new Promise<Response>((_resolve, reject) => {
          rejectFetch = reject
        })
    )
    globalThis.fetch = fetchMock

    const { result, unmount } = renderHook(() => useTestHarness(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-1",
        refresh_token: "refresh-1",
        expires_in: ONE_HOUR_IN_SECONDS,
        role: "adotante",
      })
    })

    act(() => {
      jest.advanceTimersByTime(ONE_HOUR_IN_MS - REFRESH_MARGIN_MS)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    unmount()

    await act(async () => {
      rejectFetch(new Error("network error"))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(pushMock).not.toHaveBeenCalled()
  })
})

// Achado #5 (review pbi-002): `millisecondsUntilRefresh` clampava em `0` via
// `Math.max(..., 0)`. Com `expires_in` pequeno/zero/NaN (sem validação de
// runtime até aqui — ver `session-context.test.tsx`), isso produzia um
// delay <= 0, criando um loop apertado de `POST /auth/refresh`. Estes testes
// verificam a função pura diretamente, manipulando `expires_at` para simular
// os cenários sem depender da validação de `setSession`.
describe("millisecondsUntilRefresh (piso mínimo contra loop de refresh)", () => {
  const NOW = 1_000_000

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("does not clamp a normal, far-future expires_at below the margin-adjusted delay", () => {
    const session: Session = {
      access_token: "a",
      refresh_token: "r",
      expires_at: NOW + ONE_HOUR_IN_MS,
      role: "adotante",
    }

    expect(millisecondsUntilRefresh(session)).toBe(
      ONE_HOUR_IN_MS - REFRESH_MARGIN_MS
    )
  })

  it("floors the delay to MIN_REFRESH_DELAY_MS when expires_at is already at/near now", () => {
    const session: Session = {
      access_token: "a",
      refresh_token: "r",
      expires_at: NOW,
      role: "adotante",
    }

    expect(millisecondsUntilRefresh(session)).toBe(MIN_REFRESH_DELAY_MS)
  })

  it("floors the delay to MIN_REFRESH_DELAY_MS when expires_at is already in the past", () => {
    const session: Session = {
      access_token: "a",
      refresh_token: "r",
      expires_at: NOW - 100_000,
      role: "adotante",
    }

    expect(millisecondsUntilRefresh(session)).toBe(MIN_REFRESH_DELAY_MS)
  })

  it("floors the delay to MIN_REFRESH_DELAY_MS when expires_at is NaN", () => {
    const session: Session = {
      access_token: "a",
      refresh_token: "r",
      expires_at: NaN,
      role: "adotante",
    }

    expect(millisecondsUntilRefresh(session)).toBe(MIN_REFRESH_DELAY_MS)
  })
})
