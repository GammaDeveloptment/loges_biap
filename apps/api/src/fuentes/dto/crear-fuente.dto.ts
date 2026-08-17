import { IsIn, IsOptional, IsString, IsUrl } from 'class-validator';
import { NIVELES_CONFIANZA, TIPOS_FUENTE, type NivelConfianza, type TipoFuente } from '@loges-biap/shared-types';

// Documento 012-B, seccion 4 (plantilla de registro): una fuente candidata
// se registra ANTES de que tenga aprobacion legal - por eso activa y
// terminosUsoVerificados nunca vienen en este DTO, siempre nacen en false
// (Documento 012, seccion 4: ningun conector pasa de "construido" a "activo"
// sin esa bandera).
export class CrearFuenteDto {
  @IsString()
  nombre!: string;

  @IsIn(TIPOS_FUENTE)
  tipo!: TipoFuente;

  @IsString()
  pais!: string;

  @IsOptional()
  @IsUrl()
  urlBase?: string;

  @IsIn(NIVELES_CONFIANZA)
  nivelConfianzaBase!: NivelConfianza;
}
