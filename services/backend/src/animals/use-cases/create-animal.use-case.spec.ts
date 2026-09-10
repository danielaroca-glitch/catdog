import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { SpeciesService } from '../../species/species.service';
import { CreateAnimalDto } from '../dto/create-animal.dto';
import { CreateAnimalUseCase } from './create-animal.use-case';

const VALID_DTO: CreateAnimalDto = {
  name: 'Rex',
  species_id: 'species-1',
};

function buildAnimalsInsert(result: { data: unknown; error: unknown }) {
  return {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  };
}

function buildSupabaseMock() {
  return {
    from: jest.fn(),
  };
}

async function buildUseCase(supabase: unknown, speciesExists: boolean) {
  const speciesService = { exists: jest.fn().mockResolvedValue(speciesExists) };

  const module = await Test.createTestingModule({
    providers: [
      CreateAnimalUseCase,
      { provide: SUPABASE_CLIENT, useValue: supabase },
      { provide: SpeciesService, useValue: speciesService },
    ],
  }).compile();

  return { useCase: module.get(CreateAnimalUseCase), speciesService };
}

describe('CreateAnimalUseCase', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('cria o animal com active true quando a espécie existe', async () => {
    const supabase = buildSupabaseMock();
    const query = buildAnimalsInsert({
      data: {
        id: 'animal-1',
        name: 'Rex',
        species_id: 'species-1',
        active: true,
        created_at: '2026-09-10T00:00:00.000Z',
      },
      error: null,
    });
    supabase.from.mockReturnValue(query);

    const { useCase, speciesService } = await buildUseCase(supabase, true);
    const result = await useCase.execute(VALID_DTO);

    expect(speciesService.exists).toHaveBeenCalledWith('species-1');
    expect(supabase.from).toHaveBeenCalledWith('animals');
    expect(query.insert).toHaveBeenCalledWith({
      name: 'Rex',
      species_id: 'species-1',
    });
    expect(result).toEqual({
      id: 'animal-1',
      name: 'Rex',
      species_id: 'species-1',
      active: true,
      created_at: '2026-09-10T00:00:00.000Z',
    });
  });

  it('lança BadRequestException quando a espécie não existe, sem persistir nada', async () => {
    const supabase = buildSupabaseMock();
    const { useCase, speciesService } = await buildUseCase(supabase, false);

    await expect(useCase.execute(VALID_DTO)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(speciesService.exists).toHaveBeenCalledWith('species-1');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('lança InternalServerErrorException quando o insert falha', async () => {
    const supabase = buildSupabaseMock();
    supabase.from.mockReturnValue(
      buildAnimalsInsert({ data: null, error: { message: 'db error' } }),
    );

    const { useCase } = await buildUseCase(supabase, true);

    await expect(useCase.execute(VALID_DTO)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
