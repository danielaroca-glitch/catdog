import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';
import WebSocket from 'ws';

// Node 20 não tem WebSocket nativo — o realtime-js do supabase-js exige um
// transport explícito. `@supabase/realtime-js` exporta o tipo correto do
// construtor esperado, evitando o `any` que antes propagava erros de
// unsafe-assignment/return para o retorno de `createClient`.
const webSocketTransport: WebSocketLikeConstructor =
  WebSocket as unknown as WebSocketLikeConstructor;

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
  useFactory: (config: ConfigService) => {
    const url = requireEnv(config, 'SUPABASE_URL');
    const serviceRoleKey = requireEnv(config, 'SUPABASE_SERVICE_ROLE_KEY');

    return createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: { transport: webSocketTransport },
    });
  },
  inject: [ConfigService],
};
