import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { SpeciesModule } from '../species/species.module';
import { AnimalsController } from './animals.controller';
import { CreateAnimalUseCase } from './use-cases/create-animal.use-case';

/**
 * `RolesGuard` (`@UseGuards` em `AnimalsController`) depende de
 * `ProfileRoleLookup`, agora exportado por `AuthModule` — importa o módulo
 * inteiro em vez de duplicar a instância (ao contrário de `AdminModule`,
 * criado antes de `AuthModule` exportá-lo; ver achado minor documentado em
 * `pbi-003`).
 */
@Module({
  imports: [SupabaseModule, SpeciesModule, AuthModule],
  controllers: [AnimalsController],
  providers: [CreateAnimalUseCase],
})
export class AnimalsModule {}
