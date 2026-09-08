import { ForbiddenException } from '@nestjs/common';

export const EMAIL_NOT_CONFIRMED_CODE = 'email_not_confirmed';

/**
 * Erro de domínio lançado quando o login é tentado com uma conta cujo e-mail
 * ainda não foi confirmado (LOGIN-02).
 *
 * Mapeada para 403 (`ForbiddenException`). Diferente de
 * `EmailAlreadyExistsException`, este caso precisa ser distinguível
 * programaticamente pelo frontend — para acionar a UI de reenvio de
 * confirmação já existente (tela de confirmação pendente da pbi-001), em vez
 * de um erro genérico. Por isso expõe `code` tanto como propriedade da
 * instância (uso direto em código) quanto no corpo da resposta HTTP (via
 * `super()`), para o frontend checar `response.body.code` sem depender de
 * parsear a mensagem.
 */
export class EmailNotConfirmedException extends ForbiddenException {
  readonly code = EMAIL_NOT_CONFIRMED_CODE;

  constructor() {
    super({
      code: EMAIL_NOT_CONFIRMED_CODE,
      message:
        'E-mail ainda não confirmado. Reenvie o e-mail de confirmação para continuar.',
    });
  }
}
