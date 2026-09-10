import { SpeciesService } from './species.service';
import { SpeciesController } from './species.controller';

/**
 * Unit test do handler puro de `GET /species`. Autorização
 * (401/403/200) é do `species-list.e2e-spec.ts`, mesmo racional de
 * `animals.controller.spec.ts`.
 */
describe('SpeciesController', () => {
  it('delega ao SpeciesService e retorna a lista', async () => {
    const speciesList = [{ id: 'species-1', name: 'Cachorro' }];
    const listMock = jest.fn().mockResolvedValue(speciesList);
    const speciesService = { list: listMock } as unknown as SpeciesService;

    const controller = new SpeciesController(speciesService);
    const result = await controller.list();

    expect(listMock).toHaveBeenCalled();
    expect(result).toEqual(speciesList);
  });
});
