import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { COLA_AGENTES } from './agentes.service';

interface DatosJobAgente {
  ejecucionId: string;
}

// Esqueleto del Motor de Agentes (Documento 007, Entrega 1): ejecuta el
// ciclo de vida completo de una tarea (Documento 009, seccion 3) sin
// razonamiento real todavia - eso se conecta en la Entrega 4, cuando el
// Proveedor de Razonamiento (Documento 009, seccion 1) quede detras de esta
// misma pieza de orquestacion, sin cambiar el contrato de ejecucion_agente.
@Processor(COLA_AGENTES, { concurrency: 5 })
export class AgentesProcessor extends WorkerHost {
  private readonly logger = new Logger(AgentesProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<DatosJobAgente>): Promise<void> {
    const { ejecucionId } = job.data;

    await this.prisma.ejecucionAgente.update({
      where: { id: ejecucionId },
      data: { estado: 'en_progreso' },
    });

    this.logger.log(
      `Ejecucion ${ejecucionId} (${job.name}) en progreso - esqueleto sin logica de negocio (Entrega 1).`,
    );

    // Placeholder deliberado: aqui es donde la Entrega 4 conectara al
    // Proveedor de Razonamiento (Documento 009) segun job.name (tipo_tarea).

    await this.prisma.ejecucionAgente.update({
      where: { id: ejecucionId },
      data: {
        estado: 'completado',
        resultadoResumen:
          'Tarea de esqueleto ejecutada sin logica de negocio real (Documento 007, Entrega 1).',
        fechaFin: new Date(),
      },
    });
  }
}
