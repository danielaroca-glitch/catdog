import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedSession, LoginUseCase } from './use-cases/login.use-case';
import { RefreshedSession, RefreshUseCase } from './use-cases/refresh.use-case';
import { RegisteredUser, RegisterUseCase } from './use-cases/register.use-case';

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
   * `/auth/refresh` NÃO recebe o mesmo tratamento (ver abaixo) — renovação
   * automática de sessão é um fluxo legítimo e não deve esbarrar em limite
   * pensado para tentativas de login.
   */
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthenticatedSession> {
    return this.loginUseCase.execute(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<RefreshedSession> {
    return this.refreshUseCase.execute(dto);
  }
}
