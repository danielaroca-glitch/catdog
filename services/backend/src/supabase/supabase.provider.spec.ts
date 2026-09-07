import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { supabaseClientProvider, SUPABASE_CLIENT } from './supabase.provider';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({ __fake: 'supabase-client' }),
}));

describe('supabaseClientProvider', () => {
  const FAKE_URL = 'https://test.supabase.co';
  const FAKE_SERVICE_ROLE_KEY = 'test-key';

  afterEach(() => {
    jest.clearAllMocks();
  });

  function buildConfigService(
    values: Record<string, string | undefined>,
  ): ConfigService {
    return {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
  }

  it('has the expected injection token', () => {
    expect(supabaseClientProvider.provide).toBe(SUPABASE_CLIENT);
  });

  it('creates the Supabase client using SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from ConfigService', () => {
    const configService = buildConfigService({
      SUPABASE_URL: FAKE_URL,
      SUPABASE_SERVICE_ROLE_KEY: FAKE_SERVICE_ROLE_KEY,
    });

    const factory = supabaseClientProvider.useFactory as (
      config: ConfigService,
    ) => unknown;
    const client = factory(configService);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      FAKE_URL,
      FAKE_SERVICE_ROLE_KEY,
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        realtime: expect.objectContaining({ transport: expect.any(Function) }),
      }),
    );
    expect(client).toEqual({ __fake: 'supabase-client' });
  });

  it('throws a clear error when SUPABASE_URL is missing', () => {
    const configService = buildConfigService({
      SUPABASE_URL: undefined,
      SUPABASE_SERVICE_ROLE_KEY: FAKE_SERVICE_ROLE_KEY,
    });

    const factory = supabaseClientProvider.useFactory as (
      config: ConfigService,
    ) => unknown;

    expect(() => factory(configService)).toThrow(/SUPABASE_URL/);
  });

  it('throws a clear error when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    const configService = buildConfigService({
      SUPABASE_URL: FAKE_URL,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    });

    const factory = supabaseClientProvider.useFactory as (
      config: ConfigService,
    ) => unknown;

    expect(() => factory(configService)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
