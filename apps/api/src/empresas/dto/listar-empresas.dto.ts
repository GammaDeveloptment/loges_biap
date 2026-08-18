import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ESTADOS_EMPRESA, NIVELES_CONFIANZA, ROLES_EMPRESA, type EstadoEmpresa, type NivelConfianza, type RolEmpresa } from '@loges-biap/shared-types';

// Documento 010, seccion 4.1.
export class ListarEmpresasDto {
  @IsOptional()
  @IsIn(ROLES_EMPRESA)
  rol?: RolEmpresa;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  pais?: string;

  @IsOptional()
  @IsIn(NIVELES_CONFIANZA)
  nivelConfianza?: NivelConfianza;

  @IsOptional()
  @IsIn(ESTADOS_EMPRESA)
  estado?: EstadoEmpresa;

  @IsOptional()
  @IsString()
  cursor?: string;

  // Documento 010, seccion 6: paginacion por cursor con `limite` configurable
  // (antes estaba fijo en 50 en el service, sin que el consumidor pudiera
  // pedir menos/mas dentro de un tope razonable).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
