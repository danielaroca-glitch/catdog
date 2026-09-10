import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SpeciesOption, SpeciesService } from './species.service';

/**
 * GET /species — lista {id, name} para o seletor de espécie do formulário de
 * cadastro de animal (T6 do pbi-001-alta-de-animal). Admin-only por ora,
 * mesmo padrão de guards de `AnimalsController`/`AdminController` — nenhum
 * endpoint público expõe espécies ainda (isso é escopo do módulo futuro
 * "Lista pública de animais disponíveis").
 */
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Roles('admin')
@Controller('species')
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @Get()
  async list(): Promise<SpeciesOption[]> {
    return this.speciesService.list();
  }
}
