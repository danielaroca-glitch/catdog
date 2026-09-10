/**
 * Cliente da API de animais (ALTA-01).
 *
 * Fala com `POST /animals` do backend NestJS
 * (`services/backend/src/animals/animals.controller.ts`). O shape do payload
 * espelha 1:1 `CreateAnimalDto` do backend.
 */

import { ApiError, authenticatedFetch } from "./auth"

const DEFAULT_API_URL = "http://localhost:3001"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL

const GENERIC_CREATE_ERROR_MESSAGE =
  "Não foi possível cadastrar o animal. Tente novamente mais tarde."
const GENERIC_UPDATE_ERROR_MESSAGE =
  "Não foi possível atualizar o animal. Tente novamente mais tarde."
const GENERIC_LIST_ERROR_MESSAGE =
  "Não foi possível carregar a lista de animais. Tente novamente mais tarde."

export interface CreateAnimalPayload {
  name: string
  species_id: string
}

export interface UpdateAnimalPayload {
  name?: string
  species_id?: string
}

export interface Animal {
  id: string
  name: string
  species_id: string
  active: boolean
  created_at: string
}

async function extractErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (
      data &&
      typeof data === "object" &&
      typeof (data as { message?: unknown }).message === "string"
    ) {
      return (data as { message: string }).message
    }
  } catch {
    // Corpo não é JSON válido (ou vazio) — cai no fallback abaixo.
  }

  return fallback
}

export async function createAnimal(
  payload: CreateAnimalPayload,
  accessToken: string
): Promise<Animal> {
  const response = await authenticatedFetch(`${API_URL}/animals`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await extractErrorMessage(response, GENERIC_CREATE_ERROR_MESSAGE)
    )
  }

  return (await response.json()) as Animal
}

export async function updateAnimal(
  id: string,
  payload: UpdateAnimalPayload,
  accessToken: string
): Promise<Animal> {
  const response = await authenticatedFetch(
    `${API_URL}/animals/${id}`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await extractErrorMessage(response, GENERIC_UPDATE_ERROR_MESSAGE)
    )
  }

  return (await response.json()) as Animal
}

export async function listAnimals(accessToken: string): Promise<Animal[]> {
  const response = await authenticatedFetch(`${API_URL}/animals`, accessToken)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await extractErrorMessage(response, GENERIC_LIST_ERROR_MESSAGE)
    )
  }

  return (await response.json()) as Animal[]
}
