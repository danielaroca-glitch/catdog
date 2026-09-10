import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { RegisterDto } from '../dto/register.dto';
import { EmailAlreadyExistsException } from '../exceptions/email-already-exists.exception';
import { ProfileRoleLookup } from '../profile-role.lookup';
import { RegisterUseCase } from './register.use-case';

function buildProfilesQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  };
}

function buildSupabaseMock() {
  return {
    auth: {
      admin: {
        createUser: jest.fn(),
      },
    },
    from: jest.fn(),
  };
}

async function buildUseCase(supabase: unknown) {
  const module = await Test.createTestingModule({
    providers: [
      RegisterUseCase,
      ProfileRoleLookup,
      { provide: SUPABASE_CLIENT, useValue: supabase },
    ],
  }).compile();

  return module.get(RegisterUseCase);
}

describe('RegisterUseCase', () => {
  const validDto: RegisterDto = Object.assign(new RegisterDto(), {
    nome: 'Daniela Roca',
    email: 'daniela@example.com',
    senha: 'senhaForte123',
    confirmarSenha: 'senhaForte123',
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna o usuário criado com o papel adotante confirmado via consulta a profiles', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.admin.createUser.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: validDto.email },
      },
      error: null,
    });
    supabase.from.mockReturnValue(
      buildProfilesQuery({ data: { role: 'adotante' }, error: null }),
    );

    const useCase = await buildUseCase(supabase);
    const result = await useCase.execute(validDto);

    expect(supabase.auth.admin.createUser).toHaveBeenCalledWith({
      email: validDto.email,
      password: validDto.senha,
      user_metadata: { nome: validDto.nome },
      email_confirm: false,
    });
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(result).toEqual({
      id: 'user-1',
      email: validDto.email,
      role: 'adotante',
    });
  });

  it('lança EmailAlreadyExistsException com mensagem genérica quando o e-mail já existe (REG-05)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: {
        code: 'email_exists',
        message: 'A user with this email address has already been registered',
      },
    });

    const useCase = await buildUseCase(supabase);

    await expect(useCase.execute(validDto)).rejects.toBeInstanceOf(
      EmailAlreadyExistsException,
    );
    // não deve consultar profiles quando o signup falhou
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('não revela, na mensagem do erro de e-mail duplicado, se a conta existente está confirmada (REG-05)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'email_exists', message: 'already been registered' },
    });

    const useCase = await buildUseCase(supabase);

    let caughtMessage = '';
    try {
      await useCase.execute(validDto);
    } catch (error_) {
      caughtMessage = (error_ as Error).message;
    }

    expect(caughtMessage).not.toMatch(/confirm/i);
    expect(caughtMessage.length).toBeGreaterThan(0);
  });

  it('propaga como erro claro uma falha genérica no createUser, sem sucesso silencioso (REG-08)', async () => {
    // REG-08: profiles é criado por um trigger de DB no MESMO insert que cria o
    // usuário em auth.users (transacional a nível Postgres). Se o trigger falhar,
    // o insert inteiro sofre rollback e createUser já retorna erro aqui — não há
    // usuário órfão para tratar manualmente nesta camada, apenas a obrigação de
    // não mascarar o erro como sucesso.
    const supabase = buildSupabaseMock();
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: {
        code: 'unexpected_failure',
        message: 'Database error saving new user',
      },
    });

    const useCase = await buildUseCase(supabase);

    await expect(useCase.execute(validDto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('lança erro claro quando a consulta a profiles falha após o signup', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: validDto.email } },
      error: null,
    });
    supabase.from.mockReturnValue(
      buildProfilesQuery({ data: null, error: { message: 'row not found' } }),
    );

    const useCase = await buildUseCase(supabase);

    await expect(useCase.execute(validDto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
