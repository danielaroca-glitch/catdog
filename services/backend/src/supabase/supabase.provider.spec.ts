import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { supabaseClientProvider, SUPABASE_CLIENT } from './supabase.provider';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({ __fake: 'supabase-client' }),
}));

const createClientMock = createClient as jest.MockedFunction<
  typeof createClient
>;

function buildConfigService(
  values: Record<string, string | undefined>,
): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('supabaseClientProvider', () => {
  const FAKE_URL = 'https://test.supabase.co';
  const FAKE_SERVICE_ROLE_KEY = 'test-key';

  afterEach(() => {
    jest.clearAllMocks();
  });

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

    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith(
      FAKE_URL,
      FAKE_SERVICE_ROLE_KEY,
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    );
    // Verificado à parte (em vez de aninhar `expect.objectContaining` dentro
    // de outro) para não disparar `no-unsafe-assignment` do lint type-aware —
    // o retorno de `expect.objectContaining` é tipado como `any`.
    const [, , options] = createClientMock.mock.calls[0];
    expect(typeof options?.realtime?.transport).toBe('function');
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
