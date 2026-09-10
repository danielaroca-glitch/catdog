import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { SpeciesController } from './species.controller';
import { SpeciesService } from './species.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [SpeciesController],
  providers: [SpeciesService],
  exports: [SpeciesService],
})
export class SpeciesModule {}
