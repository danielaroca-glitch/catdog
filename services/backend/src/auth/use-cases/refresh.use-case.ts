import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { RefreshDto } from '../dto/refresh.dto';

export interface RefreshedSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const GENERIC_INVALID_SESSION_MESSAGE = 'Sessão inválida ou expirada.';

/**
 * Caso de uso de refresh de sessão (LOGIN-03, LOGIN-06).
 *
 * Chama diretamente `supabase.auth.refreshSession({ refresh_token })` e
 * propaga o resultado nativo do Supabase Auth: em sucesso, o novo par de
 * tokens; em falha (token já rotacionado, inválido, expirado ou
 * inexistente), uma `UnauthorizedException` genérica.
 *
 * RN-03 (reuso de refresh token invalida a sessão inteira) é uma garantia do
 * próprio Supabase Auth — quando um `refresh_token` já usado é apresentado
 * novamente, o Supabase retorna erro (ex.: `refresh_token_already_used`) e já
 * invalida a família de tokens do lado dele. Esta camada não reimplementa
 * detecção de reuso nem lógica própria de rotação: qualquer erro retornado
 * por `refreshSession` — seja qual for o código — vira 401 genérico, sem
 * expor o detalhe interno do Supabase no corpo da exceção.
 */
@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async execute(dto: RefreshDto): Promise<RefreshedSession> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: dto.refresh_token,
    });

    if (error || !data.session) {
      throw new UnauthorizedException(GENERIC_INVALID_SESSION_MESSAGE);
    }

    const session = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    };

    // Ver comentário equivalente em LoginUseCase.execute: limpa o cache local
    // de sessão do cliente Supabase singleton para não vazar o JWT deste
    // usuário para chamadas REST subsequentes do mesmo cliente, sem revogar
    // a sessão de verdade no servidor.
    await this.supabase.auth.signOut({ scope: 'local' });

    return session;
  }
}
