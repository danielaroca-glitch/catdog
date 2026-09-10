import { ApiError } from "./auth"
import { createAnimal, listAnimals, updateAnimal } from "./animals"

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

describe("updateAnimal", () => {
  const accessToken = "access-token-1"

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the updated animal on a successful (2xx) response", async () => {
    const updatedAnimal = {
      id: "animal-1",
      name: "Rex 2",
      species_id: "species-2",
      active: true,
      created_at: "2026-09-10T00:00:00.000Z",
    }
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updatedAnimal),
    } as Response)

    const payload = { name: "Rex 2", species_id: "species-2" }
    const result = await updateAnimal("animal-1", payload, accessToken)

    expect(result).toEqual(updatedAnimal)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/animals/animal-1"),
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        }),
        body: JSON.stringify(payload),
      })
    )
  })

  it("throws an ApiError with a generic message when the error body isn't valid JSON", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.reject(new Error("not json")),
    } as unknown as Response)

    await expect(
      updateAnimal("animal-1", { name: "Rex 2" }, accessToken)
    ).rejects.toMatchObject({
      status: 404,
      message: "Não foi possível atualizar o animal. Tente novamente mais tarde.",
    })
  })
})

describe("listAnimals", () => {
  const accessToken = "access-token-1"

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the animal list on a successful (2xx) response", async () => {
    const animals = [
      {
        id: "animal-1",
        name: "Rex",
        species_id: "species-1",
        active: true,
        created_at: "2026-09-10T00:00:00.000Z",
      },
    ]
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(animals),
    } as Response)

    const result = await listAnimals(accessToken)

    expect(result).toEqual(animals)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/animals"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
      })
    )
  })

  it("throws an ApiError on a non-2xx response", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({}),
    } as Response)

    await expect(listAnimals(accessToken)).rejects.toBeInstanceOf(ApiError)
  })
})
