import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AgentesController } from './agentes.controller';
import { AgentesService, COLA_AGENTES } from './agentes.service';
import { AgentesProcessor } from './agentes.processor';
import { DescubrimientoCargadoresHandler } from './handlers/descubrimiento-cargadores.handler';
import { EnriquecimientoProveedoresHandler } from './handlers/enriquecimiento-proveedores.handler';
import { MonitoreoCompetidoresHandler } from './handlers/monitoreo-competidores.handler';
import { ConectorSimuladoCargadores } from '../conectores/conector-simulado-cargadores';
import { ConectorRealPadronRucPeru } from '../conectores/conector-real-padron-ruc-peru';
import { ConectorSimuladoCargadoresSecundario } from '../conectores/conector-simulado-cargadores-secundario';
import { ConectorSimuladoProveedores } from '../conectores/conector-simulado-proveedores';
import { ConectorSimuladoCompetidores } from '../conectores/conector-simulado-competidores';
import { RazonamientoModule } from '../razonamiento/razonamiento.module';

@Module({
  imports: [BullModule.registerQueue({ name: COLA_AGENTES }), RazonamientoModule],
  controllers: [AgentesController],
  providers: [
    AgentesService,
    AgentesProcessor,
    DescubrimientoCargadoresHandler,
    EnriquecimientoProveedoresHandler,
    MonitoreoCompetidoresHandler,
    ConectorSimuladoCargadores,
    ConectorRealPadronRucPeru,
    ConectorSimuladoCargadoresSecundario,
    ConectorSimuladoProveedores,
    ConectorSimuladoCompetidores,
  ],
})
export class AgentesModule {}
