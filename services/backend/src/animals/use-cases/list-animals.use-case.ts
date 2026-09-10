import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { Animal } from './create-animal.use-case';

interface AnimalsListResult {
  data: Animal[] | null;
  error: { message: string } | null;
}

const LIST_ANIMALS_ERROR_MESSAGE =
  'Não foi possível carregar a lista de animais. Tente novamente mais tarde.';

/**
 * Lista todos os animais (EDICAO-10, gap confirmado com o usuário) — não
 * previsto nas 4 features literais do roadmap, adicionado porque nenhuma
 * delas prevê como o admin descobre qual animal editar/inativar.
 */
@Injectable()
export class ListAnimalsUseCase {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async execute(): Promise<Animal[]> {
    const result = (await this.supabase
      .from('animals')
      .select('*')
      .order('name')) as AnimalsListResult;

    if (result.error || !result.data) {
      throw new InternalServerErrorException(LIST_ANIMALS_ERROR_MESSAGE);
    }

    return result.data;
  }
}
