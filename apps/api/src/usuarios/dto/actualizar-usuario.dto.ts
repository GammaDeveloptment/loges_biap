import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { AREAS_USUARIO, type AreaUsuario } from '@loges-biap/shared-types';

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsIn(AREAS_USUARIO)
  area?: AreaUsuario;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
