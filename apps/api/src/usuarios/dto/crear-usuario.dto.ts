import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { AREAS_USUARIO, type AreaUsuario } from '@loges-biap/shared-types';

export class CrearUsuarioDto {
  @IsString()
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(AREAS_USUARIO)
  area!: AreaUsuario;
}
