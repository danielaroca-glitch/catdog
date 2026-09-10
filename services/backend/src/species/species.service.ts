import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider';

const SPECIES_LOOKUP_ERROR_MESSAGE =
  'Não foi possível concluir a operação. Tente novamente mais tarde.';

/**
 * Verifica a existência de uma espécie em `public.species` (RN-04).
 *
 * Reusado por `pbi-001-alta-de-animal` e `pbi-002-edicao-de-animal` — ambos
 * exigem uma espécie válida antes de persistir/atualizar um animal.
 */
@Injectable()
export class SpeciesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async exists(speciesId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('species')
      .select('id')
      .eq('id', speciesId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(SPECIES_LOOKUP_ERROR_MESSAGE);
    }

    return data !== null;
  }
}
