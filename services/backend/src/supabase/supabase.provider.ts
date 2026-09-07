import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

function requireEnv(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Check your .env file (see .env.example).`,
    );
  }
  return value;
}

export const supabaseClientProvider: Provider = {
  provide: SUPABASE_CLIENT,
  useFactory: (config: ConfigService): SupabaseClient => {
    const url = requireEnv(config, 'SUPABASE_URL');
    const serviceRoleKey = requireEnv(config, 'SUPABASE_SERVICE_ROLE_KEY');

    return createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  },
  inject: [ConfigService],
};
