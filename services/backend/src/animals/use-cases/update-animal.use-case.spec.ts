import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../supabase/supabase.provider';
import { SpeciesService } from '../../species/species.service';
import { UpdateAnimalDto } from '../dto/update-animal.dto';
import { UpdateAnimalUseCase } from './update-animal.use-case';

const ANIMAL_ID = 'animal-1';

function buildAnimalsUpdate(result: { data: unknown; error: unknown }) {
  return {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function buildSupabaseMock() {
  return {
    from: jest.fn(),
  };
}

async function buildUseCase(supabase: unknown, speciesExists = true) {
  const speciesService = { exists: jest.fn().mockResolvedValue(speciesExists) };

  const module = await Test.createTestingModule({
    providers: [
      UpdateAnimalUseCase,
      { provide: SUPABASE_CLIENT, useValue: supabase },
      { provide: SpeciesService, useValue: speciesService },
    ],
  }).compile();

  return { useCase: module.get(UpdateAnimalUseCase), speciesService };
}

describe('UpdateAnimalUseCase', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('atualiza name e species_id quando ambos são informados e a espécie existe', async () => {
    const updatedAnimal = {
      id: ANIMAL_ID,
      name: 'Rex 2',
      species_id: 'species-2',
      active: true,
      created_at: '2026-09-10T00:00:00.000Z',
    };
    const supabase = buildSupabaseMock();
    const query = buildAnimalsUpdate({ data: updatedAnimal, error: null });
    supabase.from.mockReturnValue(query);

    const { useCase, speciesService } = await buildUseCase(supabase, true);
    const dto: UpdateAnimalDto = { name: 'Rex 2', species_id: 'species-2' };
    const result = await useCase.execute(ANIMAL_ID, dto);

    expect(speciesService.exists).toHaveBeenCalledWith('species-2');
    expect(query.update).toHaveBeenCalledWith({
      name: 'Rex 2',
      species_id: 'species-2',
    });
    expect(query.eq).toHaveBeenCalledWith('id', ANIMAL_ID);
    expect(result).toEqual(updatedAnimal);
  });

  it('atualiza só name quando species_id não é informado, sem consultar SpeciesService', async () => {
    const updatedAnimal = {
      id: ANIMAL_ID,
      name: 'Rex 2',
      species_id: 'species-1',
      active: false,
      created_at: '2026-09-10T00:00:00.000Z',
    };
    const supabase = buildSupabaseMock();
    const query = buildAnimalsUpdate({ data: updatedAnimal, error: null });
    supabase.from.mockReturnValue(query);

    const { useCase, speciesService } = await buildUseCase(supabase);
    const result = await useCase.execute(ANIMAL_ID, { name: 'Rex 2' });

    expect(speciesService.exists).not.toHaveBeenCalled();
    expect(query.update).toHaveBeenCalledWith({ name: 'Rex 2' });
    expect(result).toEqual(updatedAnimal);
  });

  it('funciona para um animal inativo (EDICAO-04) — nenhuma checagem extra de active', async () => {
    const updatedAnimal = {
      id: ANIMAL_ID,
      name: 'Rex 2',
      species_id: 'species-1',
      active: false,
      created_at: '2026-09-10T00:00:00.000Z',
    };
    const supabase = buildSupabaseMock();
    supabase.from.mockReturnValue(
      buildAnimalsUpdate({ data: updatedAnimal, error: null }),
    );

    const { useCase } = await buildUseCase(supabase);
    const result = await useCase.execute(ANIMAL_ID, { name: 'Rex 2' });

    expect(result.active).toBe(false);
  });

  it('atualiza active para false (INATIVACAO-01)', async () => {
    const inactivatedAnimal = {
      id: ANIMAL_ID,
      name: 'Rex',
      species_id: 'species-1',
      active: false,
      created_at: '2026-09-10T00:00:00.000Z',
    };
    const supabase = buildSupabaseMock();
    const query = buildAnimalsUpdate({ data: inactivatedAnimal, error: null });
    supabase.from.mockReturnValue(query);

    const { useCase } = await buildUseCase(supabase);
    const result = await useCase.execute(ANIMAL_ID, { active: false });

    expect(query.update).toHaveBeenCalledWith({ active: false });
    expect(result.active).toBe(false);
  });

  it('atualiza active para true (INATIVACAO-02)', async () => {
    const reactivatedAnimal = {
      id: ANIMAL_ID,
      name: 'Rex',
      species_id: 'species-1',
      active: true,
      created_at: '2026-09-10T00:00:00.000Z',
    };
    const supabase = buildSupabaseMock();
    const query = buildAnimalsUpdate({ data: reactivatedAnimal, error: null });
    supabase.from.mockReturnValue(query);

    const { useCase } = await buildUseCase(supabase);
    const result = await useCase.execute(ANIMAL_ID, { active: true });

    expect(query.update).toHaveBeenCalledWith({ active: true });
    expect(result.active).toBe(true);
  });

  it('lança BadRequestException quando nenhum campo é informado, sem tocar o banco (EDICAO-09)', async () => {
    const supabase = buildSupabaseMock();
    const { useCase } = await buildUseCase(supabase);

    await expect(useCase.execute(ANIMAL_ID, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('lança BadRequestException quando species_id não existe, sem aplicar mudança (EDICAO-03)', async () => {
    const supabase = buildSupabaseMock();
    const { useCase, speciesService } = await buildUseCase(supabase, false);

    await expect(
      useCase.execute(ANIMAL_ID, { species_id: 'species-inexistente' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(speciesService.exists).toHaveBeenCalledWith('species-inexistente');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando o animal não existe (EDICAO-07)', async () => {
    const supabase = buildSupabaseMock();
    supabase.from.mockReturnValue(
      buildAnimalsUpdate({ data: null, error: null }),
    );

    const { useCase } = await buildUseCase(supabase);

    await expect(
      useCase.execute(ANIMAL_ID, { name: 'Rex 2' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança InternalServerErrorException quando o update falha', async () => {
    const supabase = buildSupabaseMock();
    supabase.from.mockReturnValue(
      buildAnimalsUpdate({ data: null, error: { message: 'db error' } }),
    );

    const { useCase } = await buildUseCase(supabase);

    await expect(
      useCase.execute(ANIMAL_ID, { name: 'Rex 2' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
