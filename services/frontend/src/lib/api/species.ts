/**
 * Cliente da API de espécies. Fala com `GET /species` do backend NestJS
 * (`services/backend/src/species/species.controller.ts`) — usado para
 * popular o seletor de espécie do formulário de cadastro de animal (T6).
 */

import { ApiError, authenticatedFetch } from "./auth"

const DEFAULT_API_URL = "http://localhost:3001"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL

const GENERIC_ERROR_MESSAGE =
  "Não foi possível carregar a lista de espécies. Tente novamente mais tarde."

export interface SpeciesOption {
  id: string
  name: string
}

export async function listSpecies(accessToken: string): Promise<SpeciesOption[]> {
  const response = await authenticatedFetch(`${API_URL}/species`, accessToken)

  if (!response.ok) {
    throw new ApiError(response.status, GENERIC_ERROR_MESSAGE)
  }

  return (await response.json()) as SpeciesOption[]
}
