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

interface SpeciesRow {
  id: string;
}

interface AnimalRow {
  id: string;
}

const TEST_PASSWORD = 'TestPassword123!';

/**
 * Integration test for T1 (pbi-003): PATCH /animals/:id com `active`.
 *
 * Mesmo padrão de `animals-update.e2e-spec.ts`. Cobre os cenários e2e de
 * `spec.md` (pbi-003):
 * - E2E-01 (INATIVACAO-01, INATIVACAO-02): inativa e reativa — sucesso.
 * - E2E-02 (INATIVACAO-03): inativar um já inativo — idempotente, sem erro.
 * - E2E-03 (INATIVACAO-04, INATIVACAO-05): sem token → 401; adotante → 403.
 */
describe('PATCH /animals/:id — active (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  let adminUserId: string;
  let adotanteUserId: string;
  let adminAccessToken: string;
  let adotanteAccessToken: string;
  let speciesId: string;

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
      data: SpeciesRow | null;
      error: { message: string } | null;
    };
    if (speciesResult.error || !speciesResult.data) {
      throw new Error(
        `Nenhuma espécie seedada encontrada — a migration 20260910190000_create_species_and_animals.sql foi aplicada? ${speciesResult.error?.message ?? ''}`,
      );
    }
    speciesId = speciesResult.data.id;

    const adminEmail = `catdog-e2e-t1-inactivate-admin-${Date.now()}@example.com`;
    const { data: adminData, error: adminError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adminError || !adminData.user) {
      throw new Error(
        `Falha ao criar usuário admin de teste para animals-inactivate.e2e-spec: ${adminError?.message}`,
      );
    }
    adminUserId = adminData.user.id;

    const { error: promoteError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', adminUserId);
    if (promoteError) {
      throw new Error(
        `Falha ao promover usuário de teste a admin em animals-inactivate.e2e-spec: ${promoteError.message}`,
      );
    }

    const adotanteEmail = `catdog-e2e-t1-inactivate-adotante-${Date.now()}@example.com`;
    const { data: adotanteData, error: adotanteError } =
      await supabase.auth.admin.createUser({
        email: adotanteEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adotanteError || !adotanteData.user) {
      throw new Error(
        `Falha ao criar usuário adotante de teste para animals-inactivate.e2e-spec: ${adotanteError?.message}`,
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

  async function createAnimal(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/animals')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: 'Rex', species_id: speciesId });
    return (response.body as AnimalRow).id;
  }

  it('E2E-01: admin inativa e depois reativa um animal (INATIVACAO-01, INATIVACAO-02)', async () => {
    const animalId = await createAnimal();

    const deactivateResponse = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ active: false });
    expect(deactivateResponse.status).toBe(200);
    expect(deactivateResponse.body).toMatchObject({ active: false });

    const reactivateResponse = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ active: true });
    expect(reactivateResponse.status).toBe(200);
    expect(reactivateResponse.body).toMatchObject({ active: true });
  });

  it('E2E-02: inativar um animal já inativo é idempotente, sem erro (INATIVACAO-03)', async () => {
    const animalId = await createAnimal();
    await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ active: false });

    const response = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ active: false });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ active: false });
  });

  it('E2E-03: sem Authorization header recebe 401 (INATIVACAO-04)', async () => {
    const animalId = await createAnimal();

    const response = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .send({ active: false });

    expect(response.status).toBe(401);
  });

  it('E2E-03: usuário adotante recebe 403 (INATIVACAO-05)', async () => {
    const animalId = await createAnimal();

    const response = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .set('Authorization', `Bearer ${adotanteAccessToken}`)
      .send({ active: false });

    expect(response.status).toBe(403);
  });
});
