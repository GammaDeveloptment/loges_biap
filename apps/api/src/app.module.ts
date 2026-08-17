import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AgentesModule } from './agentes/agentes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Motor de Agentes (Documento 004, seccion 5; Documento 009): BullMQ
    // sobre Redis, gestionado externo o interno segun la red lo permita
    // (Documento 004, seccion 5) - configurable via REDIS_URL.
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URL'),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    AgentesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
