import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AgentesController } from './agentes.controller';
import { AgentesService, COLA_AGENTES } from './agentes.service';
import { AgentesProcessor } from './agentes.processor';
import { DescubrimientoCargadoresHandler } from './handlers/descubrimiento-cargadores.handler';
import { ConectorSimuladoCargadores } from '../conectores/conector-simulado-cargadores';

@Module({
  imports: [BullModule.registerQueue({ name: COLA_AGENTES })],
  controllers: [AgentesController],
  providers: [
    AgentesService,
    AgentesProcessor,
    DescubrimientoCargadoresHandler,
    ConectorSimuladoCargadores,
  ],
})
export class AgentesModule {}
