import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { LoginForm } from "./login-form"

describe("LoginForm (T6)", () => {
  it("desabilita o submit enquanto e-mail ou senha estiverem vazios", async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={jest.fn()} />)

    const submitButton = screen.getByTestId("login-submit-button")
    expect(submitButton).toBeDisabled()

    await user.type(screen.getByTestId("login-email-input"), "marina@example.com")
    expect(submitButton).toBeDisabled()

    await user.type(screen.getByTestId("login-senha-input"), "senha1234")
    expect(submitButton).toBeEnabled()
  })

  it("mostra spinner e desabilita o botão 'Entrar' durante o envio", async () => {
    const user = userEvent.setup()
    let resolveSubmit: () => void = () => {}
    const handleSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        })
    )
    render(<LoginForm onSubmit={handleSubmit} />)

    await user.type(
      screen.getByTestId("login-email-input"),
      "marina@example.com"
    )
    await user.type(screen.getByTestId("login-senha-input"), "senha1234")
    await user.click(screen.getByTestId("login-submit-button"))

    expect(
      await screen.findByTestId("login-submit-spinner")
    ).toBeInTheDocument()
    expect(screen.getByTestId("login-submit-button")).toBeDisabled()

    await act(async () => {
      resolveSubmit()
    })
  })

  it("foca automaticamente no campo de e-mail ao carregar", () => {
    render(<LoginForm onSubmit={jest.fn()} />)

    expect(screen.getByTestId("login-email-input")).toHaveFocus()
  })

  it("associa labels aos campos e anuncia erro de submit via aria-live=polite", async () => {
    const user = userEvent.setup()
    const handleSubmit = jest.fn().mockRejectedValue(new Error("falha"))
    render(<LoginForm onSubmit={handleSubmit} />)

    expect(screen.getByLabelText("E-mail")).toBe(
      screen.getByTestId("login-email-input")
    )
    expect(screen.getByLabelText("Senha")).toBe(
      screen.getByTestId("login-senha-input")
    )

    await user.type(
      screen.getByTestId("login-email-input"),
      "marina@example.com"
    )
    await user.type(screen.getByTestId("login-senha-input"), "senha-errada")
    await user.click(screen.getByTestId("login-submit-button"))

    const errorMessage = await screen.findByTestId("login-form-error")
    expect(errorMessage).toHaveAttribute("aria-live", "polite")
    expect(errorMessage).toHaveTextContent(
      "Não foi possível entrar. Tente novamente mais tarde."
    )
  })
})
