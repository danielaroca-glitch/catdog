import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SUPABASE_CLIENT } from '../src/supabase/supabase.provider';

interface RegisteredUserResponse {
  id: string;
  email: string;
  role: string;
}

/**
 * Integration test for T13.
 *
 * Achado #1 (major) de review.md Rodada de revisão 2: o ThrottlerGuard
 * identifica o cliente por `req.ip`. Decisão registrada em `.makuco/STATE.md`:
 * este projeto não configura `app.set('trust proxy', ...)` hoje, porque não
 * existe nenhuma topologia de deploy definida ainda (nenhum reverse
 * proxy/load balancer conhecido). Sem essa config, o Express ignora
 * `X-Forwarded-For` e resolve `req.ip` sempre a partir do socket da conexão
 * direta — o comportamento correto e seguro para o cenário atual (conexão
 * direta), e também o motivo de o header forjado abaixo não ter efeito.
 *
 * Este teste comprova essa propriedade: requisições com um `X-Forwarded-For`
 * forjado e diferente a cada tentativa continuam sendo contadas no mesmo
 * balde de rate limit (todas chegam pela mesma conexão direta de teste) —
 * ou seja, o header forjado não é usado para identificar o cliente, e o
 * rate limit de `auth-register-rate-limit.e2e-spec.ts` não é contornável
 * dessa forma.
 */
function validPayload(email: string) {
  return {
    nome: 'Daniela Roca',
    email,
    senha: 'senhaForte123',
    confirmarSenha: 'senhaForte123',
  };
}

describe('Trust proxy - X-Forwarded-For não é confiável (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    supabase = moduleRef.get<SupabaseClient>(SUPABASE_CLIENT);
  });

  afterEach(async () => {
    while (createdUserIds.length > 0) {
      const userId = createdUserIds.pop();
      if (userId) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch {
          // limpeza best-effort: uma falha isolada não deve impedir a
          // remoção dos demais usuários criados neste teste.
        }
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('X-Forwarded-For forjado e distinto por requisição não contorna o rate limit (trust proxy desligado)', async () => {
    const attempts = 6;
    const responses: { status: number; body: RegisteredUserResponse }[] = [];

    for (let i = 0; i < attempts; i++) {
      const email = `catdog-e2e-t13-${Date.now()}-${i}@example.com`;

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Forwarded-For', `10.0.0.${i}`)
        .send(validPayload(email));

      responses.push({
        status: response.status,
        body: response.body as RegisteredUserResponse,
      });

      if (response.status === 201) {
        createdUserIds.push((response.body as RegisteredUserResponse).id);
      }
    }

    const last = responses[responses.length - 1];
    expect(last.status).toBe(429);
  }, 30000);
});
