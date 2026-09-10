import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { ListAnimalsUseCase } from './list-animals.use-case';

function buildAnimalsQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(result),
  };
}

function buildSupabaseMock() {
  return {
    from: jest.fn(),
  };
}

async function buildUseCase(supabase: unknown) {
  const module = await Test.createTestingModule({
    providers: [
      ListAnimalsUseCase,
      { provide: SUPABASE_CLIENT, useValue: supabase },
    ],
  }).compile();

  return module.get(ListAnimalsUseCase);
}

describe('ListAnimalsUseCase', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna a lista de animais ordenada por nome', async () => {
    const animals = [
      {
        id: 'animal-1',
        name: 'Ana',
        species_id: 'species-1',
        active: true,
        created_at: '2026-09-10T00:00:00.000Z',
      },
      {
        id: 'animal-2',
        name: 'Rex',
        species_id: 'species-2',
        active: false,
        created_at: '2026-09-10T00:00:00.000Z',
      },
    ];
    const supabase = buildSupabaseMock();
    const query = buildAnimalsQuery({ data: animals, error: null });
    supabase.from.mockReturnValue(query);

    const useCase = await buildUseCase(supabase);
    const result = await useCase.execute();

    expect(supabase.from).toHaveBeenCalledWith('animals');
    expect(query.select).toHaveBeenCalledWith('*');
    expect(query.order).toHaveBeenCalledWith('name');
    expect(result).toEqual(animals);
  });

  it('lança InternalServerErrorException quando a listagem retorna erro', async () => {
    const supabase = buildSupabaseMock();
    supabase.from.mockReturnValue(
      buildAnimalsQuery({ data: null, error: { message: 'connection error' } }),
    );

    const useCase = await buildUseCase(supabase);

    await expect(useCase.execute()).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
