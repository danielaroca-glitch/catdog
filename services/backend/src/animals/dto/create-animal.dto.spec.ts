import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAnimalDto } from './create-animal.dto';

describe('CreateAnimalDto', () => {
  const validPayload = {
    name: 'Rex',
    species_id: '11111111-1111-4111-8111-111111111111',
  };

  it('não deve ter erros quando todos os campos são válidos', async () => {
    const dto = plainToInstance(CreateAnimalDto, validPayload);

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('deve rejeitar quando name está ausente (ALTA-06)', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      species_id: validPayload.species_id,
    });

    const errors = await validate(dto);

    expect(errors.find((error) => error.property === 'name')).toBeDefined();
  });

  it('deve rejeitar quando name está vazio (ALTA-06)', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validPayload,
      name: '',
    });

    const errors = await validate(dto);

    expect(errors.find((error) => error.property === 'name')).toBeDefined();
  });

  it('deve rejeitar quando species_id está ausente (ALTA-02)', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      name: validPayload.name,
    });

    const errors = await validate(dto);

    expect(
      errors.find((error) => error.property === 'species_id'),
    ).toBeDefined();
  });

  it('deve rejeitar quando species_id não é um UUID válido (ALTA-07)', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validPayload,
      species_id: 'nao-e-um-uuid',
    });

    const errors = await validate(dto);

    expect(
      errors.find((error) => error.property === 'species_id'),
    ).toBeDefined();
  });
});
