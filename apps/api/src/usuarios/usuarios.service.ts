import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

const RONDAS_BCRYPT = 12;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, area: true, activo: true },
    });
  }

  async crear(dto: CrearUsuarioDto) {
    const passwordHasheada = await bcrypt.hash(dto.password, RONDAS_BCRYPT);
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        area: dto.area,
        password: passwordHasheada,
      },
    });
    const { password: _password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  }

  async actualizar(id: string, dto: ActualizarUsuarioDto) {
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: dto,
    });
    const { password: _password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  }
}
