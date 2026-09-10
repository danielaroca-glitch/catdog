import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Request } from 'express';

const BEARER_PREFIX = 'Bearer ';
const INVALID_TOKEN_MESSAGE = 'Token de acesso ausente ou inválido.';
const JWKS_PATH = '/auth/v1/.well-known/jwks.json';
const ALLOWED_ALGORITHMS = ['ES256'];

export interface AuthenticatedUser {
  sub: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function requireEnv(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Check your .env file (see .env.example).`,
    );
  }
  return value;
}

/**
 * Guard de autenticação (AUTZ-04/AUTZ-05). Extrai o JWT do header
 * `Authorization: Bearer <token>` e verifica a assinatura/expiração contra
 * a chave PÚBLICA do projeto Supabase, publicada em
 * `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
 *
 * [DECISÃO] A primeira versão deste guard verificava localmente via HS256
 * com um segredo compartilhado (`SUPABASE_JWT_SECRET`) — presumindo que o
 * projeto usava assinatura simétrica legada. Rodando e2e reais (T6, review
 * desta PBI), todo token de verdade era rejeitado: o JWKS do projeto só
 * publica uma chave ES256 (assimétrica) — `SUPABASE_JWT_SECRET` no `.env`
 * hoje contém o `kid` da chave, não um segredo HS256 utilizável. Corrigido
 * para verificação via JWKS (`jose.createRemoteJWKSet`, que busca e cacheia
 * a chave pública automaticamente, incluindo rotação) — sem round-trip ao
 * Supabase por requisição (a chave é cacheada em memória do processo, só
 * refeita a busca se o `kid` do token não bater com o cache), e sem exigir
 * nenhum segredo compartilhado.
 *
 * Header ausente, token malformado, assinatura inválida e token expirado
 * resultam todos na MESMA `UnauthorizedException` genérica — o motivo
 * específico da falha nunca vaza para a mensagem de resposta, para não dar
 * pistas a um atacante sobre o formato esperado do token.
 *
 * Em caso de sucesso, anexa `request.user = { sub }` para handlers e guards
 * downstream (ex.: guard de papel/role) consumirem o id do usuário
 * autenticado sem precisar re-decodificar o token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(config: ConfigService) {
    const supabaseUrl = requireEnv(config, 'SUPABASE_URL');
    this.jwks = createRemoteJWKSet(new URL(`${supabaseUrl}${JWKS_PATH}`));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    request.user = await this.verifyToken(token);
    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      return undefined;
    }

    return header.slice(BEARER_PREFIX.length).trim() || undefined;
  }

  private async verifyToken(token: string): Promise<AuthenticatedUser> {
    const payload = await this.decodeAndVerify(token);

    if (typeof payload.sub !== 'string') {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    return { sub: payload.sub };
  }

  private async decodeAndVerify(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        algorithms: ALLOWED_ALGORITHMS,
      });
      return payload;
    } catch {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }
  }
}
