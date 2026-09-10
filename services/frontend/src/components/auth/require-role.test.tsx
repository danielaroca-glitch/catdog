import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { UserRole } from "@/lib/api/auth"

import { RequireRole, roleHomeRoute } from "./require-role"

const pushMock = jest.fn()
let sessionMock: { role: "admin" | "adotante" } | null = null

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

jest.mock("../../lib/auth/session-context", () => ({
  useSession: () => ({
    session: sessionMock,
    setSession: jest.fn(),
    clearSession: jest.fn(),
  }),
}))

describe("RequireRole (T8, AUTZ-02)", () => {
  beforeEach(() => {
    pushMock.mockReset()
    sessionMock = null
  })

  it("renders children when session.role matches the required role", () => {
    sessionMock = { role: "admin" }
    render(
      <RequireRole role="admin">
        <p>conteúdo administrativo</p>
      </RequireRole>
    )

    expect(screen.getByText("conteúdo administrativo")).toBeInTheDocument()
    expect(
      screen.queryByTestId("access-denied-heading")
    ).not.toBeInTheDocument()
  })

  it("renders AccessDenied, never children, when session.role does not match", () => {
    sessionMock = { role: "adotante" }
    render(
      <RequireRole role="admin">
        <p>conteúdo administrativo</p>
      </RequireRole>
    )

    expect(screen.getByTestId("access-denied-heading")).toBeInTheDocument()
    expect(
      screen.queryByText("conteúdo administrativo")
    ).not.toBeInTheDocument()
  })

  // Achado #1 (major, review rodada 1): "sem sessão" e "papel errado" são
  // desfechos diferentes — antes os dois caíam em AccessDenied, mostrando
  // "você não tem permissão" para quem simplesmente não fez login.
  it("redirects to /login (renders neither AccessDenied nor children) when there is no session at all", () => {
    sessionMock = null
    render(
      <RequireRole role="admin">
        <p>conteúdo administrativo</p>
      </RequireRole>
    )

    expect(pushMock).toHaveBeenCalledWith("/login")
    expect(
      screen.queryByTestId("access-denied-heading")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText("conteúdo administrativo")
    ).not.toBeInTheDocument()
  })

  // E2E-03 (simetria): o botão "Voltar para minha área" de AccessDenied
  // precisa levar à rota do papel ATUAL do usuário, não à rota bloqueada.
  it("sends an adotante blocked from an admin-only route back to /cliente", async () => {
    sessionMock = { role: "adotante" }
    const user = userEvent.setup()
    render(
      <RequireRole role="admin">
        <p>conteúdo administrativo</p>
      </RequireRole>
    )

    await user.click(
      screen.getByRole("button", { name: "Voltar para minha área" })
    )

    expect(pushMock).toHaveBeenCalledWith("/cliente")
  })

  it("sends an admin blocked from a cliente-only route back to /admin (simetria)", async () => {
    sessionMock = { role: "admin" }
    const user = userEvent.setup()
    render(
      <RequireRole role="adotante">
        <p>conteúdo do cliente</p>
      </RequireRole>
    )

    await user.click(
      screen.getByRole("button", { name: "Voltar para minha área" })
    )

    expect(pushMock).toHaveBeenCalledWith("/admin")
  })
})

describe("roleHomeRoute", () => {
  it("maps admin to /admin and adotante to /cliente, and undefined to /login", () => {
    expect(roleHomeRoute("admin")).toBe("/admin")
    expect(roleHomeRoute("adotante")).toBe("/cliente")
    expect(roleHomeRoute(undefined)).toBe("/login")
  })

  // Achado #5 (major, review rodada 1): um valor truthy fora do mapa
  // (3º papel futuro, ou drift de contrato) não pode devolver `undefined`
  // em runtime apesar da assinatura de tipo dizer `string`.
  it("falls back to /login for a truthy role value outside the known map", () => {
    expect(roleHomeRoute("moderador" as UserRole)).toBe("/login")
  })
})
