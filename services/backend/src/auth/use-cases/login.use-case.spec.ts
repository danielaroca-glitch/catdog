import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { SUPABASE_AUTH_CLIENT_FACTORY } from '../../supabase/supabase.provider';
import { LoginDto } from '../dto/login.dto';
import { EmailNotConfirmedException } from '../exceptions/email-not-confirmed.exception';
import { ProfileRoleLookup, UserRole } from '../profile-role.lookup';
import { LoginUseCase } from './login.use-case';

function buildSupabaseMock() {
  return {
    auth: {
      signInWithPassword: jest.fn(),
    },
  };
}

function buildProfileRoleLookupMock(role: UserRole = 'adotante') {
  return { execute: jest.fn().mockResolvedValue(role) };
}

async function buildUseCase(
  supabase: unknown,
  profileRoleLookup: Partial<ProfileRoleLookup> = buildProfileRoleLookupMock(),
) {
  const createAuthClient = jest.fn().mockReturnValue(supabase);
  const module = await Test.createTestingModule({
    providers: [
      LoginUseCase,
      { provide: SUPABASE_AUTH_CLIENT_FACTORY, useValue: createAuthClient },
      { provide: ProfileRoleLookup, useValue: profileRoleLookup },
    ],
  }).compile();

  return {
    useCase: module.get(LoginUseCase),
    createAuthClient,
    profileRoleLookup,
  };
}

describe('LoginUseCase', () => {
  const validDto: LoginDto = Object.assign(new LoginDto(), {
    email: 'daniela@example.com',
    senha: 'senhaForte123',
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna access_token, refresh_token, expires_in e role quando as credenciais estão corretas e a conta está confirmada (LOGIN-01, AUTZ-01)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
        },
        user: { id: 'user-1' },
      },
      error: null,
    });
    const profileRoleLookup = buildProfileRoleLookupMock('admin');

    const { useCase } = await buildUseCase(supabase, profileRoleLookup);
    const result = await useCase.execute(validDto);

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: validDto.email,
      password: validDto.senha,
    });
    expect(profileRoleLookup.execute).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      role: 'admin',
    });
  });

  it('consulta o papel via ProfileRoleLookup usando o id do usuário autenticado, a cada login, sem cache entre chamadas (AUTZ-01, AUTZ-03)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
        },
        user: { id: 'user-42' },
      },
      error: null,
    });
    const profileRoleLookup = buildProfileRoleLookupMock('adotante');

    const { useCase } = await buildUseCase(supabase, profileRoleLookup);
    await useCase.execute(validDto);
    await useCase.execute(validDto);

    expect(profileRoleLookup.execute).toHaveBeenCalledTimes(2);
    expect(profileRoleLookup.execute).toHaveBeenNthCalledWith(1, 'user-42');
    expect(profileRoleLookup.execute).toHaveBeenNthCalledWith(2, 'user-42');
  });

  it('lança UnauthorizedException quando a sessão existe mas o Supabase não retorna o usuário autenticado', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
        },
        user: null,
      },
      error: null,
    });
    const profileRoleLookup = buildProfileRoleLookupMock();

    const { useCase } = await buildUseCase(supabase, profileRoleLookup);

    await expect(useCase.execute(validDto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(profileRoleLookup.execute).not.toHaveBeenCalled();
  });

  it('usa um cliente Supabase efêmero (fábrica), nunca um cliente compartilhado, por chamada (achado #1 crítico)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
        },
        user: { id: 'user-1' },
      },
      error: null,
    });

    const { useCase, createAuthClient } = await buildUseCase(supabase);
    await useCase.execute(validDto);
    await useCase.execute(validDto);

    expect(createAuthClient).toHaveBeenCalledTimes(2);
  });

  it('lança EmailNotConfirmedException com código machine-readable quando o e-mail não está confirmado (LOGIN-02)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: 'email_not_confirmed',
        message: 'Email not confirmed',
      },
    });

    const { useCase } = await buildUseCase(supabase);

    await expect(useCase.execute(validDto)).rejects.toBeInstanceOf(
      EmailNotConfirmedException,
    );

    try {
      await useCase.execute(validDto);
      fail('deveria ter lançado EmailNotConfirmedException');
    } catch (error_) {
      const exception = error_ as EmailNotConfirmedException;
      expect(exception.code).toBe('email_not_confirmed');
      expect(exception.getStatus()).toBe(403);
    }
  });

  it('lança UnauthorizedException com mensagem genérica idêntica quando o e-mail informado não existe (LOGIN-04)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
      },
    });

    const { useCase } = await buildUseCase(supabase);

    let caughtError: unknown;
    try {
      await useCase.execute(validDto);
    } catch (error_) {
      caughtError = error_;
    }

    expect(caughtError).toBeInstanceOf(UnauthorizedException);
    expect((caughtError as Error).message).toBe('E-mail ou senha incorretos.');
  });

  it('lança UnauthorizedException com a MESMA mensagem genérica quando a senha informada está incorreta (LOGIN-04)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
      },
    });

    const { useCase } = await buildUseCase(supabase);

    let caughtError: unknown;
    try {
      await useCase.execute(validDto);
    } catch (error_) {
      caughtError = error_;
    }

    expect(caughtError).toBeInstanceOf(UnauthorizedException);
    expect((caughtError as Error).message).toBe('E-mail ou senha incorretos.');
  });

  it('lança UnauthorizedException quando o Supabase não retorna erro nem sessão', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });

    const { useCase } = await buildUseCase(supabase);

    await expect(useCase.execute(validDto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
