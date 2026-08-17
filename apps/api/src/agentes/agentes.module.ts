import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AgentesController } from './agentes.controller';
import { AgentesService, COLA_AGENTES } from './agentes.service';
import { AgentesProcessor } from './agentes.processor';

@Module({
  imports: [BullModule.registerQueue({ name: COLA_AGENTES })],
  controllers: [AgentesController],
  providers: [AgentesService, AgentesProcessor],
})
export class AgentesModule {}
