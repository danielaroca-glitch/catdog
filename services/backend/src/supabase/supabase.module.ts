import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { supabaseClientProvider, SUPABASE_CLIENT } from './supabase.provider';

@Module({
  imports: [ConfigModule],
  providers: [supabaseClientProvider],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
