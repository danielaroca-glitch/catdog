import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { LoginDto } from '../dto/login.dto';
import { EmailNotConfirmedException } from '../exceptions/email-not-confirmed.exception';
import { LoginUseCase } from './login.use-case';

function buildSupabaseMock() {
  return {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  };
}

async function buildUseCase(supabase: unknown) {
  const module = await Test.createTestingModule({
    providers: [LoginUseCase, { provide: SUPABASE_CLIENT, useValue: supabase }],
  }).compile();

  return module.get(LoginUseCase);
}

describe('LoginUseCase', () => {
  const validDto: LoginDto = Object.assign(new LoginDto(), {
    email: 'daniela@example.com',
    senha: 'senhaForte123',
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna access_token, refresh_token e expires_in quando as credenciais estão corretas e a conta está confirmada (LOGIN-01)', async () => {
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

    const useCase = await buildUseCase(supabase);
    const result = await useCase.execute(validDto);

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: validDto.email,
      password: validDto.senha,
    });
    expect(result).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
    });
  });

  it('limpa o cache local de sessão do cliente Supabase compartilhado após login bem-sucedido, sem revogar a sessão no servidor (achado #1)', async () => {
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

    const useCase = await buildUseCase(supabase);
    await useCase.execute(validDto);

    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
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

    const useCase = await buildUseCase(supabase);

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

    const useCase = await buildUseCase(supabase);

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

    const useCase = await buildUseCase(supabase);

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

    const useCase = await buildUseCase(supabase);

    await expect(useCase.execute(validDto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
