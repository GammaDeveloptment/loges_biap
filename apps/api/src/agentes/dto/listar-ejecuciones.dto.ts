import { IsIn, IsOptional } from 'class-validator';
import {
  ESTADOS_EJECUCION_AGENTE,
  TIPOS_TAREA_AGENTE,
  type EstadoEjecucionAgente,
  type TipoTareaAgente,
} from '@loges-biap/shared-types';

// Documento 010, seccion 4.4: GET /ejecuciones-agente, filtrable.
export class ListarEjecucionesDto {
  @IsOptional()
  @IsIn(ESTADOS_EJECUCION_AGENTE)
  estado?: EstadoEjecucionAgente;

  @IsOptional()
  @IsIn(TIPOS_TAREA_AGENTE)
  tipoTarea?: TipoTareaAgente;
}
