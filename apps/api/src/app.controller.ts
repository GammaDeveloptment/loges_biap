import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

// Documento 013, seccion 5: endpoint de salud para el monitoreo de infraestructura.
@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
