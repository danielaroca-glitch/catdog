import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { RegisteredUser, RegisterUseCase } from './use-cases/register.use-case';

/**
 * POST /auth/register (REG-01 a REG-05).
 *
 * Validação de payload (400) é responsabilidade do `ValidationPipe` global
 * (ver `main.ts`) — não duplicada aqui. `EmailAlreadyExistsException` já é um
 * `ConflictException` do Nest (ver `exceptions/email-already-exists.exception.ts`),
 * então propagá-la sem tratamento resulta automaticamente em 409.
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
  constructor(private readonly registerUseCase: RegisterUseCase) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<RegisteredUser> {
    return this.registerUseCase.execute(dto);
  }
}
