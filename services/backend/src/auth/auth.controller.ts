import {
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './guards/jwt-auth.guard';
import { ProfileRoleLookup, UserRole } from './profile-role.lookup';
import { AuthenticatedSession, LoginUseCase } from './use-cases/login.use-case';
import { RefreshedSession, RefreshUseCase } from './use-cases/refresh.use-case';
import { RegisteredUser, RegisterUseCase } from './use-cases/register.use-case';

export interface AuthenticatedUserProfile {
  id: string;
  email: string;
  role: UserRole;
}

const CURRENT_USER_LOOKUP_ERROR_MESSAGE =
  'Não foi possível concluir a operação. Tente novamente mais tarde.';
const MISSING_AUTHENTICATED_USER_MESSAGE =
  'Token de acesso ausente ou inválido.';

/**
 * POST /auth/register (REG-01 a REG-05), POST /auth/login (LOGIN-01, LOGIN-02,
 * LOGIN-04, LOGIN-08) e POST /auth/refresh (LOGIN-03, LOGIN-06).
 *
 * Validação de payload (400) é responsabilidade do `ValidationPipe` global
 * (ver `main.ts`) — não duplicada aqui. `EmailAlreadyExistsException` já é um
 * `ConflictException` do Nest (ver `exceptions/email-already-exists.exception.ts`),
 * então propagá-la sem tratamento resulta automaticamente em 409.
 * `EmailNotConfirmedException` já é um `ForbiddenException` (403). Erros de
 * credenciais/sessão inválida dos use cases de login/refresh já chegam como
 * `UnauthorizedException` (401) — este controller apenas delega, sem mapear
 * nada manualmente.
 *
 * [NOTA] REG-09 (aviso de falha no envio do e-mail de confirmação): o envio do
 * e-mail é feito pelo próprio Supabase Auth como efeito colateral assíncrono de
 * `auth.admin.createUser` (ver `register.use-case.ts`) — a API não retorna, na
 * resposta de `createUser`, se esse envio específico teve sucesso ou falhou.
 * `RegisterUseCase.execute` portanto não tem, hoje, como distinguir "conta
 * criada e e-mail enviado" de "conta criada mas e-mail pode não ter chegado";
 * não foi inventado aqui um mecanismo de detecção não especificado no
 * use case. Este endpoint sempre retorna sucesso simples (201) quando a conta
 * é criada. Se um sinal de falha de envio vier a existir na camada do use
 * case (ex.: um campo `emailSent` no retorno), este controller deve mapear
 * esse sinal para um aviso no corpo da resposta 201, sem transformá-lo em erro.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly profileRoleLookup: ProfileRoleLookup,
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Rate limit dedicado a este endpoint (achado #2, major, de review.md
   * rodada 1): 5 requisições/minuto por IP, para impedir criação em massa
   * de contas e sondagem de e-mails via respostas 409 repetidas. O guard
   * é aplicado apenas aqui — não globalmente via APP_GUARD — para não
   * impactar outros endpoints com necessidades de limite diferentes.
   */
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<RegisteredUser> {
    return this.registerUseCase.execute(dto);
  }

  /**
   * Rate limit dedicado a este endpoint (LOGIN-08): mesmo limite de
   * `/auth/register` (5/min por IP), para dificultar força bruta de senha.
   * `/auth/refresh` (abaixo) tem um limite bem mais generoso (30/min) — a
   * renovação automática de sessão é um fluxo legítimo de baixa frequência,
   * mas não deve ficar totalmente sem controle (achado #1, review rodada 2).
   */
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthenticatedSession> {
    return this.loginUseCase.execute(dto);
  }

  /**
   * Rate limit generoso (achado #1, major, review rodada 2 do pbi-002): a
   * decisão original era não limitar `/auth/refresh` para não esbarrar na
   * renovação automática legítima (~1 requisição a cada ~55min por sessão,
   * ver `REFRESH_MARGIN_MS`/`refresh-scheduler.ts` no frontend). Mas o fix
   * do achado #1 crítico (cliente Supabase efêmero por chamada, em vez do
   * singleton) tornou cada requisição não autenticada mais cara (aloca um
   * `SupabaseClient` inteiro antes de validar o `refresh_token`), e o
   * endpoint segue sem nenhum controle. 30/min por IP é ordens de magnitude
   * acima do uso legítimo, então não bloqueia renovação real, só limita
   * abuso.
   */
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<RefreshedSession> {
    return this.refreshUseCase.execute(dto);
  }

  /**
   * GET /auth/me (T5, AUTZ-04/AUTZ-05 via este endpoint — ver E2E-06).
   *
   * Endpoint autenticado (`JwtAuthGuard`, sem `@Roles()`) que devolve
   * `{ id, email, role }` do usuário do token atual — usado por qualquer
   * tela que precise reconfirmar o papel sem passar pelo login. `role` é
   * lido de `profiles` a cada chamada via `ProfileRoleLookup` (nunca
   * cacheado), mesma garantia de `RolesGuard` (AUTZ-03). `email` vem de
   * `auth.admin.getUserById` — leitura administrativa pelo `SUPABASE_CLIENT`
   * singleton, mesmo padrão já usado por `RegisterUseCase`/
   * `ProfileRoleLookup` (não é autenticação de usuário final, `DEC-02` não
   * se aplica).
   *
   * Sem token ou token inválido/malformado nunca chega aqui — `JwtAuthGuard`
   * lança 401 antes deste método rodar.
   *
   * [DECISÃO — achado #3 major, review rodada 1 do pbi-003] `@Throttle`
   * generoso: o fallback de `JwtAuthGuard`/`getClaims` para um token com
   * `kid` desconhecido dispara chamadas reais ao Supabase (JWKS + `getUser`)
   * mesmo sem autenticação válida — sem limite, isso é uma amplificação de
   * DoS não autenticada. Mesmo padrão já aplicado a `/auth/refresh`.
   */
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('me')
  async me(
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthenticatedUserProfile> {
    const userId = this.extractUserId(request);
    const [role, email] = await Promise.all([
      this.profileRoleLookup.execute(userId),
      this.fetchEmail(userId),
    ]);

    return { id: userId, email, role };
  }

  private extractUserId(request: AuthenticatedRequest): string {
    const userId = request.user?.sub;

    // Defensivo: `JwtAuthGuard` sempre popula `request.user.sub` antes deste
    // método rodar (lança 401 caso contrário) — mesmo racional de
    // `RolesGuard.extractUserId`, não reimplementa verificação de JWT aqui.
    if (!userId) {
      throw new UnauthorizedException(MISSING_AUTHENTICATED_USER_MESSAGE);
    }

    return userId;
  }

  private async fetchEmail(userId: string): Promise<string> {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);

    if (error || !data?.user?.email) {
      throw new InternalServerErrorException(CURRENT_USER_LOOKUP_ERROR_MESSAGE);
    }

    return data.user.email;
  }
}
