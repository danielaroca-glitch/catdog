import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { RegisterDto } from '../dto/register.dto';
import { EmailAlreadyExistsException } from '../exceptions/email-already-exists.exception';
import { ProfileRoleLookup, UserRole } from '../profile-role.lookup';

export interface RegisteredUser {
  id: string;
  email: string;
  role: UserRole;
}

const EMAIL_ALREADY_EXISTS_CODE = 'email_exists';
const EMAIL_ALREADY_EXISTS_MESSAGE_PATTERN = /already.*registered/i;
const GENERIC_SIGNUP_ERROR_MESSAGE =
  'Não foi possível concluir o cadastro. Tente novamente mais tarde.';

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

/**
 * Caso de uso de cadastro de conta (REG-02).
 *
 * Cria o usuário via Supabase Auth Admin API (`auth.admin.createUser`) com
 * `email_confirm: false`, para que o fluxo normal de confirmação por e-mail
 * seja disparado. A linha em `public.profiles` (papel `adotante`) é criada
 * automaticamente por um trigger de banco (`on_auth_user_created`, ver
 * migration da PBI) no mesmo INSERT em `auth.users` — este caso de uso não a
 * cria explicitamente, apenas confirma o papel consultando `profiles`.
 */
@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly profileRoleLookup: ProfileRoleLookup,
  ) {}

  async execute(dto: RegisterDto): Promise<RegisteredUser> {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: dto.senha,
      user_metadata: { nome: dto.nome },
      email_confirm: false,
    });

    if (error) {
      if (this.isEmailAlreadyExists(error)) {
        // REG-05: mensagem genérica — não indica se a conta existente já foi
        // confirmada, para não permitir enumeração de contas por esse estado.
        throw new EmailAlreadyExistsException();
      }

      // REG-08: a linha em `profiles` é populada por um TRIGGER de banco
      // (on_auth_user_created) disparado no MESMO insert que cria o usuário em
      // auth.users — é transacional a nível de Postgres. Se esse trigger
      // falhar, o insert inteiro sofre rollback e o próprio `createUser` acima
      // já retorna erro aqui; não existe, nesta camada, um estado
      // intermediário de "usuário criado sem profile" para reconciliar
      // manualmente. Apenas propagamos o erro como uma falha clara.
      throw new InternalServerErrorException(GENERIC_SIGNUP_ERROR_MESSAGE);
    }

    const user = data.user;
    if (!user) {
      throw new InternalServerErrorException(GENERIC_SIGNUP_ERROR_MESSAGE);
    }

    const role = await this.profileRoleLookup.execute(user.id);

    return {
      id: user.id,
      email: user.email ?? dto.email,
      role,
    };
  }

  private isEmailAlreadyExists(error: SupabaseErrorLike): boolean {
    return (
      error.code === EMAIL_ALREADY_EXISTS_CODE ||
      EMAIL_ALREADY_EXISTS_MESSAGE_PATTERN.test(error.message ?? '')
    );
  }
}
