import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import { JwtAuthGuard } from './jwt-auth.guard';

const TEST_JWT_SECRET = 'test-secret-not-a-real-credential';

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

async function buildGuard(secret: string = TEST_JWT_SECRET) {
  const config = { get: jest.fn().mockReturnValue(secret) };
  const module = await Test.createTestingModule({
    providers: [JwtAuthGuard, { provide: ConfigService, useValue: config }],
  }).compile();

  return module.get(JwtAuthGuard);
}

function signToken(
  payload: Record<string, unknown>,
  secret: string = TEST_JWT_SECRET,
) {
  return sign(payload, secret, { algorithm: 'HS256' });
}

describe('JwtAuthGuard', () => {
  it('lança UnauthorizedException quando o header Authorization está ausente (AUTZ-04)', async () => {
    const guard = await buildGuard();
    const { context } = buildExecutionContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o header não segue o formato "Bearer <token>"', async () => {
    const guard = await buildGuard();
    const { context } = buildExecutionContext({
      authorization: 'Token abc123',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o token está malformado', async () => {
    const guard = await buildGuard();
    const { context } = buildExecutionContext({
      authorization: 'Bearer not-a-jwt',
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException, sem detalhe interno na mensagem, quando a assinatura do token é inválida', async () => {
    const guard = await buildGuard();
    const tokenSignedWithWrongSecret = signToken(
      { sub: 'user-1' },
      'wrong-secret',
    );
    const { context } = buildExecutionContext({
      authorization: `Bearer ${tokenSignedWithWrongSecret}`,
    });

    let caughtError: unknown;
    try {
      guard.canActivate(context);
    } catch (error_) {
      caughtError = error_;
    }

    expect(caughtError).toBeInstanceOf(UnauthorizedException);
    expect((caughtError as Error).message).not.toMatch(/jwt|signature/i);
  });

  it('lança UnauthorizedException quando o token está expirado', async () => {
    const guard = await buildGuard();
    const expiredToken = signToken({
      sub: 'user-1',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const { context } = buildExecutionContext({
      authorization: `Bearer ${expiredToken}`,
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('retorna true e anexa request.user.sub quando o token é válido (AUTZ-04)', async () => {
    const guard = await buildGuard();
    const token = signToken({ sub: 'user-123' });
    const { context, request } = buildExecutionContext({
      authorization: `Bearer ${token}`,
    });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ sub: 'user-123' });
  });
});
