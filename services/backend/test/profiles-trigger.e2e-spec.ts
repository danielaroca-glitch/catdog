import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { AppModule } from '../src/app.module';
import { SUPABASE_CLIENT } from '../src/supabase/supabase.provider';

/**
 * Integration test for T4 (migration): verifica que o trigger `on_auth_user_created`
 * cria automaticamente uma linha em `profiles` com role 'adotante' (RN-01) sempre
 * que um usuário é criado via Supabase Auth admin API.
 *
 * Roda contra o projeto Supabase real (via SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY do .env).
 * Cria e remove seu próprio usuário de teste — não deixa dados residuais.
 */
describe('profiles trigger (e2e)', () => {
  let moduleRef: TestingModule;
  let supabase: SupabaseClient;
  let createdUserId: string | undefined;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    supabase = moduleRef.get<SupabaseClient>(SUPABASE_CLIENT);
  });

  afterEach(async () => {
    if (createdUserId) {
      await supabase.auth.admin.deleteUser(createdUserId);
      createdUserId = undefined;
    }
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates a profiles row with role "adotante" when a new user signs up (RN-01)', async () => {
    const email = `catdog-e2e-${Date.now()}@example.com`;

    // Senha de fixture para uma conta de teste descartável (criada e removida
    // neste mesmo teste, ver afterEach) — não é uma credencial real. Aceito
    // como achado do Sonar (S2068) na revisão de fechamento da PBI, sem
    // necessidade de externalizar para env var.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    createdUserId = data.user!.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', createdUserId)
      .single();

    expect(profileError).toBeNull();
    expect(profile?.role).toBe('adotante');
  });
});
