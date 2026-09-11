"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { ApiError } from "@/lib/api/auth"
import { createAnimal, updateAnimal, type Animal } from "@/lib/api/animals"
import { listSpecies, type SpeciesOption } from "@/lib/api/species"
import { useSession } from "@/lib/auth/session-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const GENERIC_CREATE_ERROR_MESSAGE =
  "Não foi possível cadastrar o animal. Tente novamente mais tarde."
const GENERIC_UPDATE_ERROR_MESSAGE =
  "Não foi possível atualizar o animal. Tente novamente mais tarde."
const GENERIC_SPECIES_ERROR_MESSAGE =
  "Não foi possível carregar a lista de espécies. Tente novamente mais tarde."

const animalFormSchema = z.object({
  name: z.string().min(1, "Informe o nome do animal."),
  species_id: z.string().min(1, "Selecione uma espécie."),
})

export type AnimalFormValues = z.infer<typeof animalFormSchema>

function submitButtonLabel(isEditMode: boolean, isSubmitting: boolean): string {
  if (isEditMode) {
    return isSubmitting ? "Salvando..." : "Salvar"
  }

  return isSubmitting ? "Cadastrando..." : "Cadastrar"
}

export interface AnimalFormProps {
  /**
   * Callback opcional chamado com os dados validados no submit, no lugar da
   * integração padrão com a API (`createAnimal`). Usado principalmente em
   * testes para observar o submit sem depender de `fetch`. Quando omitido,
   * o formulário chama `POST /animals` e exibe confirmação em caso de
   * sucesso (ALTA-01).
   */
  readonly onSubmit?: (values: AnimalFormValues) => void | Promise<void>
  /**
   * Lista de espécies inicial, no lugar da integração padrão com
   * `listSpecies`. Usado principalmente em testes.
   */
  readonly initialSpecies?: SpeciesOption[]
  /**
   * Animal a editar (pbi-002, EDICAO-01/EDICAO-02). Quando informado, o
   * formulário nasce preenchido com os dados desse animal e o submit chama
   * `updateAnimal` em vez de `createAnimal`. Omitido → modo de criação
   * (comportamento original, T6 de pbi-001).
   */
  readonly animalToEdit?: Animal
}

export function AnimalForm({
  onSubmit,
  initialSpecies,
  animalToEdit,
}: AnimalFormProps) {
  const { session } = useSession()
  const isEditMode = animalToEdit !== undefined
  const [species, setSpecies] = useState<SpeciesOption[]>(initialSpecies ?? [])
  const [speciesError, setSpeciesError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm<AnimalFormValues>({
    resolver: zodResolver(animalFormSchema),
    mode: "onBlur",
    defaultValues: {
      name: animalToEdit?.name ?? "",
      species_id: animalToEdit?.species_id ?? "",
    },
  })

  const isSubmitting = form.formState.isSubmitting

  useEffect(() => {
    if (initialSpecies || !session) {
      return
    }

    listSpecies(session.access_token)
      .then(setSpecies)
      .catch(() => {
        setSpeciesError(GENERIC_SPECIES_ERROR_MESSAGE)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleValidSubmit(values: AnimalFormValues) {
    setSubmitError(null)
    setSubmitSuccess(false)

    if (onSubmit) {
      await onSubmit(values)
      return
    }

    if (!session) {
      setSubmitError(
        isEditMode ? GENERIC_UPDATE_ERROR_MESSAGE : GENERIC_CREATE_ERROR_MESSAGE
      )
      return
    }

    try {
      if (isEditMode) {
        await updateAnimal(animalToEdit.id, values, session.access_token)
      } else {
        await createAnimal(values, session.access_token)
      }
      setSubmitSuccess(true)
      if (!isEditMode) {
        form.reset()
      }
    } catch (error) {
      const fallback = isEditMode
        ? GENERIC_UPDATE_ERROR_MESSAGE
        : GENERIC_CREATE_ERROR_MESSAGE
      setSubmitError(error instanceof ApiError ? error.message : fallback)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{isEditMode ? "Editar animal" : "Cadastrar animal"}</CardTitle>
        <CardDescription>
          {isEditMode
            ? "Atualize os dados deste animal."
            : "Adicione um novo animal disponível para adoção."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="animal-form"
          noValidate
          onSubmit={form.handleSubmit(handleValidSubmit)}
        >
          <FieldGroup>
            {submitError && (
              <div
                role="alert"
                aria-live="polite"
                data-testid="animal-form-error"
                className="text-sm font-normal text-destructive"
              >
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div
                role="status"
                aria-live="polite"
                data-testid="animal-form-success"
                className="text-sm font-normal text-primary"
              >
                {isEditMode
                  ? "Animal atualizado com sucesso."
                  : "Animal cadastrado com sucesso."}
              </div>
            )}
            {speciesError && (
              <div
                role="alert"
                aria-live="polite"
                data-testid="animal-form-species-error"
                className="text-sm font-normal text-destructive"
              >
                {speciesError}
              </div>
            )}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="animal-form-name">Nome</FieldLabel>
                  <Input
                    {...field}
                    id="animal-form-name"
                    autoFocus
                    aria-invalid={fieldState.invalid}
                    data-testid="animal-name-input"
                  />
                  {fieldState.invalid && (
                    <FieldError
                      aria-live="polite"
                      errors={[fieldState.error]}
                      data-testid="animal-name-error"
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              name="species_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="animal-form-species">
                    Espécie
                  </FieldLabel>
                  <select
                    {...field}
                    id="animal-form-species"
                    aria-invalid={fieldState.invalid}
                    data-testid="animal-species-select"
                    className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                  >
                    <option value="" disabled>
                      Selecione uma espécie
                    </option>
                    {species.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {fieldState.invalid && (
                    <FieldError
                      aria-live="polite"
                      errors={[fieldState.error]}
                      data-testid="animal-species-error"
                    />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="animal-form"
          className="w-full"
          disabled={isSubmitting}
          data-testid="animal-submit-button"
        >
          {isSubmitting && (
            <Loader2
              className="animate-spin"
              aria-hidden="true"
              data-testid="animal-submit-spinner"
            />
          )}
          {submitButtonLabel(isEditMode, isSubmitting)}
        </Button>
      </CardFooter>
    </Card>
  )
}
