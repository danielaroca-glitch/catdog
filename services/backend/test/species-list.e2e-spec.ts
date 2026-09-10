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

const TEST_PASSWORD = 'TestPassword123!';

/**
 * Integration test for GET /species — endpoint auxiliar (não previsto em
 * task.md original, adicionado ao perceber que o formulário de T6 não tinha
 * como saber quais espécies existem). Mesmo padrão de fixtures de
 * `animals-create.e2e-spec.ts`.
 */
describe('GET /species (e2e)', () => {
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

    const adminEmail = `catdog-e2e-species-admin-${Date.now()}@example.com`;
    const { data: adminData, error: adminError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adminError || !adminData.user) {
      throw new Error(
        `Falha ao criar usuário admin de teste para species-list.e2e-spec: ${adminError?.message}`,
      );
    }
    adminUserId = adminData.user.id;

    const { error: promoteError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', adminUserId);
    if (promoteError) {
      throw new Error(
        `Falha ao promover usuário de teste a admin em species-list.e2e-spec: ${promoteError.message}`,
      );
    }

    const adotanteEmail = `catdog-e2e-species-adotante-${Date.now()}@example.com`;
    const { data: adotanteData, error: adotanteError } =
      await supabase.auth.admin.createUser({
        email: adotanteEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adotanteError || !adotanteData.user) {
      throw new Error(
        `Falha ao criar usuário adotante de teste para species-list.e2e-spec: ${adotanteError?.message}`,
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

  it('admin recebe a lista de espécies seedadas', async () => {
    const response = await request(app.getHttpServer())
      .get('/species')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect((response.body as { name: string }[]).length).toBeGreaterThan(0);
  });

  it('adotante recebe 403', async () => {
    const response = await request(app.getHttpServer())
      .get('/species')
      .set('Authorization', `Bearer ${adotanteAccessToken}`);

    expect(response.status).toBe(403);
  });

  it('sem token recebe 401', async () => {
    const response = await request(app.getHttpServer()).get('/species');

    expect(response.status).toBe(401);
  });
});
