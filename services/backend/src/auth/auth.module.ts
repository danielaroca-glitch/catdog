import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthController } from './auth.controller';
import { ProfileRoleLookup } from './profile-role.lookup';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshUseCase } from './use-cases/refresh.use-case';
import { RegisterUseCase } from './use-cases/register.use-case';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [ProfileRoleLookup, RegisterUseCase, LoginUseCase, RefreshUseCase],
  exports: [ProfileRoleLookup],
})
export class AuthModule {}
