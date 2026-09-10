import { act, render, renderHook, screen } from "@testing-library/react"
import type { ReactNode } from "react"

import { SessionProvider, useSession } from "./session-context"

function wrapper({ children }: { readonly children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}

describe("SessionProvider / useSession", () => {
  it("starts with no session", () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    expect(result.current.session).toBeNull()
  })

  it("stores access_token, refresh_token and a computed expires_at when setSession is called", () => {
    jest.spyOn(Date, "now").mockReturnValue(1_000_000)

    const { result } = renderHook(() => useSession(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-token-1",
        refresh_token: "refresh-token-1",
        expires_in: 3600,
      })
    })

    expect(result.current.session).toEqual({
      access_token: "access-token-1",
      refresh_token: "refresh-token-1",
      expires_at: 1_000_000 + 3600 * 1000,
    })

    jest.restoreAllMocks()
  })

  it("replaces the previous session when setSession is called again (e.g. after a refresh)", () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-token-1",
        refresh_token: "refresh-token-1",
        expires_in: 3600,
      })
    })
    act(() => {
      result.current.setSession({
        access_token: "access-token-2",
        refresh_token: "refresh-token-2",
        expires_in: 1800,
      })
    })

    expect(result.current.session).toMatchObject({
      access_token: "access-token-2",
      refresh_token: "refresh-token-2",
    })
  })

  it("clears the session when clearSession is called", () => {
    const { result } = renderHook(() => useSession(), { wrapper })

    act(() => {
      result.current.setSession({
        access_token: "access-token-1",
        refresh_token: "refresh-token-1",
        expires_in: 3600,
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
})
