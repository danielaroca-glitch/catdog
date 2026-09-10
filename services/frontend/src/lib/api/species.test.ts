import { ApiError } from "./auth"
import { listSpecies } from "./species"

describe("listSpecies", () => {
  const accessToken = "access-token-1"

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns the species list on a successful (2xx) response", async () => {
    const species = [
      { id: "species-1", name: "Ave" },
      { id: "species-2", name: "Cachorro" },
    ]
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(species),
    } as Response)

    const result = await listSpecies(accessToken)

    expect(result).toEqual(species)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/species"),
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

    await expect(listSpecies(accessToken)).rejects.toBeInstanceOf(ApiError)
  })
})
