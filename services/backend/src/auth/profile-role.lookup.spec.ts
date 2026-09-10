import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider';
import { ProfileRoleLookup } from './profile-role.lookup';

function buildProfilesQuery(result: { data: unknown; error: unknown }) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
  };
}

function buildSupabaseMock() {
  return {
    from: jest.fn(),
  };
}

async function buildLookup(supabase: unknown) {
  const module = await Test.createTestingModule({
    providers: [
      ProfileRoleLookup,
      { provide: SUPABASE_CLIENT, useValue: supabase },
    ],
  }).compile();

  return module.get(ProfileRoleLookup);
}

describe('ProfileRoleLookup', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna o papel do usuário lido de profiles', async () => {
    const supabase = buildSupabaseMock();
    const query = buildProfilesQuery({
      data: { role: 'admin' },
      error: null,
    });
    supabase.from.mockReturnValue(query);

    const lookup = await buildLookup(supabase);
    const role = await lookup.execute('user-1');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(query.select).toHaveBeenCalledWith('role');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(role).toBe('admin');
  });

  it('lança InternalServerErrorException genérica quando a consulta retorna erro', async () => {
    const supabase = buildSupabaseMock();
    supabase.from.mockReturnValue(
      buildProfilesQuery({ data: null, error: { message: 'row not found' } }),
    );

    const lookup = await buildLookup(supabase);

    await expect(lookup.execute('user-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('lança InternalServerErrorException genérica quando a linha não existe', async () => {
    const supabase = buildSupabaseMock();
    supabase.from.mockReturnValue(
      buildProfilesQuery({ data: null, error: null }),
    );

    const lookup = await buildLookup(supabase);

    await expect(lookup.execute('user-1')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
