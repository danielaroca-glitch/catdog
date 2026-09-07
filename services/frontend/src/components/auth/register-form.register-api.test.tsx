import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError, registerUser } from "@/lib/api/auth"

import { RegisterForm } from "./register-form"

const pushMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

// NOTA: o mock precisa usar o caminho relativo (não o alias "@/...").
// O alias só é resolvido em tempo de transform (via tsconfig paths, pelo
// transform do next/jest); `jest.mock(...)` resolve seu especificador em
// tempo de execução pelo resolver padrão do Jest, que não tem esse alias no
// `moduleNameMapper`. Ambos os caminhos apontam para o mesmo arquivo, então
// o mock intercepta corretamente o import feito via alias em
// `register-form.tsx`.
jest.mock("../../lib/api/auth", () => {
  const actual = jest.requireActual("../../lib/api/auth")
  return {
    ...actual,
    registerUser: jest.fn(),
  }
})

const registerUserMock = registerUser as jest.MockedFunction<
  typeof registerUser
>

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
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

describe("RegisterForm - integração com a API de registro (T9)", () => {
  beforeEach(() => {
    pushMock.mockReset()
    registerUserMock.mockReset()
  })

  it("em submit bem-sucedido, chama registerUser e redireciona para a confirmação pendente", async () => {
    registerUserMock.mockResolvedValueOnce({
      id: "user-1",
      email: "marina@example.com",
      role: "adotante",
    })
    const user = userEvent.setup()
    render(<RegisterForm />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("register-submit-button"))

    await waitFor(() => {
      expect(registerUserMock).toHaveBeenCalledWith({
        nome: "Marina",
        email: "marina@example.com",
        senha: "senha1234",
        confirmarSenha: "senha1234",
      })
    })
    await waitFor(() => {
      // T10: o e-mail viaja como query string para a tela de confirmação
      // pendente exibir "Enviamos um e-mail de confirmação para {email}."
      expect(pushMock).toHaveBeenCalledWith(
        "/registro/confirmacao-pendente?email=marina%40example.com"
      )
    })
  })

  it("em erro 409, exibe mensagem de e-mail já cadastrado e não redireciona", async () => {
    registerUserMock.mockRejectedValueOnce(
      new ApiError(409, "Não foi possível concluir o cadastro com os dados informados.")
    )
    const user = userEvent.setup()
    render(<RegisterForm />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("register-submit-button"))

    expect(
      await screen.findByText(/e-mail já está cadastrado/i)
    ).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("em erro genérico (não 409), exibe mensagem de erro genérica", async () => {
    registerUserMock.mockRejectedValueOnce(new ApiError(500, "boom"))
    const user = userEvent.setup()
    render(<RegisterForm />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("register-submit-button"))

    expect(
      await screen.findByText(/não foi possível concluir o cadastro/i)
    ).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("exibe estado de loading (botão desabilitado com spinner) durante o request", async () => {
    let resolveRegister: (value: {
      id: string
      email: string
      role: "adotante"
    }) => void = () => {}
    registerUserMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve
        })
    )
    const user = userEvent.setup()
    render(<RegisterForm />)

    await fillValidForm(user)
    const submitButton = screen.getByTestId("register-submit-button")
    await user.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
    expect(
      screen.getByTestId("register-submit-spinner")
    ).toBeInTheDocument()

    resolveRegister({ id: "user-1", email: "marina@example.com", role: "adotante" })

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/registro/confirmacao-pendente?email=marina%40example.com"
      )
    })
  })

  it("quando onSubmit é fornecido via prop, usa esse callback em vez de chamar a API (não quebra o contrato de T8)", async () => {
    const handleSubmit = jest.fn()
    const user = userEvent.setup()
    render(<RegisterForm onSubmit={handleSubmit} />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("register-submit-button"))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled()
    })
    expect(registerUserMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })
})
