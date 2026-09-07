import { ConflictException } from '@nestjs/common';

/**
 * Erro de domínio lançado quando o cadastro é tentado com um e-mail que já
 * existe em auth.users.
 *
 * REG-05: a mensagem é deliberadamente genérica e não revela se a conta
 * existente já confirmou o e-mail ou não — evita que o endpoint de cadastro
 * seja usado para enumerar contas por estado de confirmação.
 */
export class EmailAlreadyExistsException extends ConflictException {
  constructor() {
    super('Não foi possível concluir o cadastro com os dados informados.');
  }
}
