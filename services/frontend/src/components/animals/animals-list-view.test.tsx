import { render, screen } from "@testing-library/react"

import { AnimalsListView } from "./animals-list-view"

const listAnimalsMock = jest.fn()
const listSpeciesMock = jest.fn()

jest.mock("../../lib/api/animals", () => ({
  listAnimals: (...args: unknown[]) =>
    (listAnimalsMock as (...args: unknown[]) => unknown)(...args),
}))

jest.mock("../../lib/api/species", () => ({
  listSpecies: (...args: unknown[]) =>
    (listSpeciesMock as (...args: unknown[]) => unknown)(...args),
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

describe("AnimalsListView", () => {
  beforeEach(() => {
    listAnimalsMock.mockReset()
    listSpeciesMock.mockReset()
  })

  it("renders each animal with its species name and an edit link (EDICAO-10)", async () => {
    listAnimalsMock.mockResolvedValue([
      {
        id: "animal-1",
        name: "Rex",
        species_id: "species-1",
        active: true,
        created_at: "2026-09-10T00:00:00.000Z",
      },
    ])
    listSpeciesMock.mockResolvedValue([{ id: "species-1", name: "Cachorro" }])

    render(<AnimalsListView />)

    expect(await screen.findByText("Rex")).toBeInTheDocument()
    expect(screen.getByText("Cachorro")).toBeInTheDocument()
    expect(screen.getByText("Ativo")).toBeInTheDocument()
    expect(screen.getByTestId("animal-edit-link-animal-1")).toHaveAttribute(
      "href",
      "/admin/animais/animal-1/editar"
    )
  })

  it("shows an empty-state message when there are no animals", async () => {
    listAnimalsMock.mockResolvedValue([])
    listSpeciesMock.mockResolvedValue([])

    render(<AnimalsListView />)

    expect(await screen.findByTestId("animals-list-empty")).toBeInTheDocument()
  })

  it("shows an error message when listAnimals rejects", async () => {
    listAnimalsMock.mockRejectedValue(new Error("network error"))
    listSpeciesMock.mockResolvedValue([])

    render(<AnimalsListView />)

    expect(await screen.findByTestId("animals-list-error")).toBeInTheDocument()
  })
})
