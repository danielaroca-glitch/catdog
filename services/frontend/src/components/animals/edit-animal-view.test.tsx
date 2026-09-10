import { render, screen } from "@testing-library/react"

import { EditAnimalView } from "./edit-animal-view"

const listAnimalsMock = jest.fn()

jest.mock("../../lib/api/animals", () => ({
  listAnimals: (...args: unknown[]) =>
    (listAnimalsMock as (...args: unknown[]) => unknown)(...args),
}))

jest.mock("../../lib/api/species", () => ({
  listSpecies: jest.fn().mockResolvedValue([]),
}))

jest.mock("../../lib/auth/session-context", () => ({
  useSession: () => ({
    session: {
      access_token: "access-token-1",
      refresh_token: "refresh-token-1",
      expires_at: Date.now() + 3600_000,
      role: "admin",
    },
    setSession: jest.fn(),
    clearSession: jest.fn(),
  }),
}))

describe("EditAnimalView", () => {
  beforeEach(() => {
    listAnimalsMock.mockReset()
  })

  it("renders AnimalForm pre-filled with the matching animal", async () => {
    listAnimalsMock.mockResolvedValue([
      {
        id: "animal-1",
        name: "Rex",
        species_id: "species-1",
        active: true,
        created_at: "2026-09-10T00:00:00.000Z",
      },
    ])

    render(<EditAnimalView animalId="animal-1" />)

    expect(await screen.findByTestId("animal-name-input")).toHaveValue("Rex")
  })

  it("shows a not-found message when no animal matches the id", async () => {
    listAnimalsMock.mockResolvedValue([])

    render(<EditAnimalView animalId="animal-inexistente" />)

    expect(await screen.findByTestId("edit-animal-error")).toHaveTextContent(
      "Animal não encontrado."
    )
  })
})
