import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthController } from './auth.controller';
import { RegisterUseCase } from './use-cases/register.use-case';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController],
  providers: [RegisterUseCase],
})
export class AuthModule {}
