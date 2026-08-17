import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { JwtClaims } from '@loges-biap/shared-types';
import { EmpresasService } from './empresas.service';
import { ListarEmpresasDto } from './dto/listar-empresas.dto';
import { CrearInteraccionDto } from './dto/crear-interaccion.dto';

// Documento 010, seccion 4.1. Sin @Areas() de clase: el acceso depende de
// que ROL de empresa se pide, no solo del area del usuario (Documento 011,
// seccion 3) - la logica fina vive en EmpresasService.
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get()
  listar(@Query() filtro: ListarEmpresasDto, @Req() req: Request & { user: JwtClaims }) {
    return this.empresasService.listar(req.user.area, filtro);
  }

  @Get(':id')
  obtenerFicha(@Param('id') id: string, @Req() req: Request & { user: JwtClaims }) {
    return this.empresasService.obtenerFicha(id, req.user.area);
  }

  @Get(':id/historial')
  historial(@Param('id') id: string) {
    return this.empresasService.historial(id);
  }

  @Post(':id/interacciones')
  crearInteraccion(
    @Param('id') id: string,
    @Body() dto: CrearInteraccionDto,
    @Req() req: Request & { user: JwtClaims },
  ) {
    return this.empresasService.crearInteraccion(id, req.user.sub, dto);
  }
}
