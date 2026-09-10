import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify, type JwtPayload } from 'jsonwebtoken';
import type { Request } from 'express';

const BEARER_PREFIX = 'Bearer ';
const INVALID_TOKEN_MESSAGE = 'Token de acesso ausente ou inválido.';

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
 * `Authorization: Bearer <token>` e verifica assinatura/expiração
 * LOCALMENTE — via `jsonwebtoken.verify` com `SUPABASE_JWT_SECRET` (HS256) —
 * sem round-trip ao Supabase (sem chamar `auth.getUser()`), para não pagar
 * uma chamada de rede a cada requisição autenticada.
 *
 * `SUPABASE_JWT_SECRET` é lido uma única vez no construtor (fail-fast no
 * bootstrap da aplicação, mesmo padrão de `requireEnv` usado em
 * `supabase.provider.ts`), não a cada requisição.
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
  private readonly jwtSecret: string;

  constructor(config: ConfigService) {
    this.jwtSecret = requireEnv(config, 'SUPABASE_JWT_SECRET');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    request.user = this.verifyToken(token);
    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      return undefined;
    }

    return header.slice(BEARER_PREFIX.length).trim() || undefined;
  }

  private verifyToken(token: string): AuthenticatedUser {
    const decoded = this.decodeAndVerify(token);

    if (typeof decoded === 'string' || !decoded.sub) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    return { sub: decoded.sub };
  }

  private decodeAndVerify(token: string): string | JwtPayload {
    try {
      return verify(token, this.jwtSecret, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }
  }
}
