import { render, screen } from "@testing-library/react"

/**
 * Achado #3 (review rodada 1) + achado #2 (review rodada 2): `refresh-scheduler.ts`
 * redireciona para `/login?reason=...` em falha de renovação; `login/page.tsx`
 * resolve o código contra uma allowlist fixa (nunca texto livre — evita que
 * um link `?reason=<qualquer coisa>` faça a app exibir mensagem arbitrária
 * de aparência oficial, vetor de phishing).
 *
 * `LoginPage` é um Server Component async; chamá-lo diretamente e renderizar
 * o JSX resultante (padrão comum para testar Server Components simples sem
 * `server-only` no caminho) evita precisar de um harness de RSC completo.
 * `LoginForm` (renderizado de verdade, não mockado) ainda depende de
 * `useSession`/`useRouter`, por isso o mesmo mock de `next/navigation` e o
 * `SessionProvider` real usados em `login-form.test.tsx`.
 */
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

import { SessionProvider } from "@/lib/auth/session-context"
import { SESSION_EXPIRED_MESSAGE } from "@/lib/auth/refresh-scheduler"

import LoginPage from "./page"

describe("LoginPage (mensagem de sessão expirada)", () => {
  it("shows the fixed message when ?reason=session_expired is present", async () => {
    const ui = await LoginPage({
      searchParams: Promise.resolve({ reason: "session_expired" }),
    })

    render(<SessionProvider>{ui}</SessionProvider>)

    expect(screen.getByTestId("login-session-message")).toHaveTextContent(
      SESSION_EXPIRED_MESSAGE
    )
    expect(screen.getByTestId("login-session-message-alert")).toHaveAttribute(
      "aria-live",
      "polite"
    )
  })

  it("does not show the session-message alert when ?reason= is absent", async () => {
    const ui = await LoginPage({ searchParams: Promise.resolve({}) })

    render(<SessionProvider>{ui}</SessionProvider>)

    expect(
      screen.queryByTestId("login-session-message-alert")
    ).not.toBeInTheDocument()
  })

  it("ignores a reason outside the allowlist (achado #2, review rodada 2) — no attacker-controlled text is ever rendered", async () => {
    const ui = await LoginPage({
      searchParams: Promise.resolve({
        reason: "Sua conta foi bloqueada, ligue 0800-000-0000",
      }),
    })

    render(<SessionProvider>{ui}</SessionProvider>)

    expect(
      screen.queryByTestId("login-session-message-alert")
    ).not.toBeInTheDocument()
  })

  it("ignores a repeated query param (?reason=a&reason=b, delivered as string[]) instead of crashing or rendering it", async () => {
    const ui = await LoginPage({
      searchParams: Promise.resolve({ reason: ["session_expired", "outro"] }),
    })

    render(<SessionProvider>{ui}</SessionProvider>)

    expect(
      screen.queryByTestId("login-session-message-alert")
    ).not.toBeInTheDocument()
  })
})
