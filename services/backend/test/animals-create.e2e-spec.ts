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
const NONEXISTENT_SPECIES_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Integration test for T4: POST /animals.
 *
 * Mesmo padrão de `admin-ping.e2e-spec.ts`: roda contra o Supabase real,
 * cria admin (promovido via UPDATE direto em `profiles`) e adotante,
 * login real via `POST /auth/login`.
 *
 * Cobre os cenários e2e de `spec.md`:
 * - E2E-01 (ALTA-01): admin + espécie válida (seed de T1) → 201, active true.
 * - E2E-02 (ALTA-02, ALTA-03): sem espécie / espécie inexistente → 400, nada persistido.
 * - E2E-03 (ALTA-04, ALTA-05): sem token → 401; papel adotante → 403.
 */
describe('POST /animals (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  let adminUserId: string;
  let adotanteUserId: string;
  let adminAccessToken: string;
  let adotanteAccessToken: string;
  let validSpeciesId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    supabase = moduleRef.get<SupabaseClient>(SUPABASE_CLIENT);

    const speciesResult = (await supabase
      .from('species')
      .select('id')
      .limit(1)
      .single()) as {
      data: { id: string } | null;
      error: { message: string } | null;
    };
    if (speciesResult.error || !speciesResult.data) {
      throw new Error(
        `Nenhuma espécie seedada encontrada — a migration 20260910190000_create_species_and_animals.sql foi aplicada? ${speciesResult.error?.message ?? ''}`,
      );
    }
    validSpeciesId = speciesResult.data.id;

    const adminEmail = `catdog-e2e-t4-admin-${Date.now()}@example.com`;
    const { data: adminData, error: adminError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adminError || !adminData.user) {
      throw new Error(
        `Falha ao criar usuário admin de teste para animals-create.e2e-spec: ${adminError?.message}`,
      );
    }
    adminUserId = adminData.user.id;

    const { error: promoteError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', adminUserId);
    if (promoteError) {
      throw new Error(
        `Falha ao promover usuário de teste a admin em animals-create.e2e-spec: ${promoteError.message}`,
      );
    }

    const adotanteEmail = `catdog-e2e-t4-adotante-${Date.now()}@example.com`;
    const { data: adotanteData, error: adotanteError } =
      await supabase.auth.admin.createUser({
        email: adotanteEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adotanteError || !adotanteData.user) {
      throw new Error(
        `Falha ao criar usuário adotante de teste para animals-create.e2e-spec: ${adotanteError?.message}`,
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

  it('E2E-01: admin cria animal com espécie válida (ALTA-01)', async () => {
    const response = await request(app.getHttpServer())
      .post('/animals')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: 'Rex', species_id: validSpeciesId });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Rex',
      species_id: validSpeciesId,
      active: true,
    });
  });

  it('E2E-02: sem species_id recebe 400 (ALTA-02)', async () => {
    const response = await request(app.getHttpServer())
      .post('/animals')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: 'Rex' });

    expect(response.status).toBe(400);
  });

  it('E2E-02: com species_id inexistente recebe 400 (ALTA-03)', async () => {
    const response = await request(app.getHttpServer())
      .post('/animals')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: 'Rex', species_id: NONEXISTENT_SPECIES_ID });

    expect(response.status).toBe(400);
  });

  it('E2E-03: sem Authorization header recebe 401 (ALTA-04)', async () => {
    const response = await request(app.getHttpServer())
      .post('/animals')
      .send({ name: 'Rex', species_id: validSpeciesId });

    expect(response.status).toBe(401);
  });

  it('E2E-03: usuário adotante recebe 403 (ALTA-05)', async () => {
    const response = await request(app.getHttpServer())
      .post('/animals')
      .set('Authorization', `Bearer ${adotanteAccessToken}`)
      .send({ name: 'Rex', species_id: validSpeciesId });

    expect(response.status).toBe(403);
  });
});
