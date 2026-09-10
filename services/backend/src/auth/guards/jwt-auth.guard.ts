import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';

const BEARER_PREFIX = 'Bearer ';
const INVALID_TOKEN_MESSAGE = 'Token de acesso ausente ou inválido.';

export interface AuthenticatedUser {
  sub: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Guard de autenticação (AUTZ-04/AUTZ-05). Extrai o JWT do header
 * `Authorization: Bearer <token>` e verifica assinatura/expiração LOCALMENTE
 * via `supabase.auth.getClaims(token)` — o método oficial do SDK, que valida
 * contra o JSON Web Key Set do projeto (cacheado após a primeira busca) via
 * WebCrypto, sem round-trip ao Supabase a cada requisição.
 *
 * [NOTA T5] A implementação original desta guard (T2, commit `45b73d3`)
 * verificava localmente com `jsonwebtoken` + `SUPABASE_JWT_SECRET` (HS256).
 * Esse caminho nunca havia sido exercitado contra um token real emitido pelo
 * projeto Supabase — só contra tokens fabricados no próprio teste unitário
 * com um segredo fake. Ao escrever o e2e de T5 (que faz login de verdade
 * para obter um `access_token` real), ficou provado que este projeto assina
 * tokens com uma chave ASSIMÉTRICA (`alg: ES256`, JWT Signing Keys — o
 * padrão atual do Supabase, substituindo o segredo simétrico legado). Um
 * `jsonwebtoken.verify(token, SUPABASE_JWT_SECRET, { algorithms: ['HS256'] })`
 * rejeita QUALQUER token real deste projeto antes mesmo de checar a
 * assinatura — bug latente que bloqueava não só T5 como qualquer consumidor
 * futuro desta guard (ex. T6/admin.controller). `getClaims` cobre os dois
 * mundos: verificação local via WebCrypto quando a chave é assimétrica (este
 * projeto), e fallback automático a uma validação equivalente a `getUser()`
 * apenas se o projeto ainda usar segredo simétrico — sem exigir nenhuma
 * configuração adicional aqui. `SUPABASE_JWT_SECRET`/`ConfigService`/
 * `jsonwebtoken` deixam de ser necessários nesta guard.
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
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

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
    const claims = await this.decodeAndVerify(token);

    if (!claims?.sub) {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }

    return { sub: claims.sub };
  }

  private async decodeAndVerify(
    token: string,
  ): Promise<{ sub?: string } | undefined> {
    try {
      const { data, error } = await this.supabase.auth.getClaims(token);
      if (error) {
        throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
      }

      return data?.claims;
    } catch {
      throw new UnauthorizedException(INVALID_TOKEN_MESSAGE);
    }
  }
}
