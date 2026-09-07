import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

/**
 * Integration test for T11.
 *
 * Achado #1 (critical) de `review.md` rodada 1: sem `app.enableCors()`, nenhum
 * navegador real consegue completar o cadastro, apesar de todos os testes
 * automatizados passarem — Supertest e fetch mockado não passam pela política
 * de CORS do navegador. Este teste aplica a mesma configuração de `main.ts`
 * (via `configureApp`) à aplicação de teste e comprova que a resposta HTTP
 * inclui o header `Access-Control-Allow-Origin` com a origem do frontend.
 */
describe('CORS (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('inclui Access-Control-Allow-Origin com a origem do frontend (FRONTEND_URL)', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });
});
