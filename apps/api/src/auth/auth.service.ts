import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginResponse } from '@loges-biap/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

// Documento 010, seccion 2 y Documento 011, seccion 4: JWT firmado por el
// backend, con el area del usuario embebida en el claim. Sin SSO/directorio
// corporativo por ahora (nota abierta del Documento 011, seccion 4).
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto, ip?: string): Promise<LoginResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    const passwordValida =
      usuario && (await bcrypt.compare(dto.password, usuario.password));

    if (!usuario || !usuario.activo || !passwordValida) {
      await this.prisma.auditoriaAcceso.create({
        data: {
          usuarioId: usuario?.id,
          accion: 'login_fallido',
          recurso: 'POST /api/v1/auth/login',
          ipOrigen: ip,
        },
      });
      throw new UnauthorizedException('Credenciales invalidas');
    }

    await this.prisma.auditoriaAcceso.create({
      data: {
        usuarioId: usuario.id,
        accion: 'login_exitoso',
        recurso: 'POST /api/v1/auth/login',
        ipOrigen: ip,
      },
    });

    const claims = { sub: usuario.id, area: usuario.area };
    return {
      accessToken: this.jwt.sign(claims, { expiresIn: '8h' }),
      refreshToken: this.jwt.sign(claims, { expiresIn: '30d' }),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        area: usuario.area,
      },
    };
  }
}
