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

const TEST_PASSWORD = 'TestPassword123!';

/**
 * Integration test for T3: GET /animals (EDICAO-10, gap confirmado com o
 * usuário). Mesmo padrão de `animals-create.e2e-spec.ts`.
 */
describe('GET /animals (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  let adminUserId: string;
  let adminAccessToken: string;
  let createdAnimalId: string;

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

    const adminEmail = `catdog-e2e-t3-list-admin-${Date.now()}@example.com`;
    const { data: adminData, error: adminError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (adminError || !adminData.user) {
      throw new Error(
        `Falha ao criar usuário admin de teste para animals-list.e2e-spec: ${adminError?.message}`,
      );
    }
    adminUserId = adminData.user.id;

    const { error: promoteError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', adminUserId);
    if (promoteError) {
      throw new Error(
        `Falha ao promover usuário de teste a admin em animals-list.e2e-spec: ${promoteError.message}`,
      );
    }

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, senha: TEST_PASSWORD });
    adminAccessToken = (adminLoginResponse.body as AuthenticatedSessionResponse)
      .access_token;

    const createResponse = await request(app.getHttpServer())
      .post('/animals')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: 'Rex-list-e2e', species_id: speciesResult.data.id });
    createdAnimalId = (createResponse.body as { id: string }).id;
  });

  afterAll(async () => {
    try {
      await supabase.auth.admin.deleteUser(adminUserId);
    } catch {
      // Não interrompe o encerramento da suíte por uma falha isolada de delete.
    }
    await app.close();
  });

  it('E2E-06: admin recebe a lista de animais, incluindo o recém-criado (EDICAO-10)', async () => {
    const response = await request(app.getHttpServer())
      .get('/animals')
      .set('Authorization', `Bearer ${adminAccessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    const ids = (response.body as { id: string }[]).map((animal) => animal.id);
    expect(ids).toContain(createdAnimalId);
  });
});
