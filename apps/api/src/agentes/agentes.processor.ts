import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { COLA_AGENTES } from './agentes.service';
import { DescubrimientoCargadoresHandler } from './handlers/descubrimiento-cargadores.handler';

interface DatosJobAgente {
  ejecucionId: string;
}

// Motor de Agentes (Documento 009, seccion 3: ciclo de vida completo de una
// tarea). Cada tipo_tarea tiene su propio handler (Documento 009, seccion 2);
// el que todavia no tiene logica real conectada sigue devolviendo el
// resultado de esqueleto de la Entrega 1, sin romper el contrato.
@Processor(COLA_AGENTES, { concurrency: 5 })
export class AgentesProcessor extends WorkerHost {
  private readonly logger = new Logger(AgentesProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly descubrimientoCargadores: DescubrimientoCargadoresHandler,
  ) {
    super();
  }

  async process(job: Job<DatosJobAgente>): Promise<void> {
    const { ejecucionId } = job.data;

    await this.prisma.ejecucionAgente.update({
      where: { id: ejecucionId },
      data: { estado: 'en_progreso' },
    });

    try {
      const resultadoResumen = await this.ejecutarPorTipo(job, ejecucionId);
      await this.prisma.ejecucionAgente.update({
        where: { id: ejecucionId },
        data: { estado: 'completado', resultadoResumen, fechaFin: new Date() },
      });
    } catch (error) {
      // Documento 009, seccion 7: un fallo se registra explicitamente, nunca
      // en silencio ni tolerado como si hubiera funcionado.
      this.logger.error(`Ejecucion ${ejecucionId} (${job.name}) fallo`, error);
      await this.prisma.ejecucionAgente.update({
        where: { id: ejecucionId },
        data: {
          estado: 'fallido',
          resultadoResumen: error instanceof Error ? error.message : 'Error desconocido',
          fechaFin: new Date(),
        },
      });
    }
  }

  private async ejecutarPorTipo(job: Job<DatosJobAgente>, ejecucionId: string): Promise<string> {
    const ejecucion = await this.prisma.ejecucionAgente.findUniqueOrThrow({
      where: { id: ejecucionId },
    });
    const criterios = (ejecucion.criterios ?? {}) as { sector?: string; pais?: string };

    switch (job.name) {
      case 'descubrimiento_cargador':
        return this.descubrimientoCargadores.ejecutar(ejecucionId, criterios);
      default:
        // Enriquecimiento de proveedores, monitoreo de competidores y
        // actualizacion de tendencias siguen como esqueleto (Entrega 3/6).
        this.logger.log(`Ejecucion ${ejecucionId} (${job.name}) - esqueleto sin logica real todavia.`);
        return 'Tarea de esqueleto ejecutada sin logica de negocio real (Documento 007, entregas siguientes).';
    }
  }
}
