import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Registrado globalmente para disponibilizar o ThrottlerGuard e seu
    // storage, mas o guard NÃO é aplicado como APP_GUARD global — é
    // aplicado pontualmente via @UseGuards no(s) endpoint(s) que
    // precisarem (ver AuthController#register), para não impactar
    // endpoints futuros com necessidades de limite diferentes.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 5,
      },
    ]),
    SupabaseModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
