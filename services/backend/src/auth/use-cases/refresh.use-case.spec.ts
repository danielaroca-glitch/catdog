import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { SUPABASE_AUTH_CLIENT_FACTORY } from '../../supabase/supabase.provider';
import { RefreshDto } from '../dto/refresh.dto';
import { RefreshUseCase } from './refresh.use-case';

function buildSupabaseMock() {
  return {
    auth: {
      refreshSession: jest.fn(),
    },
  };
}

async function buildUseCase(supabase: unknown) {
  const createAuthClient = jest.fn().mockReturnValue(supabase);
  const module = await Test.createTestingModule({
    providers: [
      RefreshUseCase,
      { provide: SUPABASE_AUTH_CLIENT_FACTORY, useValue: createAuthClient },
    ],
  }).compile();

  return { useCase: module.get(RefreshUseCase), createAuthClient };
}

describe('RefreshUseCase', () => {
  const validDto: RefreshDto = Object.assign(new RefreshDto(), {
    refresh_token: 'valid-refresh-token',
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna o novo par de tokens quando o refresh é bem-sucedido (LOGIN-03)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        },
        user: { id: 'user-1' },
      },
      error: null,
    });

    const { useCase } = await buildUseCase(supabase);
    const result = await useCase.execute(validDto);

    expect(supabase.auth.refreshSession).toHaveBeenCalledWith({
      refresh_token: validDto.refresh_token,
    });
    expect(result).toEqual({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600,
    });
  });

  it('usa um cliente Supabase efêmero (fábrica), nunca um cliente compartilhado, por chamada (achado #1 crítico)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.refreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
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

  it('lança UnauthorizedException com mensagem genérica quando o refresh token já foi rotacionado (LOGIN-06/RN-03)', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.refreshSession.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: 'refresh_token_already_used',
        message: 'Invalid Refresh Token: Already Used',
      },
    });

    const { useCase } = await buildUseCase(supabase);

    await expect(useCase.execute(validDto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('não revela na mensagem da exceção o detalhe interno retornado pelo Supabase', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.refreshSession.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        code: 'refresh_token_not_found',
        message: 'Invalid Refresh Token: Refresh Token Not Found',
      },
    });

    const { useCase } = await buildUseCase(supabase);

    let caughtMessage = '';
    try {
      await useCase.execute(validDto);
    } catch (error_) {
      caughtMessage = (error_ as Error).message;
    }

    expect(caughtMessage).not.toMatch(/Refresh Token Not Found/i);
    expect(caughtMessage.length).toBeGreaterThan(0);
  });

  it('lança UnauthorizedException quando o Supabase não retorna erro nem sessão', async () => {
    const supabase = buildSupabaseMock();
    supabase.auth.refreshSession.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });

    const { useCase } = await buildUseCase(supabase);

    await expect(useCase.execute(validDto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
