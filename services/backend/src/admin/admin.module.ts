import { Module } from '@nestjs/common';
import { ProfileRoleLookup } from '../auth/profile-role.lookup';
import { SupabaseModule } from '../supabase/supabase.module';
import { AdminController } from './admin.controller';

/**
 * Módulo do endpoint admin-only de demonstração (T6). `RolesGuard`
 * (`@UseGuards` em `AdminController`) depende de `ProfileRoleLookup`, que
 * `AuthModule` não exporta — por isso é registrado aqui como provider
 * próprio deste módulo (mesma classe stateless de `../auth/profile-role.lookup`,
 * uma segunda instância independente, consultando `profiles` via o singleton
 * `SUPABASE_CLIENT` de `SupabaseModule`), em vez de importar `AuthModule`
 * inteiro só por essa dependência transitiva.
 */
@Module({
  imports: [SupabaseModule],
  controllers: [AdminController],
  providers: [ProfileRoleLookup],
})
export class AdminModule {}
