import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

// Documento 010, seccion 4.3 (activar/desactivar) + Documento 012-B, seccion
// 6 (gobernanza de aprobacion): estos campos son, juntos, el registro de que
// una persona designada por Gammacargo, con respaldo legal, aprobo la fuente.
export class ActualizarFuenteDto {
  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsBoolean()
  terminosUsoVerificados?: boolean;

  @IsOptional()
  @IsString()
  aprobadoPor?: string;

  @IsOptional()
  @IsDateString()
  fechaAprobacionLegal?: string;

  @IsOptional()
  @IsString()
  referenciaLegal?: string;
}
