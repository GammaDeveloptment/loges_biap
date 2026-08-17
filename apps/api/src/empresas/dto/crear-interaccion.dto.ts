import { IsIn, IsOptional, IsString } from 'class-validator';
import { TIPOS_ACCION_INTERACCION, type TipoAccionInteraccion } from '@loges-biap/shared-types';

// Documento 010, seccion 4.1: POST /empresas/{id}/interacciones.
export class CrearInteraccionDto {
  @IsIn(TIPOS_ACCION_INTERACCION)
  tipoAccion!: TipoAccionInteraccion;

  @IsOptional()
  @IsString()
  comentario?: string;
}
