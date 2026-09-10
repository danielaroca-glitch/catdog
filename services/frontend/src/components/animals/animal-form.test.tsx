import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "../../lib/api/auth"
import { AnimalForm } from "./animal-form"

const createAnimalMock = jest.fn()
const updateAnimalMock = jest.fn()

jest.mock("../../lib/api/animals", () => ({
  createAnimal: (...args: unknown[]) =>
    (createAnimalMock as (...args: unknown[]) => unknown)(...args),
  updateAnimal: (...args: unknown[]) =>
    (updateAnimalMock as (...args: unknown[]) => unknown)(...args),
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
    updateAnimalMock.mockReset()
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

  it("shows the backend's error message when createAnimal rejects with an ApiError", async () => {
    createAnimalMock.mockRejectedValue(
      new ApiError(400, "species_id não corresponde a uma espécie existente.")
    )
    const user = userEvent.setup()
    render(<AnimalForm initialSpecies={SPECIES} />)

    await user.type(screen.getByTestId("animal-name-input"), "Rex")
    await user.selectOptions(
      screen.getByTestId("animal-species-select"),
      "species-1"
    )
    await user.click(screen.getByTestId("animal-submit-button"))

    expect(await screen.findByTestId("animal-form-error")).toHaveTextContent(
      "species_id não corresponde a uma espécie existente."
    )
    expect(screen.queryByTestId("animal-form-success")).not.toBeInTheDocument()
  })

  // EDICAO-01/EDICAO-02: com animalToEdit, o formulário nasce preenchido e
  // o submit chama updateAnimal, não createAnimal.
  it("pre-fills the fields and calls updateAnimal when animalToEdit is provided", async () => {
    const animalToEdit = {
      id: "animal-1",
      name: "Rex",
      species_id: "species-1",
      active: true,
      created_at: "2026-09-10T00:00:00.000Z",
    }
    updateAnimalMock.mockResolvedValue({ ...animalToEdit, name: "Rex 2" })
    const user = userEvent.setup()
    render(<AnimalForm initialSpecies={SPECIES} animalToEdit={animalToEdit} />)

    expect(screen.getByTestId("animal-name-input")).toHaveValue("Rex")
    expect(screen.getByTestId("animal-species-select")).toHaveValue(
      "species-1"
    )

    await user.clear(screen.getByTestId("animal-name-input"))
    await user.type(screen.getByTestId("animal-name-input"), "Rex 2")
    await user.click(screen.getByTestId("animal-submit-button"))

    await waitFor(() => {
      expect(updateAnimalMock).toHaveBeenCalledWith(
        "animal-1",
        { name: "Rex 2", species_id: "species-1" },
        "access-token-1"
      )
    })
    expect(createAnimalMock).not.toHaveBeenCalled()
    expect(
      await screen.findByTestId("animal-form-success")
    ).toHaveTextContent("Animal atualizado com sucesso.")
  })
})
