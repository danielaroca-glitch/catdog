import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ProfileRoleLookup, type UserRole } from '../profile-role.lookup';
import type { AuthenticatedRequest } from './jwt-auth.guard';

const FORBIDDEN_MESSAGE = 'Você não tem permissão para acessar este recurso.';

/**
 * Guard de autorização por papel (AUTZ-03, AUTZ-06). Lê os papéis exigidos
 * via decorator `@Roles(...)` (Reflector) e compara com o papel REAL do
 * usuário, consultado em `profiles` a cada requisição via
 * `ProfileRoleLookup` — nunca cacheado entre requisições (AUTZ-03).
 *
 * Endpoint sem `@Roles()` não é afetado por este guard: vira no-op e permite
 * qualquer usuário autenticado.
 *
 * Assume que `JwtAuthGuard` já rodou antes na cadeia de guards do endpoint,
 * populando `request.user.sub` — não reimplementa extração/verificação do
 * JWT aqui (ver `@UseGuards(JwtAuthGuard, RolesGuard)` nos endpoints que o
 * consomem).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly profileRoleLookup: ProfileRoleLookup,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userId = this.extractUserId(context);
    const userRole = await this.profileRoleLookup.execute(userId);

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }

    return true;
  }

  private extractUserId(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.sub;

    if (!userId) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }

    return userId;
  }
}
