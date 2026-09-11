import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { AnimalsListView } from "./animals-list-view"

const listAnimalsMock = jest.fn()
const listSpeciesMock = jest.fn()
const updateAnimalMock = jest.fn()

jest.mock("../../lib/api/animals", () => ({
  listAnimals: (...args: unknown[]) =>
    (listAnimalsMock as (...args: unknown[]) => unknown)(...args),
  updateAnimal: (...args: unknown[]) =>
    (updateAnimalMock as (...args: unknown[]) => unknown)(...args),
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
    updateAnimalMock.mockReset()
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

  // INATIVACAO-01/06: clicar em "Inativar" chama updateAnimal e atualiza a
  // linha, sem recarregar a página.
  it("inactivates an active animal and updates its displayed status", async () => {
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
    updateAnimalMock.mockResolvedValue({
      id: "animal-1",
      name: "Rex",
      species_id: "species-1",
      active: false,
      created_at: "2026-09-10T00:00:00.000Z",
    })
    const user = userEvent.setup()

    render(<AnimalsListView />)
    await screen.findByText("Rex")

    await user.click(screen.getByTestId("animal-toggle-active-animal-1"))

    await waitFor(() => {
      expect(updateAnimalMock).toHaveBeenCalledWith(
        "animal-1",
        { active: false },
        "access-token-1"
      )
    })
    expect(await screen.findByText("Inativo")).toBeInTheDocument()
  })

  // INATIVACAO-02: clicar em "Reativar" (animal já inativo) chama
  // updateAnimal com active:true.
  it("reactivates an inactive animal", async () => {
    listAnimalsMock.mockResolvedValue([
      {
        id: "animal-1",
        name: "Rex",
        species_id: "species-1",
        active: false,
        created_at: "2026-09-10T00:00:00.000Z",
      },
    ])
    listSpeciesMock.mockResolvedValue([{ id: "species-1", name: "Cachorro" }])
    updateAnimalMock.mockResolvedValue({
      id: "animal-1",
      name: "Rex",
      species_id: "species-1",
      active: true,
      created_at: "2026-09-10T00:00:00.000Z",
    })
    const user = userEvent.setup()

    render(<AnimalsListView />)
    await screen.findByText("Rex")

    await user.click(screen.getByTestId("animal-toggle-active-animal-1"))

    await waitFor(() => {
      expect(updateAnimalMock).toHaveBeenCalledWith(
        "animal-1",
        { active: true },
        "access-token-1"
      )
    })
    expect(await screen.findByText("Ativo")).toBeInTheDocument()
  })

  // Achado #1 (major, review rodada 1): uma falha no toggle não pode
  // esconder a tabela inteira já carregada com sucesso.
  it("shows a toggle-specific error without hiding the already-loaded table", async () => {
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
    updateAnimalMock.mockRejectedValue(new Error("network error"))
    const user = userEvent.setup()

    render(<AnimalsListView />)
    await screen.findByText("Rex")

    await user.click(screen.getByTestId("animal-toggle-active-animal-1"))

    expect(
      await screen.findByTestId("animals-list-toggle-error")
    ).toBeInTheDocument()
    expect(screen.getByTestId("animals-list-table")).toBeInTheDocument()
    expect(screen.getByText("Rex")).toBeInTheDocument()
    expect(screen.queryByTestId("animals-list-error")).not.toBeInTheDocument()
  })
})
