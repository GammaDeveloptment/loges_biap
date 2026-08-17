import { IsIn, IsObject, IsOptional } from 'class-validator';
import { TIPOS_TAREA_AGENTE, type TipoTareaAgente } from '@loges-biap/shared-types';

// Documento 010, seccion 4.4: disparo manual de una tarea de agente.
export class CrearEjecucionDto {
  @IsIn(TIPOS_TAREA_AGENTE)
  tipoTarea!: TipoTareaAgente;

  @IsOptional()
  @IsObject()
  criterios?: Record<string, unknown>;
}
