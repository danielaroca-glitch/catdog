import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { RegisterForm } from "./register-form"

function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  return async () => {
    await user.type(screen.getByTestId("register-nome-input"), "Marina")
    await user.type(
      screen.getByTestId("register-email-input"),
      "marina@example.com"
    )
    await user.type(screen.getByTestId("register-senha-input"), "senha1234")
    await user.type(
      screen.getByTestId("register-confirmar-senha-input"),
      "senha1234"
    )
  }
}

describe("RegisterForm", () => {
  it("exibe 'As senhas não coincidem' quando a confirmação diverge da senha (blur)", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByTestId("register-senha-input"), "senha1234")
    await user.type(
      screen.getByTestId("register-confirmar-senha-input"),
      "outrasenha"
    )
    await user.tab()

    expect(
      await screen.findByText("As senhas não coincidem.")
    ).toBeInTheDocument()
  })

  it("bloqueia o submit com e-mail em formato inválido", async () => {
    const user = userEvent.setup()
    const handleSubmit = jest.fn()
    render(<RegisterForm onSubmit={handleSubmit} />)

    await user.type(screen.getByTestId("register-nome-input"), "Marina")
    await user.type(screen.getByTestId("register-email-input"), "email-invalido")
    await user.type(screen.getByTestId("register-senha-input"), "senha1234")
    await user.type(
      screen.getByTestId("register-confirmar-senha-input"),
      "senha1234"
    )
    await user.click(screen.getByTestId("register-submit-button"))

    expect(
      await screen.findByText("Informe um e-mail válido.")
    ).toBeInTheDocument()
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it("bloqueia o submit com senha menor que 8 caracteres", async () => {
    const user = userEvent.setup()
    const handleSubmit = jest.fn()
    render(<RegisterForm onSubmit={handleSubmit} />)

    await user.type(screen.getByTestId("register-nome-input"), "Marina")
    await user.type(
      screen.getByTestId("register-email-input"),
      "marina@example.com"
    )
    await user.type(screen.getByTestId("register-senha-input"), "abc123")
    await user.type(
      screen.getByTestId("register-confirmar-senha-input"),
      "abc123"
    )
    await user.click(screen.getByTestId("register-submit-button"))

    expect(
      await screen.findByText("A senha deve ter pelo menos 8 caracteres.")
    ).toBeInTheDocument()
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it("permite o submit quando todos os dados são válidos", async () => {
    const user = userEvent.setup()
    const handleSubmit = jest.fn()
    render(<RegisterForm onSubmit={handleSubmit} />)

    await fillValidForm(user)()
    await user.click(screen.getByTestId("register-submit-button"))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        nome: "Marina",
        email: "marina@example.com",
        senha: "senha1234",
        confirmarSenha: "senha1234",
      })
    })
  })
})
