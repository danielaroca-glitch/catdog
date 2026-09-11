import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateAnimalDto } from './update-animal.dto';

describe('UpdateAnimalDto', () => {
  const validSpeciesId = '11111111-1111-4111-8111-111111111111';

  it('não deve ter erros quando só name é informado', async () => {
    const dto = plainToInstance(UpdateAnimalDto, { name: 'Rex' });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('não deve ter erros quando só species_id é informado', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
      species_id: validSpeciesId,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('não deve ter erros quando nenhum campo é informado (a regra de "ao menos um" é do use case, não do DTO)', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {});

    expect(await validate(dto)).toHaveLength(0);
  });

  it('deve rejeitar quando name é uma string vazia (EDICAO-09)', async () => {
    const dto = plainToInstance(UpdateAnimalDto, { name: '' });

    const errors = await validate(dto);

    expect(errors.find((error) => error.property === 'name')).toBeDefined();
  });

  it('deve rejeitar quando species_id não é um UUID válido', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
      species_id: 'nao-e-um-uuid',
    });

    const errors = await validate(dto);

    expect(
      errors.find((error) => error.property === 'species_id'),
    ).toBeDefined();
  });

  it('não deve ter erros quando só active é informado (INATIVACAO-01/02)', async () => {
    const dto = plainToInstance(UpdateAnimalDto, { active: false });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('deve rejeitar quando active não é um booleano', async () => {
    const dto = plainToInstance(UpdateAnimalDto, { active: 'nao-e-booleano' });

    const errors = await validate(dto);

    expect(errors.find((error) => error.property === 'active')).toBeDefined();
  });
});
