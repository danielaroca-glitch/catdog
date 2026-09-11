"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { ApiError } from "@/lib/api/auth"
import { listAnimals, updateAnimal, type Animal } from "@/lib/api/animals"
import { listSpecies, type SpeciesOption } from "@/lib/api/species"
import { useSession } from "@/lib/auth/session-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const GENERIC_ERROR_MESSAGE =
  "Não foi possível carregar os animais. Tente novamente mais tarde."
const GENERIC_TOGGLE_ERROR_MESSAGE =
  "Não foi possível atualizar o status do animal. Tente novamente mais tarde."

export function AnimalsListView() {
  const { session } = useSession()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [species, setSpecies] = useState<SpeciesOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      return
    }

    Promise.all([listAnimals(session.access_token), listSpecies(session.access_token)])
      .then(([animalsResult, speciesResult]) => {
        setAnimals(animalsResult)
        setSpecies(speciesResult)
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : GENERIC_ERROR_MESSAGE)
      })
      .finally(() => {
        setIsLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function speciesName(speciesId: string): string {
    return species.find((option) => option.id === speciesId)?.name ?? "—"
  }

  // INATIVACAO-01/02/06: atualiza o status exibido só para o animal
  // afetado, sem recarregar a página inteira.
  async function toggleActive(animal: Animal) {
    if (!session) {
      return
    }

    try {
      const updated = await updateAnimal(
        animal.id,
        { active: !animal.active },
        session.access_token
      )
      setAnimals((current) =>
        current.map((candidate) =>
          candidate.id === updated.id ? updated : candidate
        )
      )
    } catch (err) {
      setError(err instanceof ApiError ? err.message : GENERIC_TOGGLE_ERROR_MESSAGE)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Animais cadastrados</CardTitle>
        <CardDescription>
          Lista de animais para edição ou inativação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div
            role="alert"
            aria-live="polite"
            data-testid="animals-list-error"
            className="text-sm font-normal text-destructive"
          >
            {error}
          </div>
        )}
        {!error && isLoading && (
          <p data-testid="animals-list-loading" className="text-muted-foreground text-sm">
            Carregando...
          </p>
        )}
        {!error && !isLoading && animals.length === 0 && (
          <p data-testid="animals-list-empty" className="text-muted-foreground text-sm">
            Nenhum animal cadastrado ainda.
          </p>
        )}
        {!error && !isLoading && animals.length > 0 && (
          <table className="w-full text-sm" data-testid="animals-list-table">
            <thead>
              <tr className="text-left">
                <th className="pb-2">Nome</th>
                <th className="pb-2">Espécie</th>
                <th className="pb-2">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {animals.map((animal) => (
                <tr key={animal.id} data-testid={`animal-row-${animal.id}`}>
                  <td className="py-1">{animal.name}</td>
                  <td className="py-1">{speciesName(animal.species_id)}</td>
                  <td className="py-1">{animal.active ? "Ativo" : "Inativo"}</td>
                  <td className="py-1 flex items-center gap-3">
                    <Link
                      href={`/admin/animais/${animal.id}/editar`}
                      className="text-primary underline"
                      data-testid={`animal-edit-link-${animal.id}`}
                    >
                      Editar
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void toggleActive(animal)}
                      data-testid={`animal-toggle-active-${animal.id}`}
                    >
                      {animal.active ? "Inativar" : "Reativar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
