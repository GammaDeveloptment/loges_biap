import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Areas } from '../auth/decorators/areas.decorator';
import { FuentesService } from './fuentes.service';
import { CrearFuenteDto } from './dto/crear-fuente.dto';
import { ActualizarFuenteDto } from './dto/actualizar-fuente.dto';

// Documento 010, seccion 4.3 (+ alta de fuente, gap cubierto en esta
// implementacion - ver Documento 010 seccion 4.3 nota de version). Solo
// Administrador (Documento 011, seccion 3) - nunca el equipo de desarrollo
// aprueba una fuente por su cuenta (Documento 012-B, seccion 6).
@Controller('fuentes')
@Areas('administrador')
export class FuentesController {
  constructor(private readonly fuentesService: FuentesService) {}

  @Get()
  listar() {
    return this.fuentesService.listar();
  }

  @Post()
  crear(@Body() dto: CrearFuenteDto) {
    return this.fuentesService.crear(dto);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarFuenteDto) {
    return this.fuentesService.actualizar(id, dto);
  }
}
