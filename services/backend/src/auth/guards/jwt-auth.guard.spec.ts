import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { JwtAuthGuard } from './jwt-auth.guard';

interface FakeRequest {
  headers: Record<string, string>;
  user?: { sub: string };
}

function buildExecutionContext(headers: Record<string, string> = {}) {
  const request: FakeRequest = { headers };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
}

function buildDefaultGetClaims(): jest.Mock {
  return jest.fn().mockRejectedValue(new Error('getClaims not stubbed'));
}

async function buildGuard(getClaims: jest.Mock = buildDefaultGetClaims()) {
  const supabase = { auth: { getClaims } };
  const module = await Test.createTestingModule({
    providers: [JwtAuthGuard, { provide: SUPABASE_CLIENT, useValue: supabase }],
  }).compile();

  return module.get(JwtAuthGuard);
}

describe('JwtAuthGuard', () => {
  it('lança UnauthorizedException quando o header Authorization está ausente (AUTZ-04)', async () => {
    const guard = await buildGuard();
    const { context } = buildExecutionContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lança UnauthorizedException quando o header não segue o formato "Bearer <token>"', async () => {
    const guard = await buildGuard();
    const { context } = buildExecutionContext({
      authorization: 'Token abc123',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lança UnauthorizedException quando o token está malformado (getClaims retorna error)', async () => {
    const getClaims = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Invalid JWT structure' },
    });
    const guard = await buildGuard(getClaims);
    const { context } = buildExecutionContext({
      authorization: 'Bearer not-a-jwt',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lança UnauthorizedException, sem detalhe interno na mensagem, quando a assinatura do token é inválida', async () => {
    const getClaims = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Invalid JWT signature' },
    });
    const guard = await buildGuard(getClaims);
    const { context } = buildExecutionContext({
      authorization: 'Bearer token-com-assinatura-invalida',
    });

    let caughtError: unknown;
    try {
      await guard.canActivate(context);
    } catch (error_) {
      caughtError = error_;
    }

    expect(caughtError).toBeInstanceOf(UnauthorizedException);
    expect((caughtError as Error).message).not.toMatch(/signature/i);
  });

  it('lança UnauthorizedException quando o token está expirado (getClaims retorna error)', async () => {
    const getClaims = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'JWT expired' },
    });
    const guard = await buildGuard(getClaims);
    const { context } = buildExecutionContext({
      authorization: 'Bearer token-expirado',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lança UnauthorizedException quando getClaims rejeita a promise (ex.: JWT com estrutura inválida)', async () => {
    const getClaims = jest
      .fn()
      .mockRejectedValue(new Error('Invalid JWT structure'));
    const guard = await buildGuard(getClaims);
    const { context } = buildExecutionContext({
      authorization: 'Bearer token-quebrado',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('retorna true e anexa request.user.sub quando o token é válido (AUTZ-04)', async () => {
    const getClaims = jest.fn().mockResolvedValue({
      data: { claims: { sub: 'user-123' } },
      error: null,
    });
    const guard = await buildGuard(getClaims);
    const { context, request } = buildExecutionContext({
      authorization: 'Bearer token-valido',
    });

    const result = await guard.canActivate(context);

    expect(getClaims).toHaveBeenCalledWith('token-valido');
    expect(result).toBe(true);
    expect(request.user).toEqual({ sub: 'user-123' });
  });
});
