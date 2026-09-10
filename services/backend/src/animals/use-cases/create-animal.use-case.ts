import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { SpeciesService } from '../../species/species.service';
import { CreateAnimalDto } from '../dto/create-animal.dto';

export interface Animal {
  id: string;
  name: string;
  species_id: string;
  active: boolean;
  created_at: string;
}

interface AnimalInsertResult {
  data: Animal | null;
  error: { message: string } | null;
}

const SPECIES_NOT_FOUND_MESSAGE =
  'species_id não corresponde a uma espécie existente.';
const CREATE_ANIMAL_ERROR_MESSAGE =
  'Não foi possível cadastrar o animal. Tente novamente mais tarde.';

/**
 * Caso de uso de alta de animal (ALTA-01, ALTA-02, ALTA-03).
 *
 * Valida a espécie via `SpeciesService` ANTES de tentar o insert — falha
 * cedo, sem depender da constraint de FK do banco para rejeitar uma espécie
 * inexistente (o erro de FK do Postgres não distingue "espécie inexistente"
 * de qualquer outra falha de integridade, então validar na aplicação dá uma
 * mensagem clara para ALTA-03 sem parsear o erro do driver).
 */
@Injectable()
export class CreateAnimalUseCase {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly speciesService: SpeciesService,
  ) {}

  async execute(dto: CreateAnimalDto): Promise<Animal> {
    const speciesExists = await this.speciesService.exists(dto.species_id);

    if (!speciesExists) {
      throw new BadRequestException(SPECIES_NOT_FOUND_MESSAGE);
    }

    const result = (await this.supabase
      .from('animals')
      .insert({ name: dto.name, species_id: dto.species_id })
      .select()
      .single()) as AnimalInsertResult;

    if (result.error || !result.data) {
      throw new InternalServerErrorException(CREATE_ANIMAL_ERROR_MESSAGE);
    }

    return result.data;
  }
}
