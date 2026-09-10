import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { AccessDenied } from "./access-denied"

const pushMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe("AccessDenied (T8)", () => {
  beforeEach(() => {
    pushMock.mockReset()
  })

  // EXPERIENCE.md (Piso de Acessibilidade): "heading claro (<h1>) e foco
  // movido para ele ao carregar, para leitores de tela anunciarem o
  // bloqueio imediatamente."
  it("renders an <h1> heading and moves focus to it on mount", () => {
    render(<AccessDenied homeRoute="/cliente" />)

    const heading = screen.getByTestId("access-denied-heading")
    expect(heading.tagName).toBe("H1")
    expect(heading).toHaveFocus()
  })

  // EXPERIENCE.md (Voz e Tom): "Você não tem permissão para acessar esta
  // página." — nunca linguagem técnica ("Acesso proibido. Erro 403.").
  it("shows the exact neutral message from EXPERIENCE.md, never a technical error code", () => {
    render(<AccessDenied homeRoute="/cliente" />)

    expect(screen.getByTestId("access-denied-heading")).toHaveTextContent(
      "Você não tem permissão para acessar esta página."
    )
    expect(screen.queryByText(/403/)).not.toBeInTheDocument()
  })

  // DESIGN.md: ícone neutro em `{colors.muted-foreground}` — nunca
  // `{colors.destructive}` (reservado a erros de formulário/credenciais).
  it("renders the icon in muted-foreground, never destructive", () => {
    render(<AccessDenied homeRoute="/cliente" />)

    const icon = screen.getByTestId("access-denied-icon")
    expect(icon).toHaveClass("text-muted-foreground")
    expect(icon.getAttribute("class")).not.toMatch(/destructive/)
  })

  it("renders a single 'Voltar para minha área' action button", () => {
    render(<AccessDenied homeRoute="/cliente" />)

    expect(
      screen.getByRole("button", { name: "Voltar para minha área" })
    ).toBeInTheDocument()
  })

  it("navigates to the given homeRoute when the back button is clicked", async () => {
    const user = userEvent.setup()
    render(<AccessDenied homeRoute="/admin" />)

    await user.click(
      screen.getByRole("button", { name: "Voltar para minha área" })
    )

    expect(pushMock).toHaveBeenCalledWith("/admin")
  })
})
