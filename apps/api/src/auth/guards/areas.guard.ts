import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AreaUsuario, JwtClaims } from '@loges-biap/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { AREAS_KEY } from '../decorators/areas.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// Aplica la matriz de permisos por area del Documento 011, seccion 3.
// Un acceso denegado queda registrado en auditoria_acceso (Documento 011,
// seccion 7) - no solo se rechaza en silencio.
@Injectable()
export class AreasGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) {
      return true;
    }

    const areasPermitidas = this.reflector.getAllAndOverride<AreaUsuario[]>(
      AREAS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!areasPermitidas || areasPermitidas.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario: JwtClaims | undefined = request.user;
    const permitido = !!usuario && areasPermitidas.includes(usuario.area);

    if (!permitido) {
      await this.prisma.auditoriaAcceso.create({
        data: {
          usuarioId: usuario?.sub,
          accion: 'acceso_denegado',
          recurso: `${request.method} ${request.originalUrl}`,
          ipOrigen: request.ip,
        },
      });
    }

    return permitido;
  }
}
