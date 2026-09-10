import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError, EMAIL_NOT_CONFIRMED_CODE } from "@/lib/api/auth"

import { LoginForm } from "./login-form"

const pushMock = jest.fn()
const setSessionMock = jest.fn()
const loginUserMock = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

jest.mock("../../lib/auth/session-context", () => ({
  useSession: () => ({
    session: null,
    setSession: setSessionMock,
    clearSession: jest.fn(),
  }),
}))

// NOTA: caminho relativo — mesmo motivo documentado em
// register-form.register-api.test.tsx: o alias "@/..." só é resolvido em
// tempo de transform (via tsconfig paths, pelo transform do next/jest);
// `jest.mock(...)` resolve seu especificador em tempo de execução pelo
// resolver padrão do Jest, que não tem esse alias no `moduleNameMapper`.
// Ambos os caminhos apontam para o mesmo arquivo, então o mock intercepta
// corretamente o import feito via alias em `login-form.tsx`.
jest.mock("../../lib/api/auth", () => {
  const actual = jest.requireActual("../../lib/api/auth")
  return {
    ...actual,
    loginUser: (...args: unknown[]) => loginUserMock(...args),
  }
})

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId("login-email-input"), "marina@example.com")
  await user.type(screen.getByTestId("login-senha-input"), "senha1234")
}

describe("LoginForm - integração com a API de login (T8)", () => {
  beforeEach(() => {
    pushMock.mockReset()
    setSessionMock.mockReset()
    loginUserMock.mockReset()
  })

  it("em submit bem-sucedido, chama setSession com o resultado e navega para '/'", async () => {
    const authenticatedSession = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-456",
      expires_in: 3600,
    }
    loginUserMock.mockResolvedValueOnce(authenticatedSession)
    const user = userEvent.setup()
    render(<LoginForm />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("login-submit-button"))

    await waitFor(() => {
      expect(loginUserMock).toHaveBeenCalledWith({
        email: "marina@example.com",
        senha: "senha1234",
      })
    })
    await waitFor(() => {
      expect(setSessionMock).toHaveBeenCalledWith(authenticatedSession)
    })
    // TODO(pbi-003): redirecionamento real por papel — hoje sempre "/".
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/")
    })
  })

  it("em 403 com código 'email_not_confirmed', mostra alerta neutro com opção de reenvio, sem erro genérico", async () => {
    loginUserMock.mockRejectedValueOnce(
      new ApiError(
        403,
        "E-mail ainda não confirmado. Reenvie o e-mail de confirmação para continuar.",
        EMAIL_NOT_CONFIRMED_CODE
      )
    )
    const user = userEvent.setup()
    render(<LoginForm />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("login-submit-button"))

    expect(
      await screen.findByTestId("login-email-not-confirmed-alert")
    ).toBeInTheDocument()
    expect(screen.getByTestId("resend-confirmation-button")).toBeInTheDocument()
    expect(screen.queryByTestId("login-form-error")).not.toBeInTheDocument()
    expect(setSessionMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("permite reenviar a confirmação (cooldown) a partir do alerta de e-mail não confirmado", async () => {
    loginUserMock.mockRejectedValueOnce(
      new ApiError(403, "E-mail ainda não confirmado.", EMAIL_NOT_CONFIRMED_CODE)
    )
    const user = userEvent.setup()
    render(<LoginForm />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("login-submit-button"))

    const resendButton = await screen.findByTestId("resend-confirmation-button")
    expect(resendButton).toBeEnabled()

    await user.click(resendButton)

    expect(resendButton).toBeDisabled()
  })

  it("em 401, mostra erro genérico de credenciais inválidas, sem indicar qual campo", async () => {
    loginUserMock.mockRejectedValueOnce(
      new ApiError(401, "E-mail ou senha incorretos.")
    )
    const user = userEvent.setup()
    render(<LoginForm />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("login-submit-button"))

    const errorMessage = await screen.findByTestId("login-form-error")
    expect(errorMessage).toHaveTextContent("E-mail ou senha incorretos.")
    expect(
      screen.queryByTestId("login-email-not-confirmed-alert")
    ).not.toBeInTheDocument()
    expect(setSessionMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("em erro inesperado (ex.: 500), mostra a mensagem genérica de submit", async () => {
    loginUserMock.mockRejectedValueOnce(new ApiError(500, "boom"))
    const user = userEvent.setup()
    render(<LoginForm />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("login-submit-button"))

    const errorMessage = await screen.findByTestId("login-form-error")
    expect(errorMessage).toHaveTextContent(
      "Não foi possível entrar. Tente novamente mais tarde."
    )
  })

  it("quando onSubmit é fornecido via prop, usa esse callback em vez de chamar a API (não quebra o contrato de T6)", async () => {
    const handleSubmit = jest.fn()
    const user = userEvent.setup()
    render(<LoginForm onSubmit={handleSubmit} />)

    await fillValidForm(user)
    await user.click(screen.getByTestId("login-submit-button"))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled()
    })
    expect(loginUserMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
    expect(setSessionMock).not.toHaveBeenCalled()
  })
})
