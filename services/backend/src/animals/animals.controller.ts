import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import {
  Animal,
  CreateAnimalUseCase,
} from './use-cases/create-animal.use-case';
import { ListAnimalsUseCase } from './use-cases/list-animals.use-case';
import { UpdateAnimalUseCase } from './use-cases/update-animal.use-case';

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
  constructor(
    private readonly createAnimalUseCase: CreateAnimalUseCase,
    private readonly updateAnimalUseCase: UpdateAnimalUseCase,
    private readonly listAnimalsUseCase: ListAnimalsUseCase,
  ) {}

  @Get()
  async list(): Promise<Animal[]> {
    return this.listAnimalsUseCase.execute();
  }

  @Post()
  async create(@Body() dto: CreateAnimalDto): Promise<Animal> {
    return this.createAnimalUseCase.execute(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnimalDto,
  ): Promise<Animal> {
    return this.updateAnimalUseCase.execute(id, dto);
  }
}
