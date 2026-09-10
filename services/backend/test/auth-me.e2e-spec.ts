import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { SUPABASE_CLIENT } from '../src/supabase/supabase.provider';

interface AuthenticatedSessionResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface AuthenticatedUserProfileResponse {
  id: string;
  email: string;
  role: string;
}

// Senha de fixture para conta de teste descartável (criada e removida neste
// mesmo teste) — não é uma credencial real. Mesmo padrão aceito em
// `profiles-trigger.e2e-spec.ts`.
const TEST_PASSWORD = 'TestPassword123!';

/**
 * Integration test for T5: GET /auth/me.
 *
 * Roda contra o projeto Supabase real (via SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
 * do .env), mesmo padrão de `auth-login.e2e-spec.ts`/`auth-refresh.e2e-spec.ts`.
 * Cria um usuário confirmado, faz login de verdade via `POST /auth/login`
 * (endpoint já existente) para obter um `access_token` real assinado pelo
 * GoTrue, e usa esse token na chamada a `GET /auth/me` — não fabrica um JWT
 * manualmente, para exercitar o mesmo par de segredo/algoritmo que
 * `JwtAuthGuard` valida em produção.
 *
 * Cobre o cenário e2e de `spec.md`:
 * - E2E-06 (AUTZ-04, AUTZ-05): sem token → 401; token inválido/malformado → 401.
 * Mais o caminho feliz (200, shape `{ id, email, role }`) exigido pelo
 * "Done when" de T5.
 */
describe('GET /auth/me (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  let userId: string;
  let accessToken: string;
  const email = `catdog-e2e-t5-me-${Date.now()}@example.com`;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    supabase = moduleRef.get<SupabaseClient>(SUPABASE_CLIENT);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(
        `Falha ao criar usuário de teste para auth-me.e2e-spec: ${error?.message}`,
      );
    }
    userId = data.user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: TEST_PASSWORD });

    const loginBody = loginResponse.body as AuthenticatedSessionResponse;
    accessToken = loginBody.access_token;
  });

  afterAll(async () => {
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch {
      // Não interrompe o encerramento da suíte por uma falha isolada de delete.
    }
    await app.close();
  });

  it('retorna { id, email, role } do usuário do token atual com token válido (200)', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    const body = response.body as AuthenticatedUserProfileResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: userId,
      email,
      role: 'adotante',
    });
  });

  it('E2E-06: sem header Authorization retorna 401 (AUTZ-04)', async () => {
    const response = await request(app.getHttpServer()).get('/auth/me');

    expect(response.status).toBe(401);
  });

  it('E2E-06: token malformado/inválido retorna 401 (AUTZ-05)', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer isto-nao-e-um-jwt-valido');

    expect(response.status).toBe(401);
  });
});
