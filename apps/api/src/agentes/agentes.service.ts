import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Prisma } from '@prisma/client';
import { puedeDispararTarea, type AreaUsuario } from '@loges-biap/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { CrearEjecucionDto } from './dto/crear-ejecucion.dto';
import { ListarEjecucionesDto } from './dto/listar-ejecuciones.dto';

export const COLA_AGENTES = 'agentes';

@Injectable()
export class AgentesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(COLA_AGENTES) private readonly cola: Queue,
  ) {}

  listar(filtro: ListarEjecucionesDto) {
    return this.prisma.ejecucionAgente.findMany({
      where: {
        estado: filtro.estado,
        tipoTarea: filtro.tipoTarea,
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  // Documento 009, seccion 3 (Ciclo de Vida de una Tarea), paso 1:
  // planificacion. Aqui solo se registra y encola - la ejecucion real
  // (pasos 2-6) vive en AgentesProcessor.
  async dispararManual(dto: CrearEjecucionDto, areaSolicitante: AreaUsuario) {
    if (!puedeDispararTarea(areaSolicitante, dto.tipoTarea)) {
      throw new ForbiddenException(
        `El area '${areaSolicitante}' no puede disparar tareas de tipo '${dto.tipoTarea}' (Documento 011, seccion 3).`,
      );
    }

    const ejecucion = await this.prisma.ejecucionAgente.create({
      data: {
        tipoTarea: dto.tipoTarea,
        criterios: (dto.criterios ?? {}) as Prisma.InputJsonValue,
        estado: 'pendiente',
      },
    });

    const job = await this.cola.add(dto.tipoTarea, {
      ejecucionId: ejecucion.id,
    });

    return this.prisma.ejecucionAgente.update({
      where: { id: ejecucion.id },
      data: { colaJobId: job.id },
    });
  }
}
