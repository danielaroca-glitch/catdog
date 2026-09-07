import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Configuração compartilhada entre o bootstrap real (`main.ts`) e os testes
 * e2e (ver `test/cors.e2e-spec.ts`), para que o teste exercite exatamente o
 * mesmo setup usado em produção, não uma reimplementação paralela.
 *
 * Vive em seu próprio módulo (não em `main.ts`) porque `main.ts` chama
 * `bootstrap()` como efeito colateral no escopo do módulo — importar algo
 * dele para um teste executaria esse `bootstrap()` também, subindo um
 * segundo servidor real e colidindo de porta (`EADDRINUSE`).
 *
 * Achado #1 (critical) de `review.md` rodada 1: sem `enableCors()`, nenhum
 * navegador real consegue completar o cadastro — o frontend chama esta API
 * de uma origem diferente (Next.js em outra porta), e o navegador bloqueia
 * a resposta sem o header `Access-Control-Allow-Origin` correto.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });
}
