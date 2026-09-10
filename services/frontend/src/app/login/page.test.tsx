import { render, screen } from "@testing-library/react"

/**
 * Achado #3 (review pbi-002): `refresh-scheduler.ts` redireciona para
 * `/login?message=...` em falha de renovação, mas nada em `login/page.tsx`
 * lia esse parâmetro. Este teste prova que, com `?message=X` na URL
 * (representada aqui pela prop `searchParams` — promise, ver
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`),
 * o texto X aparece na tela.
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

import LoginPage from "./page"

describe("LoginPage (achado #3 — mensagem de sessão expirada)", () => {
  it("shows the message from ?message= when present", async () => {
    const message = "Sua sessão expirou. Entre novamente."
    const ui = await LoginPage({
      searchParams: Promise.resolve({ message }),
    })

    render(<SessionProvider>{ui}</SessionProvider>)

    expect(screen.getByTestId("login-session-message")).toHaveTextContent(
      message
    )
    expect(screen.getByTestId("login-session-message-alert")).toHaveAttribute(
      "aria-live",
      "polite"
    )
  })

  it("does not show the session-message alert when ?message= is absent", async () => {
    const ui = await LoginPage({ searchParams: Promise.resolve({}) })

    render(<SessionProvider>{ui}</SessionProvider>)

    expect(
      screen.queryByTestId("login-session-message-alert")
    ).not.toBeInTheDocument()
  })
})
