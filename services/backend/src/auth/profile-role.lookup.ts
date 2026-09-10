import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider';

export type UserRole = 'admin' | 'adotante';

const PROFILE_ROLE_LOOKUP_ERROR_MESSAGE =
  'Não foi possível concluir a operação. Tente novamente mais tarde.';

/**
 * Consulta o papel (`role`) de um usuário em `public.profiles`.
 *
 * Usa o `SUPABASE_CLIENT` singleton (service role) — operação administrativa,
 * não autentica o usuário final, portanto `DEC-02` (feature
 * autenticacao-e-autorizacao) não se aplica aqui.
 *
 * Reusado por `RegisterUseCase` (confirmação do papel pós-cadastro), pelo
 * guard de autorização por papel e pelo login estendido.
 */
@Injectable()
export class ProfileRoleLookup {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async execute(userId: string): Promise<UserRole> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      throw new InternalServerErrorException(PROFILE_ROLE_LOOKUP_ERROR_MESSAGE);
    }

    return profile.role as UserRole;
  }
}
