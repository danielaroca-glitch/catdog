import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateAnimalDto } from './dto/create-animal.dto';
import {
  Animal,
  CreateAnimalUseCase,
} from './use-cases/create-animal.use-case';

/**
 * POST /animals (ALTA-01..05) — admin-only, mesmo padrão de guards de
 * `AdminController`: `@Roles('admin')` na classe (fail-closed para
 * handlers futuros deste controller, ver lição em `.makuco/STATE.md`) e
 * `@Throttle` genérico (mesmo racional de amplificação de DoS via
 * `JwtAuthGuard`/`getClaims`, já aplicado em `/auth/me` e `/admin/ping`).
 */
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Roles('admin')
@Controller('animals')
export class AnimalsController {
  constructor(private readonly createAnimalUseCase: CreateAnimalUseCase) {}

  @Post()
  async create(@Body() dto: CreateAnimalDto): Promise<Animal> {
    return this.createAnimalUseCase.execute(dto);
  }
}
