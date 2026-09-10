import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SpeciesService } from './species.service';

@Module({
  imports: [SupabaseModule],
  providers: [SpeciesService],
  exports: [SpeciesService],
})
export class SpeciesModule {}
