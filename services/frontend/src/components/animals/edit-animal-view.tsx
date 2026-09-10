"use client"

import { useEffect, useState } from "react"

import { ApiError } from "@/lib/api/auth"
import { listAnimals, type Animal } from "@/lib/api/animals"
import { useSession } from "@/lib/auth/session-context"
import { AnimalForm } from "@/components/animals/animal-form"

const GENERIC_ERROR_MESSAGE =
  "Não foi possível carregar o animal. Tente novamente mais tarde."
const NOT_FOUND_MESSAGE = "Animal não encontrado."

export interface EditAnimalViewProps {
  readonly animalId: string
}

/**
 * Carrega o animal a editar (pbi-002, T6). Não existe `GET /animals/:id`
 * nesta PBI (fora de escopo — ver task.md) — busca em `GET /animals` já
 * existente e filtra pelo id, mesma fonte de dados da listagem.
 */
export function EditAnimalView({ animalId }: EditAnimalViewProps) {
  const { session } = useSession()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      return
    }

    listAnimals(session.access_token)
      .then((animals) => {
        const found = animals.find((candidate) => candidate.id === animalId)
        if (!found) {
          setError(NOT_FOUND_MESSAGE)
          return
        }
        setAnimal(found)
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : GENERIC_ERROR_MESSAGE)
      })
      .finally(() => {
        setIsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId])

  if (error) {
    return (
      <p role="alert" data-testid="edit-animal-error" className="text-destructive text-sm">
        {error}
      </p>
    )
  }

  if (isLoading || !animal) {
    return (
      <p data-testid="edit-animal-loading" className="text-muted-foreground text-sm">
        Carregando...
      </p>
    )
  }

  return <AnimalForm animalToEdit={animal} />
}
