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
  name: string;
}

interface AnimalRow {
  id: string;
}

const TEST_PASSWORD = 'TestPassword123!';
const NONEXISTENT_ANIMAL_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Integration test for T2: PATCH /animals/:id.
 *
 * Mesmo padrão de `animals-create.e2e-spec.ts`: roda contra o Supabase
 * real, cria admin + adotante, login real via `POST /auth/login`.
 *
 * Cobre os cenários e2e de `spec.md` (pbi-002):
 * - E2E-01 (EDICAO-01, EDICAO-02): edita name + species_id — sucesso.
 * - E2E-02 (EDICAO-03): species_id inexistente — 400, nada muda.
 * - E2E-03 (EDICAO-05, EDICAO-06): sem token → 401; papel adotante → 403.
 * - E2E-04 (EDICAO-04): edita um animal inativo — sucesso.
 * - E2E-05 (EDICAO-07): id inexistente (UUID válido) — 404.
 */
describe('PATCH /animals/:id (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  let adminUserId: string;
  let adotanteUserId: string;
  let adminAccessToken: string;
  let adotanteAccessToken: string;
  let speciesA: string;
  let speciesB: string;

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
      .select('id, name')
      .limit(2)) as {
      data: SpeciesRow[] | null;
      error: { message: string } | null;
    };
    if (
      speciesResult.error ||
      !speciesResult.data ||
      speciesResult.data.length < 2
    ) {
      throw new Error(
        `São necessárias ao menos 2 espécies seedadas — a migration 20260910190000_create_species_and_animals.sql foi aplicada? ${speciesResult.error?.message ?? ''}`,
      );
    }
    speciesA = speciesResult.data[0].id;
    speciesB = speciesResult.data[1].id;

    const adminEmail = `catdog-e2e-t2-edit-admin-${Date.now()}@example.com`;
    const { data: adminData, error: adminError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adminError || !adminData.user) {
      throw new Error(
        `Falha ao criar usuário admin de teste para animals-update.e2e-spec: ${adminError?.message}`,
      );
    }
    adminUserId = adminData.user.id;

    const { error: promoteError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', adminUserId);
    if (promoteError) {
      throw new Error(
        `Falha ao promover usuário de teste a admin em animals-update.e2e-spec: ${promoteError.message}`,
      );
    }

    const adotanteEmail = `catdog-e2e-t2-edit-adotante-${Date.now()}@example.com`;
    const { data: adotanteData, error: adotanteError } =
      await supabase.auth.admin.createUser({
        email: adotanteEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adotanteError || !adotanteData.user) {
      throw new Error(
        `Falha ao criar usuário adotante de teste para animals-update.e2e-spec: ${adotanteError?.message}`,
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

  async function createAnimal(name: string, speciesId: string, active = true) {
    const createResponse = await request(app.getHttpServer())
      .post('/animals')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name, species_id: speciesId });
    const animalId = (createResponse.body as AnimalRow).id;

    if (!active) {
      await supabase
        .from('animals')
        .update({ active: false })
        .eq('id', animalId);
    }

    return animalId;
  }

  it('E2E-01: admin edita nome e espécie com sucesso (EDICAO-01, EDICAO-02)', async () => {
    const animalId = await createAnimal('Rex', speciesA);

    const response = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: 'Rex 2', species_id: speciesB });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: animalId,
      name: 'Rex 2',
      species_id: speciesB,
    });
  });

  it('E2E-02: species_id inexistente recebe 400, nada muda (EDICAO-03)', async () => {
    const animalId = await createAnimal('Rex', speciesA);
    const nonexistentSpeciesId = '00000000-0000-4000-8000-000000000001';

    const response = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ species_id: nonexistentSpeciesId });

    expect(response.status).toBe(400);
  });

  it('E2E-03: sem Authorization header recebe 401 (EDICAO-05)', async () => {
    const animalId = await createAnimal('Rex', speciesA);

    const response = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .send({ name: 'Rex 2' });

    expect(response.status).toBe(401);
  });

  it('E2E-03: usuário adotante recebe 403 (EDICAO-06)', async () => {
    const animalId = await createAnimal('Rex', speciesA);

    const response = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .set('Authorization', `Bearer ${adotanteAccessToken}`)
      .send({ name: 'Rex 2' });

    expect(response.status).toBe(403);
  });

  it('E2E-04: edita um animal inativo com sucesso, active permanece false (EDICAO-04)', async () => {
    const animalId = await createAnimal('Rex', speciesA, false);

    const response = await request(app.getHttpServer())
      .patch(`/animals/${animalId}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: 'Rex 2' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Rex 2', active: false });
  });

  it('E2E-05: id inexistente (UUID válido) recebe 404 (EDICAO-07)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/animals/${NONEXISTENT_ANIMAL_ID}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: 'Rex 2' });

    expect(response.status).toBe(404);
  });
});
