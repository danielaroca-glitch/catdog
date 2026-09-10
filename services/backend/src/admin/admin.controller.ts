import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
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
 *
 * [DECISÃO — achado #2 major, review rodada 1] `@Roles('admin')` fica na
 * CLASSE, não no método: `RolesGuard` é no-op (permite qualquer usuário
 * autenticado) quando não encontra a metadata em nenhum dos dois níveis
 * (`reflector.getAllAndOverride([handler, class])`). Como este controller é
 * scaffolding explicitamente pensado para reuso por módulos futuros, deixar
 * o decorator só no método faria qualquer handler novo, adicionado sem
 * repeti-lo, ficar acessível a qualquer usuário autenticado — inclusive
 * `adotante` — num controller cujo propósito inteiro é ser admin-only. Com o
 * decorator na classe, o default do módulo passa a ser *deny*; um método
 * futuro só relaxaria a exigência se isso for uma decisão explícita nova.
 *
 * [DECISÃO — achado #3 major, review rodada 1] `@Throttle` genérico (mesmo
 * padrão de `/auth/refresh`, achado #1 major da review rodada 2 do
 * pbi-002): o fallback de `JwtAuthGuard`/`getClaims` para um `kid`
 * desconhecido dispara chamadas reais ao Supabase (busca de JWKS +
 * `getUser`) mesmo para um token forjado — sem limite, isso é uma
 * amplificação de DoS não autenticada contra a infraestrutura do Supabase.
 */
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Roles('admin')
@Controller('admin')
export class AdminController {
  @Get('ping')
  ping(): AdminPingResponse {
    return { ok: true };
  }
}
