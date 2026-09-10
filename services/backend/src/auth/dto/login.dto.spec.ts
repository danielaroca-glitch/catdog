import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  const validPayload = {
    email: 'daniela@example.com',
    senha: 'senhaForte123',
  };

  it('não deve ter erros quando todos os campos são válidos', async () => {
    const dto = plainToInstance(LoginDto, validPayload);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('deve rejeitar quando o e-mail está em formato inválido (LOGIN-05)', async () => {
    const dto = plainToInstance(LoginDto, {
      ...validPayload,
      email: 'email-invalido',
    });

    const errors = await validate(dto);

    const emailError = errors.find((error) => error.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('deve rejeitar quando o e-mail está ausente (LOGIN-05)', async () => {
    const dto = plainToInstance(LoginDto, {
      senha: validPayload.senha,
    });

    const errors = await validate(dto);

    const emailError = errors.find((error) => error.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('deve rejeitar quando a senha está vazia (LOGIN-05)', async () => {
    const dto = plainToInstance(LoginDto, {
      ...validPayload,
      senha: '',
    });

    const errors = await validate(dto);

    const senhaError = errors.find((error) => error.property === 'senha');
    expect(senhaError).toBeDefined();
  });

  it('deve rejeitar quando a senha está ausente (LOGIN-05)', async () => {
    const dto = plainToInstance(LoginDto, {
      email: validPayload.email,
    });

    const errors = await validate(dto);

    const senhaError = errors.find((error) => error.property === 'senha');
    expect(senhaError).toBeDefined();
  });

  it('deve rejeitar quando a senha não é uma string (achado #7)', async () => {
    const dto = plainToInstance(LoginDto, {
      ...validPayload,
      senha: 12345678,
    });

    const errors = await validate(dto);

    const senhaError = errors.find((error) => error.property === 'senha');
    expect(senhaError).toBeDefined();
  });

  it('deve rejeitar quando a senha excede 128 caracteres (achado #7)', async () => {
    const dto = plainToInstance(LoginDto, {
      ...validPayload,
      senha: 'a'.repeat(129),
    });

    const errors = await validate(dto);

    const senhaError = errors.find((error) => error.property === 'senha');
    expect(senhaError).toBeDefined();
  });

  it('deve aceitar senha com exatamente 128 caracteres (achado #7)', async () => {
    const dto = plainToInstance(LoginDto, {
      ...validPayload,
      senha: 'a'.repeat(128),
    });

    const errors = await validate(dto);

    const senhaError = errors.find((error) => error.property === 'senha');
    expect(senhaError).toBeUndefined();
  });

  it('deve rejeitar quando o e-mail excede 255 caracteres (achado #7)', async () => {
    const longLocalPart = 'a'.repeat(250);
    const dto = plainToInstance(LoginDto, {
      ...validPayload,
      email: `${longLocalPart}@example.com`,
    });

    const errors = await validate(dto);

    const emailError = errors.find((error) => error.property === 'email');
    expect(emailError).toBeDefined();
  });
});
