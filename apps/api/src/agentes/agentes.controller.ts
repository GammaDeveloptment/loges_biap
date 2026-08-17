import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { JwtClaims } from '@loges-biap/shared-types';
import { AgentesService } from './agentes.service';
import { CrearEjecucionDto } from './dto/crear-ejecucion.dto';
import { ListarEjecucionesDto } from './dto/listar-ejecuciones.dto';

// Documento 010, seccion 4.4. Sin @Areas() de clase: la lectura es visible
// para cualquier area autenticada (no es contenido comercialmente sensible,
// Documento 011 seccion 6), y el disparo manual valida por tipo_tarea dentro
// del servicio (Documento 011, seccion 3) porque el permiso depende de CUAL
// tipo_tarea se pide, no solo del area en si.
@Controller('ejecuciones-agente')
export class AgentesController {
  constructor(private readonly agentesService: AgentesService) {}

  @Get()
  listar(@Query() filtro: ListarEjecucionesDto) {
    return this.agentesService.listar(filtro);
  }

  @Post()
  dispararManual(@Body() dto: CrearEjecucionDto, @Req() req: Request & { user: JwtClaims }) {
    return this.agentesService.dispararManual(dto, req.user.area);
  }
}
