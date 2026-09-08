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

// Senha de fixture para contas de teste descartáveis (criadas e removidas
// nestes mesmos testes) — não é uma credencial real. Mesmo padrão aceito em
// `profiles-trigger.e2e-spec.ts`.
const TEST_PASSWORD = 'TestPassword123!';

/**
 * Integration test for T4: POST /auth/login.
 *
 * Roda contra o projeto Supabase real (via SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
 * do .env), mesmo padrão de `auth-register.e2e-spec.ts`. Cria e remove seus
 * próprios usuários de teste — não deixa dados residuais (delete envolvido em
 * try/catch para não interromper a limpeza dos demais em caso de falha
 * isolada, lição da review desta feature).
 *
 * Cobre os cenários e2e de `spec.md`:
 * - E2E-01 (LOGIN-01): fluxo feliz — 200/201, access_token + refresh_token.
 * - E2E-02 (LOGIN-02): e-mail não confirmado — 403, code 'email_not_confirmed'.
 * - E2E-03 (LOGIN-04): credenciais inválidas — 401 genérico.
 *
 * O cenário de rate limit (E2E-06, LOGIN-08) fica num `describe` à parte
 * dentro deste mesmo arquivo, com sua PRÓPRIA instância de `TestingModule` —
 * o `ThrottlerModule` cria seu storage em memória por instância de módulo, e
 * isolar o describe evita que as 3 chamadas dos testes funcionais acima
 * contem para a quota de 5/min usada pelo teste de 429 (mesmo racional de por
 * que `auth-register-rate-limit.e2e-spec.ts` é um arquivo próprio).
 */
describe('POST /auth/login (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    supabase = moduleRef.get<SupabaseClient>(SUPABASE_CLIENT);
  });

  afterEach(async () => {
    while (createdUserIds.length > 0) {
      const userId = createdUserIds.pop();
      if (userId) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch {
          // Não interrompe a limpeza dos demais usuários criados no teste.
        }
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('E2E-01: login com conta confirmada retorna access_token e refresh_token (LOGIN-01)', async () => {
    const email = `catdog-e2e-t4-login-${Date.now()}@example.com`;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    expect(error).toBeNull();
    createdUserIds.push(data.user!.id);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: TEST_PASSWORD });

    const body = response.body as AuthenticatedSessionResponse;

    expect([200, 201]).toContain(response.status);
    expect(body.access_token).toEqual(expect.any(String));
    expect(body.refresh_token).toEqual(expect.any(String));
  });

  it('E2E-02: login com e-mail não confirmado é bloqueado com código de reenvio (LOGIN-02)', async () => {
    const email = `catdog-e2e-t4-login-${Date.now()}@example.com`;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: false,
    });
    expect(error).toBeNull();
    createdUserIds.push(data.user!.id);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: TEST_PASSWORD });

    expect(response.status).toBe(403);
    expect((response.body as { code?: string }).code).toBe(
      'email_not_confirmed',
    );
  });

  it('E2E-03: credenciais inválidas retornam erro genérico sem indicar o campo (LOGIN-04)', async () => {
    const email = `catdog-e2e-t4-login-${Date.now()}@example.com`;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    expect(error).toBeNull();
    createdUserIds.push(data.user!.id);

    // Senha errada (usuário existe) e e-mail inexistente (usuário não existe)
    // são duas causas de falha bem diferentes. LOGIN-04 exige que nenhuma das
    // duas revele qual campo está errado — a forma mais direta de comprovar
    // isso é checar que ambas produzem exatamente a mesma resposta genérica.
    const wrongPasswordResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: 'senhaErrada123' });

    const nonExistentEmailResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `catdog-e2e-t4-login-inexistente-${Date.now()}@example.com`,
        senha: TEST_PASSWORD,
      });

    expect(wrongPasswordResponse.status).toBe(401);
    expect(nonExistentEmailResponse.status).toBe(401);
    expect(wrongPasswordResponse.body).toEqual(nonExistentEmailResponse.body);
  });
});

describe('POST /auth/login - rate limit (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('E2E-06: retorna 429 na 6ª tentativa de login em menos de 60s (LOGIN-08)', async () => {
    const attempts = 6;
    const statuses: number[] = [];

    for (let i = 0; i < attempts; i++) {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `catdog-e2e-t4-ratelimit-${Date.now()}-${i}@example.com`,
          senha: 'qualquerSenha123',
        });

      statuses.push(response.status);
    }

    expect(statuses[statuses.length - 1]).toBe(429);
  }, 30000);
});
