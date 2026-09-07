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
/**
 * [DECISÃO] Achado #1 (major) de `review.md` Rodada de revisão 2: o
 * `ThrottlerGuard` (ver `app.module.ts`/`auth.controller.ts`) identifica o
 * cliente por `req.ip`. Sem `app.set('trust proxy', ...)`, o Express ignora
 * `X-Forwarded-For` e resolve `req.ip` sempre a partir do socket da conexão
 * direta — correto para o cenário atual do projeto (dev local, sem nenhuma
 * topologia de deploy definida) e comprovado por
 * `test/trust-proxy.e2e-spec.ts`.
 *
 * `trust proxy` NÃO é configurado aqui de propósito: ligá-lo sem saber o
 * número real de hops confiáveis abriria o rate limit a bypass via
 * `X-Forwarded-For` forjado. Esta decisão está registrada em
 * `.makuco/STATE.md` e deve ser revisitada assim que uma topologia de
 * deploy real (reverse proxy/load balancer) for definida numa PBI futura de
 * infraestrutura — nesse momento, configurar o número exato de hops
 * confiáveis, nunca `true` genérico.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });
}
