import {
  ApiError,
  authenticatedFetch,
  EMAIL_NOT_CONFIRMED_CODE,
  loginUser,
  registerUser,
} from "./auth"

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
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(registeredUser),
    } as Response)

    const result = await registerUser(payload)

    expect(result).toEqual(registeredUser)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/register"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    )
  })

  it("throws an ApiError with the backend's message on a JSON error body (e.g. 409)", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
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
    globalThis.fetch = jest.fn().mockResolvedValue({
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
    globalThis.fetch = jest.fn().mockResolvedValue({
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

describe("loginUser", () => {
  const payload = {
    email: "marina@example.com",
    senha: "password123",
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the authenticated session on a successful (2xx) response", async () => {
    const authenticatedSession = {
      access_token: "access-token-123",
      refresh_token: "refresh-token-456",
      expires_in: 3600,
    }
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(authenticatedSession),
    } as Response)

    const result = await loginUser(payload)

    expect(result).toEqual(authenticatedSession)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    )
  })

  it("throws an ApiError carrying the 'email_not_confirmed' code on a 403 response", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () =>
        Promise.resolve({
          code: "email_not_confirmed",
          message:
            "E-mail ainda não confirmado. Reenvie o e-mail de confirmação para continuar.",
        }),
    } as Response)

    await expect(loginUser(payload)).rejects.toMatchObject({
      status: 403,
      code: EMAIL_NOT_CONFIRMED_CODE,
    })
    await expect(loginUser(payload)).rejects.toBeInstanceOf(ApiError)
  })

  it("throws an ApiError with status 401 and no code on invalid credentials", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "E-mail ou senha incorretos." }),
    } as Response)

    await expect(loginUser(payload)).rejects.toMatchObject({
      status: 401,
      message: "E-mail ou senha incorretos.",
      code: undefined,
    })
  })

  it("throws an ApiError with a generic message when the error body isn't valid JSON", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    } as unknown as Response)

    await expect(loginUser(payload)).rejects.toMatchObject({
      status: 500,
      message: "Não foi possível concluir o cadastro. Tente novamente mais tarde.",
    })
  })
})

describe("authenticatedFetch", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("injects the Authorization header with the given access token", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)

    await authenticatedFetch("http://localhost:3001/animais", "access-token-123")

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/animais",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token-123",
        }),
      })
    )
  })

  it("preserves other init options (method, existing headers, body) while adding Authorization", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)

    await authenticatedFetch("http://localhost:3001/animais", "access-token-123", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "Rex" }),
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/animais",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ nome: "Rex" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer access-token-123",
        }),
      })
    )
  })
})
