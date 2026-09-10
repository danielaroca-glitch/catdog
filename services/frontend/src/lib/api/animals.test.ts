import { ApiError } from "./auth"
import { createAnimal } from "./animals"

describe("createAnimal", () => {
  const payload = { name: "Rex", species_id: "species-1" }
  const accessToken = "access-token-1"

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the created animal on a successful (2xx) response", async () => {
    const createdAnimal = {
      id: "animal-1",
      name: "Rex",
      species_id: "species-1",
      active: true,
      created_at: "2026-09-10T00:00:00.000Z",
    }
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(createdAnimal),
    } as Response)

    const result = await createAnimal(payload, accessToken)

    expect(result).toEqual(createdAnimal)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/animals"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify(payload),
      })
    )
  })

  it("throws an ApiError with the backend's message on a JSON error body (e.g. 400)", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          message: "species_id não corresponde a uma espécie existente.",
        }),
    } as Response)

    await expect(createAnimal(payload, accessToken)).rejects.toMatchObject({
      status: 400,
      message: "species_id não corresponde a uma espécie existente.",
    })
    await expect(createAnimal(payload, accessToken)).rejects.toBeInstanceOf(
      ApiError
    )
  })

  it("throws an ApiError with a generic message when the error body isn't valid JSON", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.reject(new Error("not json")),
    } as unknown as Response)

    await expect(createAnimal(payload, accessToken)).rejects.toMatchObject({
      status: 401,
      message: "Não foi possível cadastrar o animal. Tente novamente mais tarde.",
    })
  })
})
