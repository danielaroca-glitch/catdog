import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SignJWT, exportJWK, generateKeyPair, type JWK } from 'jose';
import { JwtAuthGuard } from './jwt-auth.guard';

const TEST_SUPABASE_URL = 'https://test-project.supabase.co';

// O guard busca a chave pública via `createRemoteJWKSet` (rede). Para o
// teste rodar sem rede e determinístico, mockamos só esse export do `jose`
// para devolver um JWKS LOCAL (`createLocalJWKSet`) montado com a chave
// pública de teste gerada abaixo — `jwtVerify` (a verificação de verdade)
// continua sendo a implementação real do `jose`, não mockada.
let testPublicJwk: JWK;

jest.mock('jose', () => {
  const actual = jest.requireActual<typeof import('jose')>('jose');
  return {
    ...actual,
    createRemoteJWKSet: () =>
      actual.createLocalJWKSet({ keys: [testPublicJwk] }),
  };
});

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

async function buildGuard(supabaseUrl: string = TEST_SUPABASE_URL) {
  const config = { get: jest.fn().mockReturnValue(supabaseUrl) };
  const module = await Test.createTestingModule({
    providers: [JwtAuthGuard, { provide: ConfigService, useValue: config }],
  }).compile();

  return module.get(JwtAuthGuard);
}

describe('JwtAuthGuard', () => {
  let privateKey: CryptoKey;
  let wrongPrivateKey: CryptoKey;

  beforeAll(async () => {
    const keyPair = await generateKeyPair('ES256', { extractable: true });
    privateKey = keyPair.privateKey;
    testPublicJwk = await exportJWK(keyPair.publicKey);
    testPublicJwk.alg = 'ES256';

    const wrongKeyPair = await generateKeyPair('ES256', {
      extractable: true,
    });
    wrongPrivateKey = wrongKeyPair.privateKey;
  });

  async function signToken(
    payload: Record<string, unknown>,
    key: CryptoKey = privateKey,
    expiresAt?: number,
  ) {
    const jwt = new SignJWT(payload).setProtectedHeader({ alg: 'ES256' });
    if (expiresAt !== undefined) {
      jwt.setExpirationTime(expiresAt);
    }
    return jwt.sign(key);
  }

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

  it('lança UnauthorizedException quando o token está malformado', async () => {
    const guard = await buildGuard();
    const { context } = buildExecutionContext({
      authorization: 'Bearer not-a-jwt',
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lança UnauthorizedException, sem detalhe interno na mensagem, quando a assinatura do token é inválida (assinado com outra chave)', async () => {
    const guard = await buildGuard();
    const tokenSignedWithWrongKey = await signToken(
      { sub: 'user-1' },
      wrongPrivateKey,
    );
    const { context } = buildExecutionContext({
      authorization: `Bearer ${tokenSignedWithWrongKey}`,
    });

    let caughtError: unknown;
    try {
      await guard.canActivate(context);
    } catch (error_) {
      caughtError = error_;
    }

    expect(caughtError).toBeInstanceOf(UnauthorizedException);
    expect((caughtError as Error).message).not.toMatch(/jwt|signature|jwk/i);
  });

  it('lança UnauthorizedException quando o token está expirado', async () => {
    const guard = await buildGuard();
    const expiredToken = await signToken(
      { sub: 'user-1' },
      privateKey,
      Math.floor(Date.now() / 1000) - 60,
    );
    const { context } = buildExecutionContext({
      authorization: `Bearer ${expiredToken}`,
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('retorna true e anexa request.user.sub quando o token é válido (AUTZ-04)', async () => {
    const guard = await buildGuard();
    const token = await signToken({ sub: 'user-123' });
    const { context, request } = buildExecutionContext({
      authorization: `Bearer ${token}`,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual({ sub: 'user-123' });
  });
});
