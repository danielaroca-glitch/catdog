import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { SpeciesService } from '../../species/species.service';
import { UpdateAnimalDto } from '../dto/update-animal.dto';
import { Animal } from './create-animal.use-case';

interface AnimalUpdateResult {
  data: Animal | null;
  error: { message: string } | null;
}

const NO_FIELDS_MESSAGE =
  'Informe ao menos um campo para atualizar (name ou species_id).';
const SPECIES_NOT_FOUND_MESSAGE =
  'species_id não corresponde a uma espécie existente.';
const ANIMAL_NOT_FOUND_MESSAGE = 'Animal não encontrado.';
const UPDATE_ANIMAL_ERROR_MESSAGE =
  'Não foi possível atualizar o animal. Tente novamente mais tarde.';

/**
 * Caso de uso de edição de animal (EDICAO-01, EDICAO-02, EDICAO-03,
 * EDICAO-07, EDICAO-09).
 *
 * Atualização parcial: só os campos informados no DTO entram no `update`.
 * `species_id`, quando informado, passa pela mesma validação de existência
 * de `CreateAnimalUseCase` (`SpeciesService.exists`) ANTES do update —
 * mesmo racional de falhar cedo com mensagem clara, sem depender do erro de
 * FK do Postgres.
 *
 * "Animal não encontrado" (EDICAO-07) é distinguido de um erro genérico de
 * banco via `.maybeSingle()`: 0 linhas afetadas (id não existe) retorna
 * `data: null, error: null` — vira 404. Qualquer `error` real vira 500. Não
 * há checagem de `active`/soft-delete aqui (EDICAO-04): a edição funciona
 * igual para um animal ativo ou inativo, por design.
 *
 * `active` (INATIVACAO-01, INATIVACAO-02, pbi-003) reusa este mesmo update
 * genérico em vez de um endpoint dedicado — inativar/reativar é só mais um
 * campo (RN-02), sem validação extra além do booleano do DTO; idempotente
 * por natureza do próprio `UPDATE` SQL (INATIVACAO-03).
 */
@Injectable()
export class UpdateAnimalUseCase {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly speciesService: SpeciesService,
  ) {}

  async execute(animalId: string, dto: UpdateAnimalDto): Promise<Animal> {
    const updatePayload: Partial<
      Pick<Animal, 'name' | 'species_id' | 'active'>
    > = {};

    if (dto.name !== undefined) {
      updatePayload.name = dto.name;
    }

    if (dto.species_id !== undefined) {
      const speciesExists = await this.speciesService.exists(dto.species_id);

      if (!speciesExists) {
        throw new BadRequestException(SPECIES_NOT_FOUND_MESSAGE);
      }

      updatePayload.species_id = dto.species_id;
    }

    if (dto.active !== undefined) {
      updatePayload.active = dto.active;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException(NO_FIELDS_MESSAGE);
    }

    const result = (await this.supabase
      .from('animals')
      .update(updatePayload)
      .eq('id', animalId)
      .select()
      .maybeSingle()) as AnimalUpdateResult;

    if (result.error) {
      throw new InternalServerErrorException(UPDATE_ANIMAL_ERROR_MESSAGE);
    }

    if (!result.data) {
      throw new NotFoundException(ANIMAL_NOT_FOUND_MESSAGE);
    }

    return result.data;
  }
}
