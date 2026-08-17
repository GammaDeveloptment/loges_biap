import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AgentesController } from './agentes.controller';
import { AgentesService, COLA_AGENTES } from './agentes.service';
import { AgentesProcessor } from './agentes.processor';
import { DescubrimientoCargadoresHandler } from './handlers/descubrimiento-cargadores.handler';
import { EnriquecimientoProveedoresHandler } from './handlers/enriquecimiento-proveedores.handler';
import { MonitoreoCompetidoresHandler } from './handlers/monitoreo-competidores.handler';
import { ConectorSimuladoCargadores } from '../conectores/conector-simulado-cargadores';
import { ConectorSimuladoProveedores } from '../conectores/conector-simulado-proveedores';
import { ConectorSimuladoCompetidores } from '../conectores/conector-simulado-competidores';

@Module({
  imports: [BullModule.registerQueue({ name: COLA_AGENTES })],
  controllers: [AgentesController],
  providers: [
    AgentesService,
    AgentesProcessor,
    DescubrimientoCargadoresHandler,
    EnriquecimientoProveedoresHandler,
    MonitoreoCompetidoresHandler,
    ConectorSimuladoCargadores,
    ConectorSimuladoProveedores,
    ConectorSimuladoCompetidores,
  ],
})
export class AgentesModule {}
