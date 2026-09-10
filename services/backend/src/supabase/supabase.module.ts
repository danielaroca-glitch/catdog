import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  supabaseClientProvider,
  supabaseAuthClientFactoryProvider,
  SUPABASE_CLIENT,
  SUPABASE_AUTH_CLIENT_FACTORY,
} from './supabase.provider';

@Module({
  imports: [ConfigModule],
  providers: [supabaseClientProvider, supabaseAuthClientFactoryProvider],
  exports: [SUPABASE_CLIENT, SUPABASE_AUTH_CLIENT_FACTORY],
})
export class SupabaseModule {}
