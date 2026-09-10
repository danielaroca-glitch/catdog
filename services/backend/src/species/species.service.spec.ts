import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider';
import { SpeciesService } from './species.service';

function buildSpeciesQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function buildSupabaseMock() {
  return {
    from: jest.fn(),
  };
}

async function buildService(supabase: unknown) {
  const module = await Test.createTestingModule({
    providers: [
      SpeciesService,
      { provide: SUPABASE_CLIENT, useValue: supabase },
    ],
  }).compile();

  return module.get(SpeciesService);
}

describe('SpeciesService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna true quando a espécie existe', async () => {
    const supabase = buildSupabaseMock();
    const query = buildSpeciesQuery({ data: { id: 'species-1' }, error: null });
    supabase.from.mockReturnValue(query);

    const service = await buildService(supabase);
    const result = await service.exists('species-1');

    expect(supabase.from).toHaveBeenCalledWith('species');
    expect(query.select).toHaveBeenCalledWith('id');
    expect(query.eq).toHaveBeenCalledWith('id', 'species-1');
    expect(result).toBe(true);
  });

  it('retorna false quando a espécie não existe', async () => {
    const supabase = buildSupabaseMock();
    supabase.from.mockReturnValue(
      buildSpeciesQuery({ data: null, error: null }),
    );

    const service = await buildService(supabase);
    const result = await service.exists('species-inexistente');

    expect(result).toBe(false);
  });

  it('lança InternalServerErrorException quando a consulta retorna erro', async () => {
    const supabase = buildSupabaseMock();
    supabase.from.mockReturnValue(
      buildSpeciesQuery({ data: null, error: { message: 'connection error' } }),
    );

    const service = await buildService(supabase);

    await expect(service.exists('species-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
