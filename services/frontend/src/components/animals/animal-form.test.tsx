import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { AnimalForm } from "./animal-form"

const createAnimalMock = jest.fn()

jest.mock("../../lib/api/animals", () => ({
  createAnimal: (...args: unknown[]) =>
    (createAnimalMock as (...args: unknown[]) => unknown)(...args),
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

const SPECIES = [{ id: "species-1", name: "Cachorro" }]

describe("AnimalForm", () => {
  beforeEach(() => {
    createAnimalMock.mockReset()
  })

  // ALTA-08: submeter sem preencher um campo obrigatório exibe erro de
  // validação e não chama a API.
  it("shows a validation error and does not submit when a required field is empty", async () => {
    const onSubmit = jest.fn()
    const user = userEvent.setup()
    render(<AnimalForm onSubmit={onSubmit} initialSpecies={SPECIES} />)

    await user.click(screen.getByTestId("animal-submit-button"))

    expect(await screen.findByTestId("animal-name-error")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("calls createAnimal and shows a success message on a valid submission", async () => {
    createAnimalMock.mockResolvedValue({
      id: "animal-1",
      name: "Rex",
      species_id: "species-1",
      active: true,
      created_at: "2026-09-10T00:00:00.000Z",
    })
    const user = userEvent.setup()
    render(<AnimalForm initialSpecies={SPECIES} />)

    await user.type(screen.getByTestId("animal-name-input"), "Rex")
    await user.selectOptions(
      screen.getByTestId("animal-species-select"),
      "species-1"
    )
    await user.click(screen.getByTestId("animal-submit-button"))

    await waitFor(() => {
      expect(createAnimalMock).toHaveBeenCalledWith(
        { name: "Rex", species_id: "species-1" },
        "access-token-1"
      )
    })
    expect(
      await screen.findByTestId("animal-form-success")
    ).toBeInTheDocument()
  })
})
