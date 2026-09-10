import { act, render, renderHook, screen } from "@testing-library/react"
import type { ReactNode } from "react"

import type { UserRole } from "@/lib/api/auth"

import { SessionProvider, useSession } from "./session-context"

function wrapper({ children }: { readonly children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}

describe("SessionProvider / useSession", () => {
  it("starts with no session", () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    expect(result.current.session).toBeNull()
  })

  it("stores access_token, refresh_token, role and a computed expires_at when setSession is called", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000_000)

    const { result } = renderHook(() => useSession(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-token-1",
        refresh_token: "refresh-token-1",
        expires_in: 3600,
        role: "adotante",
      })
    })

    expect(result.current.session).toEqual({
      access_token: "access-token-1",
      refresh_token: "refresh-token-1",
      expires_at: 1_000_000 + 3600 * 1000,
      role: "adotante",
    })

    jest.restoreAllMocks()
  })

  // T7 (pbi-003, AUTZ-01): session.role precisa estar acessível via
  // useSession() para o redirecionamento pós-login por papel (T9) e para
  // RequireRole (T8) decidirem sem uma leitura adicional.
  it("exposes session.role for both admin and adotante", () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-token-1",
        refresh_token: "refresh-token-1",
        expires_in: 3600,
        role: "admin",
      })
    })

    expect(result.current.session?.role).toBe("admin")
  })

  it("replaces the previous session (including role) when setSession is called again (e.g. after a refresh)", () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-token-1",
        refresh_token: "refresh-token-1",
        expires_in: 3600,
        role: "adotante",
      })
    })
    act(() => {
      result.current.setSession({
        access_token: "access-token-2",
        refresh_token: "refresh-token-2",
        expires_in: 1800,
        role: "admin",
      })
    })

    expect(result.current.session).toMatchObject({
      access_token: "access-token-2",
      refresh_token: "refresh-token-2",
      role: "admin",
    })
  })

  it("clears the session when clearSession is called", () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-token-1",
        refresh_token: "refresh-token-1",
        expires_in: 3600,
        role: "adotante",
      })
    })
    act(() => {
      result.current.clearSession()
    })

    expect(result.current.session).toBeNull()
  })

  it("throws when useSession is called outside a SessionProvider", () => {
    function ComponentWithoutProvider() {
      useSession()
      return null
    }

    expect(() => render(<ComponentWithoutProvider />)).toThrow(
      "useSession must be used within a SessionProvider"
    )
  })

  it("never calls localStorage or sessionStorage when setting or clearing the session", () => {
    const localStorageSetItemSpy = jest.spyOn(
      window.localStorage.__proto__,
      "setItem"
    )
    const sessionStorageSetItemSpy = jest.spyOn(
      window.sessionStorage.__proto__,
      "setItem"
    )

    const { result } = renderHook(() => useSession(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-token-1",
        refresh_token: "refresh-token-1",
        expires_in: 3600,
        role: "adotante",
      })
    })
    act(() => {
      result.current.clearSession()
    })

    expect(localStorageSetItemSpy).not.toHaveBeenCalled()
    expect(sessionStorageSetItemSpy).not.toHaveBeenCalled()

    localStorageSetItemSpy.mockRestore()
    sessionStorageSetItemSpy.mockRestore()
  })

  it("exposes the session to consumers rendered within the provider", () => {
    function SessionConsumer() {
      const { session, setSession } = useSession()
      return (
        <div>
          <span data-testid="session-state">
            {session ? "has-session" : "no-session"}
          </span>
          <button
            type="button"
            onClick={() =>
              setSession({
                access_token: "access-token-1",
                refresh_token: "refresh-token-1",
                expires_in: 3600,
                role: "adotante",
              })
            }
          >
            login
          </button>
        </div>
      )
    }

    render(
      <SessionProvider>
        <SessionConsumer />
      </SessionProvider>
    )

    expect(screen.getByTestId("session-state")).toHaveTextContent(
      "no-session"
    )
  })

  // Achado #5 (review pbi-002): `expires_in` chega direto da resposta da API
  // (login/refresh) sem validação de runtime. Um valor <= 0/NaN/não-finito
  // vira `expires_at` inválido, e `refresh-scheduler` agenda com delay <= 0
  // — loop apertado de `POST /auth/refresh` (único endpoint de auth sem
  // rate limit, de propósito). `setSession` deve rejeitar esses valores.
  describe("expires_in validation", () => {
    it.each([
      ["zero", 0],
      ["negativo", -10],
      ["NaN", NaN],
      ["Infinity", Infinity],
      ["-Infinity", -Infinity],
    ])("throws when expires_in is %s (%p)", (_label, expiresIn) => {
      const { result } = renderHook(() => useSession(), { wrapper })

      expect(() => {
        act(() => {
          result.current.setSession({
            access_token: "access-token-1",
            refresh_token: "refresh-token-1",
            expires_in: expiresIn,
            role: "adotante",
          })
        })
      }).toThrow()

      expect(result.current.session).toBeNull()
    })

    it("accepts a small but positive, finite expires_in", () => {
      jest.spyOn(Date, "now").mockReturnValue(1_000_000)
      const { result } = renderHook(() => useSession(), { wrapper })

      act(() => {
        result.current.setSession({
          access_token: "access-token-1",
          refresh_token: "refresh-token-1",
          expires_in: 1,
          role: "adotante",
        })
      })

      expect(result.current.session).toEqual({
        access_token: "access-token-1",
        refresh_token: "refresh-token-1",
        expires_at: 1_000_000 + 1000,
        role: "adotante",
      })

      jest.restoreAllMocks()
    })
  })

  // Achado #4 (major, review rodada 1 do pbi-003): `role` chegava sem
  // nenhuma validação de runtime, ao contrário de `expires_in` (mesmo
  // motivo: drift de contrato entre backend/frontend, já materializado uma
  // vez nesta sessão). Sem isso, `session.role` vira `undefined`/lixo com
  // tokens válidos, e `RequireRole` nega todas as rotas protegidas.
  describe("role validation", () => {
    it.each([
      ["undefined", undefined],
      ["vazio", ""],
      ["desconhecido", "moderador"],
      ["número", 1],
    ])("throws when role is %s (%p)", (_label, role) => {
      const { result } = renderHook(() => useSession(), { wrapper })

      expect(() => {
        act(() => {
          result.current.setSession({
            access_token: "access-token-1",
            refresh_token: "refresh-token-1",
            expires_in: 3600,
            role: role as unknown as UserRole,
          })
        })
      }).toThrow()

      expect(result.current.session).toBeNull()
    })

    it("accepts both known roles", () => {
      const { result } = renderHook(() => useSession(), { wrapper })

      act(() => {
        result.current.setSession({
          access_token: "access-token-1",
          refresh_token: "refresh-token-1",
          expires_in: 3600,
          role: "admin",
        })
      })

      expect(result.current.session?.role).toBe("admin")
    })
  })
})
