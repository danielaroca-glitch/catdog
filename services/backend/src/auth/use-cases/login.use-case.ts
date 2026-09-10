import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_AUTH_CLIENT_FACTORY } from '../../supabase/supabase.provider';
import { LoginDto } from '../dto/login.dto';
import {
  EMAIL_NOT_CONFIRMED_CODE,
  EmailNotConfirmedException,
} from '../exceptions/email-not-confirmed.exception';

export interface AuthenticatedSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const EMAIL_NOT_CONFIRMED_MESSAGE_PATTERN = /email.*not.*confirmed/i;
const GENERIC_INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha incorretos.';

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

/**
 * Caso de uso de login (LOGIN-01, LOGIN-02, LOGIN-04).
 *
 * Chama diretamente `supabase.auth.signInWithPassword()` e distingue dois
 * desfechos de erro:
 *
 * - E-mail não confirmado: o GoTrue retorna um erro específico
 *   (`code: 'email_not_confirmed'`, com fallback de regex na mensagem para
 *   versões do GoTrue que não populam `code`) — vira `EmailNotConfirmedException`
 *   (403), que o frontend usa para acionar a UI de reenvio de confirmação.
 * - Qualquer outro erro (credenciais inválidas, usuário inexistente, senha
 *   errada) — o GoTrue já retorna um erro genérico o bastante
 *   (`invalid_credentials`/"Invalid login credentials") para satisfazer
 *   LOGIN-04 sem trabalho extra de ofuscação. Propagamos sempre a MESMA
 *   mensagem fixa em PT-BR, sem revelar qual campo está errado.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(SUPABASE_AUTH_CLIENT_FACTORY)
    private readonly createAuthClient: () => SupabaseClient,
  ) {}

  async execute(dto: LoginDto): Promise<AuthenticatedSession> {
    // Cliente efêmero, um por chamada — nunca o singleton SUPABASE_CLIENT.
    // Ver `supabaseAuthClientFactoryProvider` para o porquê (achado #1
    // crítico, review rodada 1 do pbi-002: reusar o singleton vaza a
    // identidade deste usuário para chamadas REST subsequentes do mesmo
    // cliente).
    const supabase = this.createAuthClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.senha,
    });

    if (error) {
      if (this.isEmailNotConfirmed(error)) {
        throw new EmailNotConfirmedException();
      }

      throw new UnauthorizedException(GENERIC_INVALID_CREDENTIALS_MESSAGE);
    }

    if (!data.session) {
      throw new UnauthorizedException(GENERIC_INVALID_CREDENTIALS_MESSAGE);
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    };
  }

  private isEmailNotConfirmed(error: SupabaseErrorLike): boolean {
    return (
      error.code === EMAIL_NOT_CONFIRMED_CODE ||
      EMAIL_NOT_CONFIRMED_MESSAGE_PATTERN.test(error.message ?? '')
    );
  }
}
