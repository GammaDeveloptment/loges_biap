import { IsIn, IsOptional, IsString } from 'class-validator';
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
}
