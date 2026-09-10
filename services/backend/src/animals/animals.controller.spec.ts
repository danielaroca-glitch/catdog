import { CreateAnimalUseCase } from './use-cases/create-animal.use-case';
import { AnimalsController } from './animals.controller';

/**
 * Unit test do handler puro de `POST /animals` (T4). A cobertura de
 * autorização (401/403/201 conforme token e papel — ALTA-04/05) é do
 * `animals-create.e2e-spec.ts`, que exercita `JwtAuthGuard`/`RolesGuard` de
 * verdade via HTTP; este teste só garante que o handler delega ao use case
 * corretamente, mesmo padrão de `admin.controller.spec.ts`.
 */
describe('AnimalsController', () => {
  it('delega ao CreateAnimalUseCase e retorna o animal criado', async () => {
    const createdAnimal = {
      id: 'animal-1',
      name: 'Rex',
      species_id: 'species-1',
      active: true,
      created_at: '2026-09-10T00:00:00.000Z',
    };
    const executeMock = jest.fn().mockResolvedValue(createdAnimal);
    const useCase = { execute: executeMock } as unknown as CreateAnimalUseCase;

    const controller = new AnimalsController(useCase);
    const dto = { name: 'Rex', species_id: 'species-1' };
    const result = await controller.create(dto);

    expect(executeMock).toHaveBeenCalledWith(dto);
    expect(result).toEqual(createdAnimal);
  });
});
