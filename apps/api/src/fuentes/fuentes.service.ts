import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/api-exception';
import { CrearFuenteDto } from './dto/crear-fuente.dto';
import { ActualizarFuenteDto } from './dto/actualizar-fuente.dto';

@Injectable()
export class FuentesService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.fuente.findMany({ orderBy: { fechaAlta: 'desc' } });
  }

  crear(dto: CrearFuenteDto) {
    // Documento 012-B: toda fuente nace sin aprobar - la aprobacion es un
    // paso posterior y explicito (PATCH), nunca parte del alta.
    return this.prisma.fuente.create({
      data: {
        ...dto,
        activa: false,
        terminosUsoVerificados: false,
      },
    });
  }

  async actualizar(id: string, dto: ActualizarFuenteDto) {
    const fuente = await this.prisma.fuente.findUnique({ where: { id } });
    if (!fuente) {
      throw new ApiException(
        'FUENTE_NO_ENCONTRADA',
        'No existe una fuente con el id solicitado.',
        HttpStatus.NOT_FOUND,
      );
    }

    const terminosVerificados = dto.terminosUsoVerificados ?? fuente.terminosUsoVerificados;
    const seActivara = dto.activa ?? fuente.activa;

    // Documento 012, seccion 4, regla dura de arquitectura: ningun conector
    // se activa sin terminos_uso_verificados = true. No basta con avisarlo
    // en la UI - el backend debe rechazarlo aunque alguien lo intente igual.
    if (seActivara && !terminosVerificados) {
      throw new ApiException(
        'FUENTE_TERMINOS_NO_VERIFICADOS',
        'No se puede activar una fuente sin terminos_uso_verificados = true (Documento 012, seccion 4; Documento 012-B).',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.fuente.update({
      where: { id },
      data: {
        ...dto,
        fechaAprobacionLegal: dto.fechaAprobacionLegal
          ? new Date(dto.fechaAprobacionLegal)
          : undefined,
      },
    });
  }
}
