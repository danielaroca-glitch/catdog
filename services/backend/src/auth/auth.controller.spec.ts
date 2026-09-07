import { Test } from '@nestjs/testing';
import { RegisterDto } from './dto/register.dto';
import { EmailAlreadyExistsException } from './exceptions/email-already-exists.exception';
import { RegisteredUser, RegisterUseCase } from './use-cases/register.use-case';
import { AuthController } from './auth.controller';

async function buildController(registerUseCase: Partial<RegisterUseCase>) {
  const module = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [{ provide: RegisterUseCase, useValue: registerUseCase }],
  }).compile();

  return module.get(AuthController);
}

describe('AuthController', () => {
  const validDto: RegisterDto = Object.assign(new RegisterDto(), {
    nome: 'Daniela Roca',
    email: 'daniela@example.com',
    senha: 'senhaForte123',
    confirmarSenha: 'senhaForte123',
  });

  it('retorna 201 (implícito) com o usuário registrado em sucesso', async () => {
    const registeredUser: RegisteredUser = {
      id: 'user-1',
      email: validDto.email,
      role: 'adotante',
    };
    const registerUseCase = {
      execute: jest.fn().mockResolvedValue(registeredUser),
    };

    const controller = await buildController(registerUseCase);
    const result = await controller.register(validDto);

    expect(registerUseCase.execute).toHaveBeenCalledWith(validDto);
    expect(result).toEqual(registeredUser);
  });

  it('propaga EmailAlreadyExistsException (409 via ConflictException do Nest)', async () => {
    const registerUseCase = {
      execute: jest.fn().mockRejectedValue(new EmailAlreadyExistsException()),
    };

    const controller = await buildController(registerUseCase);

    await expect(controller.register(validDto)).rejects.toBeInstanceOf(
      EmailAlreadyExistsException,
    );
  });

  /**
   * [NOTA] REG-09 (aviso de falha no envio do e-mail de confirmação):
   * `RegisterUseCase.execute` hoje não distingue "conta criada e e-mail
   * enviado" de "conta criada mas e-mail pode não ter chegado" — o envio é um
   * efeito colateral do Supabase Auth em `auth.admin.createUser`, que não
   * retorna esse sinal na resposta (ver `register.use-case.ts` e o comentário
   * em `auth.controller.ts`). Este teste documenta o comportamento atual —
   * sucesso simples do use case sempre vira 201 sem aviso — em vez de simular
   * um mecanismo de "e-mail não enviado" que não existe no contrato do use
   * case. Se esse sinal passar a existir (ex.: campo `emailSent: boolean` no
   * retorno de `execute`), este teste deve ser atualizado para cobrir o
   * mapeamento desse aviso no corpo da resposta 201.
   */
  it('[NOTA REG-09] sucesso do use case sempre retorna 201 simples, sem sinal de falha de e-mail (use case não expõe esse dado hoje)', async () => {
    const registeredUser: RegisteredUser = {
      id: 'user-2',
      email: validDto.email,
      role: 'adotante',
    };
    const registerUseCase = {
      execute: jest.fn().mockResolvedValue(registeredUser),
    };

    const controller = await buildController(registerUseCase);
    const result = await controller.register(validDto);

    expect(result).toEqual(registeredUser);
    expect(result).not.toHaveProperty('emailSent');
    expect(result).not.toHaveProperty('warning');
  });
});
