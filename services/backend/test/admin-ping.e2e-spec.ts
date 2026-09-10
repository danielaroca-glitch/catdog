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
}

// Senha de fixture para contas de teste descartáveis (criadas e removidas
// neste mesmo teste) — não é uma credencial real. Mesmo padrão aceito em
// `auth-login.e2e-spec.ts`/`profiles-trigger.e2e-spec.ts`.
const TEST_PASSWORD = 'TestPassword123!';

/**
 * Integration test for T6: GET /admin/ping.
 *
 * Roda contra o projeto Supabase real (via SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
 * do .env), mesmo padrão de `auth-login.e2e-spec.ts`/`auth-refresh.e2e-spec.ts`.
 *
 * O trigger de banco (`20260907120000_create_profiles.sql`) sempre cria a
 * linha de `profiles` com `role = 'adotante'` no signup — não há como pedir
 * `role: 'admin'` na criação. Por isso o usuário admin é criado como
 * qualquer outro e, em seguida, promovido via UPDATE direto em `profiles`
 * usando o `SUPABASE_CLIENT` (service role) — a mesma leitura/escrita
 * administrativa que os demais e2e já fazem, nunca o auth de usuário final.
 *
 * Login é feito de verdade via `POST /auth/login` (o próprio endpoint já
 * validado por `auth-login.e2e-spec.ts`) para obter um `access_token` real
 * assinado pelo GoTrue — não um JWT forjado — garantindo que o guard é
 * exercitado ponta a ponta.
 *
 * Cobre os cenários e2e de `spec.md`:
 * - E2E-05 (AUTZ-03): usuário `admin` → 200 `{ ok: true }`.
 * - E2E-04 (AUTZ-03, AUTZ-06): usuário `adotante` → 403.
 * - E2E-06 (AUTZ-04, AUTZ-05): sem token → 401; token inválido/malformado → 401.
 */
describe('GET /admin/ping (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  let adminUserId: string;
  let adotanteUserId: string;
  let adminAccessToken: string;
  let adotanteAccessToken: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    supabase = moduleRef.get<SupabaseClient>(SUPABASE_CLIENT);

    const adminEmail = `catdog-e2e-t6-admin-${Date.now()}@example.com`;
    const { data: adminData, error: adminError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adminError || !adminData.user) {
      throw new Error(
        `Falha ao criar usuário admin de teste para admin-ping.e2e-spec: ${adminError?.message}`,
      );
    }
    adminUserId = adminData.user.id;

    const { error: promoteError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', adminUserId);
    if (promoteError) {
      throw new Error(
        `Falha ao promover usuário de teste a admin em admin-ping.e2e-spec: ${promoteError.message}`,
      );
    }

    const adotanteEmail = `catdog-e2e-t6-adotante-${Date.now()}@example.com`;
    const { data: adotanteData, error: adotanteError } =
      await supabase.auth.admin.createUser({
        email: adotanteEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adotanteError || !adotanteData.user) {
      throw new Error(
        `Falha ao criar usuário adotante de teste para admin-ping.e2e-spec: ${adotanteError?.message}`,
      );
    }
    adotanteUserId = adotanteData.user.id;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, senha: TEST_PASSWORD });
    adminAccessToken = (adminLoginResponse.body as AuthenticatedSessionResponse)
      .access_token;

    const adotanteLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adotanteEmail, senha: TEST_PASSWORD });
    adotanteAccessToken = (
      adotanteLoginResponse.body as AuthenticatedSessionResponse
    ).access_token;
  });

  afterAll(async () => {
    for (const userId of [adminUserId, adotanteUserId]) {
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch {
        // Não interrompe o encerramento da suíte por uma falha isolada de delete.
      }
    }
    await app.close();
  });

  it('E2E-05: usuário admin recebe 200 { ok: true } (AUTZ-03)', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/ping')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('E2E-04: usuário adotante recebe 403 (AUTZ-03, AUTZ-06)', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/ping')
      .set('Authorization', `Bearer ${adotanteAccessToken}`);

    expect(response.status).toBe(403);
  });

  it('E2E-06: sem Authorization header recebe 401 (AUTZ-04)', async () => {
    const response = await request(app.getHttpServer()).get('/admin/ping');

    expect(response.status).toBe(401);
  });

  it('E2E-06: token malformado recebe 401 (AUTZ-05)', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/ping')
      .set('Authorization', 'Bearer not-a-jwt');

    expect(response.status).toBe(401);
  });
});
