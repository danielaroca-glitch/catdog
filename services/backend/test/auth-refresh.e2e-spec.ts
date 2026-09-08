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

// Senha de fixture para conta de teste descartável (criada e removida neste
// mesmo teste) — não é uma credencial real. Mesmo padrão aceito em
// `profiles-trigger.e2e-spec.ts`.
const TEST_PASSWORD = 'TestPassword123!';

/**
 * Integration test for T4: POST /auth/refresh.
 *
 * Roda contra o projeto Supabase real (via SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
 * do .env), mesmo padrão de `auth-register.e2e-spec.ts`. Cria um usuário
 * confirmado, obtém uma sessão inicial via POST /auth/login (o próprio
 * endpoint sob teste em T4), e usa o `refresh_token` retornado para os dois
 * cenários abaixo.
 *
 * Cobre os cenários e2e de `spec.md`:
 * - E2E-04 (LOGIN-06): refresh válido emite novo par de tokens.
 * - E2E-05 (LOGIN-03): reuso do refresh_token original (já rotacionado pelo
 *   teste anterior) invalida a sessão — depende da configuração "Refresh
 *   Token Rotation" estar habilitada no dashboard do projeto Supabase (ver
 *   `spec.md`, nota de arquitetura, e task T5). Se este teste falhar
 *   inesperadamente com sucesso em vez de 401, é sinal dessa configuração
 *   estar desligada — não um bug de código desta task.
 *
 * Os dois `it()` rodam em sequência (Jest executa `it`s de um `describe` na
 * ordem declarada) e dependem um do outro: E2E-04 consome o refresh_token
 * original produzindo um novo par; E2E-05 reapresenta esse MESMO token
 * original (já usado) para provar a detecção de reuso.
 */
describe('POST /auth/refresh (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  let userId: string;
  let originalRefreshToken: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    supabase = moduleRef.get<SupabaseClient>(SUPABASE_CLIENT);

    const email = `catdog-e2e-t4-refresh-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(
        `Falha ao criar usuário de teste para auth-refresh.e2e-spec: ${error?.message}`,
      );
    }
    userId = data.user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: TEST_PASSWORD });

    const loginBody = loginResponse.body as AuthenticatedSessionResponse;
    originalRefreshToken = loginBody.refresh_token;
  });

  afterAll(async () => {
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch {
      // Não interrompe o encerramento da suíte por uma falha isolada de delete.
    }
    await app.close();
  });

  it('E2E-04: refresh válido emite um novo par de tokens (LOGIN-06)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: originalRefreshToken });

    const body = response.body as AuthenticatedSessionResponse;

    expect([200, 201]).toContain(response.status);
    expect(body.access_token).toEqual(expect.any(String));
    expect(body.refresh_token).toEqual(expect.any(String));
    expect(body.refresh_token).not.toBe(originalRefreshToken);
  });

  it('E2E-05: reuso do refresh_token já rotacionado invalida a sessão (LOGIN-03)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: originalRefreshToken });

    expect(response.status).toBe(401);
  });
});
