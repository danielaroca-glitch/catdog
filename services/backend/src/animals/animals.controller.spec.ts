import { CreateAnimalUseCase } from './use-cases/create-animal.use-case';
import { UpdateAnimalUseCase } from './use-cases/update-animal.use-case';
import { AnimalsController } from './animals.controller';

/**
 * Unit test dos handlers puros de `POST /animals` e `PATCH /animals/:id`.
 * A cobertura de autorização (401/403 conforme token e papel) é dos e2e
 * (`animals-create.e2e-spec.ts`, `animals-update.e2e-spec.ts`), que
 * exercitam `JwtAuthGuard`/`RolesGuard` de verdade via HTTP; este teste só
 * garante que cada handler delega ao use case correspondente, mesmo padrão
 * de `admin.controller.spec.ts`.
 */
describe('AnimalsController', () => {
  const animal = {
    id: 'animal-1',
    name: 'Rex',
    species_id: 'species-1',
    active: true,
    created_at: '2026-09-10T00:00:00.000Z',
  };

  it('create: delega ao CreateAnimalUseCase e retorna o animal criado', async () => {
    const createExecuteMock = jest.fn().mockResolvedValue(animal);
    const createUseCase = {
      execute: createExecuteMock,
    } as unknown as CreateAnimalUseCase;
    const updateUseCase = {} as UpdateAnimalUseCase;

    const controller = new AnimalsController(createUseCase, updateUseCase);
    const dto = { name: 'Rex', species_id: 'species-1' };
    const result = await controller.create(dto);

    expect(createExecuteMock).toHaveBeenCalledWith(dto);
    expect(result).toEqual(animal);
  });

  it('update: delega ao UpdateAnimalUseCase com o id da rota e retorna o animal atualizado', async () => {
    const updatedAnimal = { ...animal, name: 'Rex 2' };
    const updateExecuteMock = jest.fn().mockResolvedValue(updatedAnimal);
    const createUseCase = {} as CreateAnimalUseCase;
    const updateUseCase = {
      execute: updateExecuteMock,
    } as unknown as UpdateAnimalUseCase;

    const controller = new AnimalsController(createUseCase, updateUseCase);
    const dto = { name: 'Rex 2' };
    const result = await controller.update('animal-1', dto);

    expect(updateExecuteMock).toHaveBeenCalledWith('animal-1', dto);
    expect(result).toEqual(updatedAnimal);
  });
});
