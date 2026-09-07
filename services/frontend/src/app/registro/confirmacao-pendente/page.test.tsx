import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// A página usa `useSearchParams` (next/navigation) para ler o e-mail
// propagado pelo redirect de sucesso do RegisterForm (T9/T10, via query
// string ?email=...). Mockado aqui como o restante da suíte já faz com
// `useRouter` em register-form.test.tsx.
let mockSearchParams = new URLSearchParams()

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}))

import ConfirmacaoPendentePage from "./page"

describe("ConfirmacaoPendentePage (T10)", () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams()
  })

  it("exibe o e-mail informado no registro, propagado via query string", () => {
    mockSearchParams = new URLSearchParams({ email: "marina@example.com" })
    render(<ConfirmacaoPendentePage />)

    expect(
      screen.getByText(
        "Enviamos um e-mail de confirmação para marina@example.com."
      )
    ).toBeInTheDocument()
  })

  it("desabilita o botão de reenvio e mostra a contagem regressiva após o clique", async () => {
    mockSearchParams = new URLSearchParams({ email: "marina@example.com" })
    const user = userEvent.setup()
    render(<ConfirmacaoPendentePage />)

    const button = screen.getByTestId("resend-confirmation-button")
    expect(button).toBeEnabled()
    expect(button).toHaveTextContent("Reenviar confirmação")

    await user.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveTextContent("30")
  })

  it("reabilita o botão de reenvio quando o cooldown termina (fake timers)", async () => {
    jest.useFakeTimers()
    mockSearchParams = new URLSearchParams({ email: "marina@example.com" })
    const user = userEvent.setup({ delay: null })
    render(<ConfirmacaoPendentePage />)

    const button = screen.getByTestId("resend-confirmation-button")
    await user.click(button)
    expect(button).toBeDisabled()

    act(() => {
      jest.advanceTimersByTime(30_000)
    })

    expect(button).toBeEnabled()
    expect(button).toHaveTextContent("Reenviar confirmação")

    jest.useRealTimers()
  })
})
