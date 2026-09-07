import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SUPABASE_CLIENT } from '../src/supabase/supabase.provider';

interface RegisteredUserResponse {
  id: string;
  email: string;
  role: string;
}

/**
 * Integration test for T7: POST /auth/register.
 *
 * Roda contra o projeto Supabase real (via SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
 * do .env), igual a `profiles-trigger.e2e-spec.ts`. Cria e remove seus próprios
 * usuários de teste — não deixa dados residuais.
 *
 * Cobre os cenários e2e de `spec.md`:
 * - E2E-01 (REG-02, REG-03, REG-04): fluxo feliz — 201, papel `adotante`.
 * - E2E-02 (REG-01): senha e confirmação diferentes — 400.
 * - E2E-03 (REG-05): e-mail duplicado — 409, mensagem genérica.
 */
describe('POST /auth/register (e2e)', () => {
  let app: INestApplication<App>;
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    supabase = moduleRef.get<SupabaseClient>(SUPABASE_CLIENT);
  });

  afterEach(async () => {
    while (createdUserIds.length > 0) {
      const userId = createdUserIds.pop();
      if (userId) {
        await supabase.auth.admin.deleteUser(userId);
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  function validPayload(email: string) {
    return {
      nome: 'Daniela Roca',
      email,
      senha: 'senhaForte123',
      confirmarSenha: 'senhaForte123',
    };
  }

  it('E2E-01: registra com sucesso e retorna papel adotante (REG-02, REG-03, REG-04)', async () => {
    const email = `catdog-e2e-t7-${Date.now()}@example.com`;

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validPayload(email));

    const body = response.body as RegisteredUserResponse;

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      email,
      role: 'adotante',
    });
    expect(body.id).toEqual(expect.any(String));
    createdUserIds.push(body.id);

    // REG-03/REG-04: usuário criado via admin.createUser com email_confirm:
    // false dispara o e-mail de confirmação nativo do Supabase e mantém a
    // conta não confirmada até o link ser acessado.
    const { data: userData } = await supabase.auth.admin.getUserById(body.id);
    expect(userData.user?.email_confirmed_at).toBeFalsy();
  });

  it('E2E-02: rejeita com 400 quando senha e confirmação divergem (REG-01)', async () => {
    const email = `catdog-e2e-t7-${Date.now()}@example.com`;

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        ...validPayload(email),
        confirmarSenha: 'outraSenha123',
      });

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).toMatch(/confirma/i);
  });

  it('E2E-03: rejeita com 409 e mensagem genérica quando o e-mail já está cadastrado (REG-05)', async () => {
    const email = `catdog-e2e-t7-${Date.now()}@example.com`;

    const first = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validPayload(email));

    const firstBody = first.body as RegisteredUserResponse;
    expect(first.status).toBe(201);
    createdUserIds.push(firstBody.id);

    const second = await request(app.getHttpServer())
      .post('/auth/register')
      .send(validPayload(email));

    expect(second.status).toBe(409);
    const message = JSON.stringify(second.body).toLowerCase();
    // REG-05: a mensagem não deve revelar se a conta existente já foi confirmada.
    expect(message).not.toMatch(/confirm/i);
    expect(message.length).toBeGreaterThan(0);
  });
});
