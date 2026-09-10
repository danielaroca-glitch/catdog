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
 * - E2E-05 (LOGIN-03): reuso do refresh_token original (duas gerações atrás
 *   do token válido atual) invalida a sessão.
 *
 * Os dois `it()` rodam em sequência (Jest executa `it`s de um `describe` na
 * ordem declarada) e dependem um do outro: E2E-04 consome o refresh_token
 * original produzindo um novo par (geração 1); E2E-05 faz uma SEGUNDA
 * rotação (geração 1 → geração 2) e só então reapresenta o token original
 * (geração 0) para provar a detecção de reuso.
 *
 * A segunda rotação é necessária por como o GoTrue (motor de auth do
 * Supabase) decide entre "reuso tolerado" e "reuso malicioso" — não é uma
 * questão de tempo decorrido. Para tokens v2, a tolerância depende da
 * diferença de contador entre o token apresentado e o token válido atual
 * (`internal/tokens/service.go` do supabase/auth):
 *
 *   likelyNotSavedByClient := counterDifference == 1
 *   likelyConcurrentRefreshes := |retryStart - session.LastRefreshedAt| < reuseInterval
 *   reuseAllowed := likelyNotSavedByClient || likelyConcurrentRefreshes || ...
 *
 * `counterDifference == 1` (o token apresentado é exatamente o predecessor
 * do atual) é tolerado SEMPRE, não importa quanto tempo tenha passado — é a
 * proteção contra perda de resposta de rede (o cliente rotaciona, não
 * recebe/salva a resposta, reapresenta o token antigo, e o servidor
 * reconhece que é "um passo atrás" e reenvia o par atual em vez de revogar).
 *
 * As duas condições de tolerância são combinadas com OR — as duas precisam
 * ser falsas para o reuso ser rejeitado:
 * - `likelyNotSavedByClient` (`counterDifference == 1`) — por isso a rotação
 *   intermediária abaixo (geração 1 → geração 2) é necessária: sem ela,
 *   `originalRefreshToken` (geração 0) estaria sempre a só 1 geração do token
 *   válido atual, tolerado para sempre, não importa quanto se espere.
 * - `likelyConcurrentRefreshes` (`|retryStart - session.LastRefreshedAt| <
 *   reuseInterval`) — medido contra o último refresh bem-sucedido da SESSÃO
 *   (a rotação intermediária), não contra o token reapresentado. Por isso
 *   `REUSE_INTERVAL_MARGIN_MS` (> 10s, o "Refresh token reuse interval" do
 *   dashboard) precisa ser esperado DEPOIS da rotação intermediária, não
 *   antes — só assim as duas condições ficam falsas e o reuso é rejeitado
 *   (mapeado para 401 por `RefreshUseCase`).
 */
const REUSE_INTERVAL_MARGIN_MS = 12_000;
describe('POST /auth/refresh (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  let userId: string;
  let originalRefreshToken: string;
  let firstRotatedRefreshToken: string;

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

    firstRotatedRefreshToken = body.refresh_token;
  });

  it(
    'E2E-05: reuso do refresh_token de duas gerações atrás invalida a sessão (LOGIN-03)',
    async () => {
      const intermediateResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: firstRotatedRefreshToken });

      expect([200, 201]).toContain(intermediateResponse.status);

      await new Promise((resolve) =>
        setTimeout(resolve, REUSE_INTERVAL_MARGIN_MS),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: originalRefreshToken });

      expect(response.status).toBe(401);
    },
    REUSE_INTERVAL_MARGIN_MS + 10_000,
  );
});
