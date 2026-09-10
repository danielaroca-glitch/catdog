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
export const SUPABASE_AUTH_CLIENT_FACTORY = 'SUPABASE_AUTH_CLIENT_FACTORY';

function requireEnv(config: ConfigService, key: string): string {
  const value = config.get<string>(key);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Check your .env file (see .env.example).`,
    );
  }
  return value;
}

function buildSupabaseClient(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: { transport: webSocketTransport },
  });
}

export const supabaseClientProvider: Provider = {
  provide: SUPABASE_CLIENT,
  useFactory: (config: ConfigService) => {
    const url = requireEnv(config, 'SUPABASE_URL');
    const serviceRoleKey = requireEnv(config, 'SUPABASE_SERVICE_ROLE_KEY');

    return buildSupabaseClient(url, serviceRoleKey);
  },
  inject: [ConfigService],
};

/**
 * Fábrica de clientes Supabase efêmeros, um por chamada (achado #1 crítico,
 * review rodada 1 do pbi-002). `SUPABASE_CLIENT` é singleton — reusá-lo para
 * `signInWithPassword`/`refreshSession` faz o GoTrueClient cachear a sessão
 * do usuário em memória (mesmo com `persistSession: false`, que só troca o
 * storage por um adaptador em memória, não desliga o cache) e passar a usar
 * esse JWT em chamadas REST subsequentes do MESMO cliente, no lugar da
 * service role key — vaza identidade entre requisições.
 *
 * A primeira correção tentada (`signOut({ scope: 'local' })` logo após
 * extrair os tokens) se mostrou incorreta: `scope: 'local'` ainda chama o
 * endpoint de logout do GoTrue e REVOGA a sessão recém-emitida no servidor
 * — quebrou o próprio fluxo de refresh (E2E-05 real). Um cliente novo por
 * chamada, nunca compartilhado, elimina o problema pela raiz: não há estado
 * para vazar porque não há reuso, e nada precisa ser limpo depois.
 */
export const supabaseAuthClientFactoryProvider: Provider = {
  provide: SUPABASE_AUTH_CLIENT_FACTORY,
  useFactory: (config: ConfigService) => {
    const url = requireEnv(config, 'SUPABASE_URL');
    const serviceRoleKey = requireEnv(config, 'SUPABASE_SERVICE_ROLE_KEY');

    return () => buildSupabaseClient(url, serviceRoleKey);
  },
  inject: [ConfigService],
};
