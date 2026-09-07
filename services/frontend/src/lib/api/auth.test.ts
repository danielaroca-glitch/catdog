import { ApiError, registerUser } from "./auth"

describe("registerUser", () => {
  const payload = {
    nome: "Marina",
    email: "marina@example.com",
    senha: "password123",
    confirmarSenha: "password123",
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the registered user on a successful (2xx) response", async () => {
    const registeredUser = {
      id: "user-1",
      email: payload.email,
      role: "adotante" as const,
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(registeredUser),
    } as Response)

    const result = await registerUser(payload)

    expect(result).toEqual(registeredUser)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/register"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    )
  })

  it("throws an ApiError with the backend's message on a JSON error body (e.g. 409)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: "E-mail já cadastrado." }),
    } as Response)

    await expect(registerUser(payload)).rejects.toMatchObject({
      status: 409,
      message: "E-mail já cadastrado.",
    })
    await expect(registerUser(payload)).rejects.toBeInstanceOf(ApiError)
  })

  it("throws an ApiError with a generic message when the error body isn't valid JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    } as unknown as Response)

    await expect(registerUser(payload)).rejects.toMatchObject({
      status: 500,
      message: "Não foi possível concluir o cadastro. Tente novamente mais tarde.",
    })
  })

  it("throws an ApiError with the generic message when the JSON body has no 'message' field", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ some: "other-shape" }),
    } as Response)

    await expect(registerUser(payload)).rejects.toMatchObject({
      status: 400,
      message: "Não foi possível concluir o cadastro. Tente novamente mais tarde.",
    })
  })
})
