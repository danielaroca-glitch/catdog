import { AdminController } from './admin.controller';

/**
 * Unit test do handler puro de `GET /admin/ping` (T6). A cobertura de
 * autorização (401/403/200 conforme token e papel — AUTZ-02, AUTZ-03,
 * AUTZ-06) é do `admin-ping.e2e-spec.ts`, que exercita `JwtAuthGuard` e
 * `RolesGuard` de verdade via HTTP; este teste só garante que o handler, uma
 * vez alcançado, retorna o corpo esperado.
 *
 * Instanciado diretamente (`new AdminController()`, sem `TestingModule`):
 * o controller não tem nenhuma dependência própria injetada — só decorators
 * de classe (`@UseGuards`). Passar por um `TestingModule` obrigaria a
 * resolver a árvore de dependências dos guards (`ConfigService`,
 * `ProfileRoleLookup`) só para compilar o módulo, mesmo elas nunca sendo
 * exercitadas por uma chamada direta ao método — essa é exatamente a
 * cobertura que o e2e já faz de ponta a ponta.
 */
describe('AdminController', () => {
  describe('ping', () => {
    it('retorna { ok: true }', () => {
      const adminController = new AdminController();

      expect(adminController.ping()).toEqual({ ok: true });
    });
  });
});
