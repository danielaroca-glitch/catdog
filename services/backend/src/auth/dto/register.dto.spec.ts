import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  const validPayload = {
    nome: 'Daniela Roca',
    email: 'daniela@example.com',
    senha: 'senhaForte123',
    confirmarSenha: 'senhaForte123',
  };

  it('não deve ter erros quando todos os campos são válidos', async () => {
    const dto = plainToInstance(RegisterDto, validPayload);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('deve rejeitar quando a confirmação de senha é diferente da senha (REG-01)', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...validPayload,
      confirmarSenha: 'outraSenha123',
    });

    const errors = await validate(dto);

    const confirmarSenhaError = errors.find(
      (error) => error.property === 'confirmarSenha',
    );
    expect(confirmarSenhaError).toBeDefined();
  });

  it('deve rejeitar senha com menos de 8 caracteres (REG-07)', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...validPayload,
      senha: '1234567',
      confirmarSenha: '1234567',
    });

    const errors = await validate(dto);

    const senhaError = errors.find((error) => error.property === 'senha');
    expect(senhaError).toBeDefined();
  });

  it('deve rejeitar e-mail em formato inválido', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...validPayload,
      email: 'email-invalido',
    });

    const errors = await validate(dto);

    const emailError = errors.find((error) => error.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('deve rejeitar quando o nome está vazio', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...validPayload,
      nome: '',
    });

    const errors = await validate(dto);

    const nomeError = errors.find((error) => error.property === 'nome');
    expect(nomeError).toBeDefined();
  });
});
