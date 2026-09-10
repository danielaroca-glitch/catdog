import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

export interface AdminPingResponse {
  ok: true;
}

/**
 * GET /admin/ping (AUTZ-02, AUTZ-03, AUTZ-06) — endpoint mínimo, admin-only,
 * que só prova o mecanismo de autorização por papel: scaffolding reusável por
 * módulos futuros que precisarem de um endpoint admin-only real (ex.:
 * cadastro de animais, gestão de solicitações). Sem conteúdo de negócio.
 *
 * `JwtAuthGuard` roda primeiro na cadeia de `@UseGuards` (popula
 * `request.user.sub`; 401 se o token faltar, for malformado, tiver
 * assinatura inválida ou estiver expirado — AUTZ-04/AUTZ-05). `RolesGuard`
 * roda em seguida (403 se o papel lido de `profiles` não bater com
 * `@Roles('admin')` — AUTZ-06). Ver `jwt-auth.guard.ts`/`roles.guard.ts`
 * para o contrato completo de cada guard.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  @Roles('admin')
  @Get('ping')
  ping(): AdminPingResponse {
    return { ok: true };
  }
}
