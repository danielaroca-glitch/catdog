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
 * Integration test for T12: rate limiting em POST /auth/register.
 *
 * Achado #2 (major) de review.md rodada 1: endpoint público sem nenhum
 * rate limiting, permitindo criação em massa de contas e sondagem de
 * e-mails via respostas 409 repetidas.
 *
 * Roda contra o projeto Supabase real (mesmo padrão de
 * `auth-register.e2e-spec.ts`). Usa e-mails diferentes por requisição —
 * o que importa aqui é bater no limite de requisições por IP antes de
 * qualquer verificação de negócio (400/201/409). Limpa os usuários
 * criados com sucesso no `afterEach`.
 */
function validPayload(email: string) {
  return {
    nome: 'Daniela Roca',
    email,
    senha: 'senhaForte123',
    confirmarSenha: 'senhaForte123',
  };
}

describe('POST /auth/register - rate limit (e2e)', () => {
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
        await supabase.auth.admin.deleteUser(userId);
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('retorna 429 ao exceder o limite de requisições por IP (5/min)', async () => {
    const attempts = 6;
    const responses: { status: number; body: RegisteredUserResponse }[] = [];

    for (let i = 0; i < attempts; i++) {
      const email = `catdog-e2e-t12-${Date.now()}-${i}@example.com`;

      const response = await request(app.getHttpServer())
        .post('/auth/register')
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

    const successCount = responses.filter((r) => r.status === 201).length;
    expect(successCount).toBeLessThanOrEqual(5);
  }, 30000);
});
