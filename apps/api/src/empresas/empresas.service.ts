import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AreaUsuario } from '@loges-biap/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { ListarEmpresasDto } from './dto/listar-empresas.dto';
import { CrearInteraccionDto } from './dto/crear-interaccion.dto';
import { rolesPermitidos } from './permisos-empresas';

const TAMANO_PAGINA = 50;

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  // Documento 010, seccion 4.1 + Documento 011, seccion 3: no existen rutas
  // separadas por rol - son vistas filtradas del mismo recurso, pero el area
  // determina que roles puede ver en absoluto (no solo que filtro eligio).
  // Todas las consultas van por `paraArea` (Documento 011, seccion 5): el
  // RLS de la base de datos es la segunda capa detras de este chequeo.
  async listar(area: AreaUsuario, filtro: ListarEmpresasDto) {
    const permitidos = rolesPermitidos(area);
    if (permitidos.length === 0) {
      throw new ForbiddenException(
        `El area '${area}' no tiene acceso de lectura a empresas (Documento 011, seccion 3/6).`,
      );
    }
    if (filtro.rol && !permitidos.includes(filtro.rol)) {
      throw new ForbiddenException(
        `El area '${area}' no puede ver empresas con rol '${filtro.rol}' (Documento 011, seccion 3).`,
      );
    }

    const rolesAConsultar = filtro.rol ? [filtro.rol] : permitidos;

    return this.prisma.paraArea(area, async (tx) => {
      const empresas = await tx.empresa.findMany({
        where: {
          sector: filtro.sector,
          pais: filtro.pais,
          nivelConfianzaGeneral: filtro.nivelConfianza,
          estado: filtro.estado ?? 'activa',
          roles: { some: { rol: { in: rolesAConsultar }, vigente: true } },
        },
        include: { roles: { where: { vigente: true } } },
        orderBy: { fechaDescubrimiento: 'desc' },
        take: TAMANO_PAGINA + 1,
        ...(filtro.cursor ? { cursor: { id: filtro.cursor }, skip: 1 } : {}),
      });

      const hayMas = empresas.length > TAMANO_PAGINA;
      const pagina = hayMas ? empresas.slice(0, TAMANO_PAGINA) : empresas;

      return {
        datos: pagina,
        siguienteCursor: hayMas ? pagina[pagina.length - 1].id : null,
      };
    });
  }

  async obtenerFicha(id: string, area: AreaUsuario) {
    const permitidos = rolesPermitidos(area);

    const empresa = await this.prisma.paraArea(area, (tx) =>
      tx.empresa.findUnique({
        where: { id },
        include: {
          roles: { where: { vigente: true } },
          atributos: { where: { vigente: true }, include: { fuente: true } },
          contactos: { where: { vigente: true }, include: { fuente: true } },
          registrosComercio: { include: { fuente: true }, orderBy: { fechaDeteccion: 'desc' } },
          interacciones: { orderBy: { fecha: 'desc' }, take: 10, include: { usuario: { select: { nombre: true } } } },
          fuenteDescubrimiento: true,
          proveedorPerfil: true,
          competidorPerfil: { include: { cambios: { orderBy: { fechaDeteccion: 'desc' } } } },
        },
      }),
    );

    if (!empresa) {
      throw new NotFoundException('No existe una empresa con el id solicitado.');
    }

    const tieneRolVisible = empresa.roles.some((r) => permitidos.includes(r.rol));
    if (!tieneRolVisible) {
      throw new ForbiddenException(
        `El area '${area}' no tiene acceso a esta empresa (Documento 011, seccion 3).`,
      );
    }

    // Documento 010, seccion 3: convencion "dato trazable" para los campos
    // enriquecibles que vienen de empresa_atributo.
    const atributosTrazables = Object.fromEntries(
      empresa.atributos.map((a) => [
        a.atributo,
        {
          valor: a.valor,
          fuente: { id: a.fuente.id, nombre: a.fuente.nombre, tipo: a.fuente.tipo },
          nivelConfianza: a.nivelConfianza,
          fechaVerificacion: a.fechaVerificacion,
        },
      ]),
    );

    return {
      id: empresa.id,
      nombreLegal: empresa.nombreLegal,
      nombreComercial: empresa.nombreComercial,
      pais: empresa.pais,
      identificadorFiscal: empresa.identificadorFiscal,
      sector: empresa.sector,
      estado: empresa.estado,
      nivelConfianzaGeneral: empresa.nivelConfianzaGeneral,
      fechaDescubrimiento: empresa.fechaDescubrimiento,
      fechaUltimaVerificacion: empresa.fechaUltimaVerificacion,
      roles: empresa.roles.map((r) => r.rol),
      atributos: atributosTrazables,
      contactos: empresa.contactos,
      registrosComercioExterior: empresa.registrosComercio,
      interaccionesRecientes: empresa.interacciones,
      proveedorPerfil: empresa.proveedorPerfil,
      competidorPerfil: empresa.competidorPerfil,
    };
  }

  async historial(id: string) {
    // historial_cambio no esta scopeado por area (Documento 011, seccion 5:
    // sus politicas son de solo-insercion/solo-lectura, no por area) - no
    // necesita paraArea.
    return this.prisma.historialCambio.findMany({
      where: { entidadTipo: 'empresa', entidadId: id },
      orderBy: { fecha: 'desc' },
    });
  }

  async crearInteraccion(
    empresaId: string,
    usuarioId: string,
    area: AreaUsuario,
    dto: CrearInteraccionDto,
  ) {
    // proveedor_perfil tiene RLS por area (Documento 011, seccion 5) - el
    // include y el update de mas abajo deben ir dentro de paraArea, o
    // devuelven vacio/no aplican en silencio (mismo bug que en Entrega 2).
    return this.prisma.paraArea(area, async (tx) => {
      const empresa = await tx.empresa.findUnique({
        where: { id: empresaId },
        include: { proveedorPerfil: true },
      });
      if (!empresa) {
        throw new NotFoundException('No existe una empresa con el id solicitado.');
      }

      const interaccion = await tx.interaccionUsuario.create({
        data: {
          empresaId,
          usuarioId,
          tipoAccion: dto.tipoAccion,
          comentario: dto.comentario,
        },
      });

      // Documento 003, seccion 3.3 / Documento 006, seccion 6: el ciclo de
      // vida generico (Nuevo -> Contactado -> Evaluado -> Aprobado/Descartado)
      // tambien mueve el estado de evaluacion propio del proveedor, si aplica.
      if (empresa.proveedorPerfil) {
        const nuevoEstado =
          dto.tipoAccion === 'contactado'
            ? 'en_evaluacion'
            : dto.tipoAccion === 'evaluado'
              ? 'aprobado'
              : dto.tipoAccion === 'descartado'
                ? 'descartado'
                : undefined;

        if (nuevoEstado) {
          await tx.proveedorPerfil.update({
            where: { empresaId },
            data: {
              estadoEvaluacion: nuevoEstado,
              evaluadoPorUsuarioId: usuarioId,
              fechaEvaluacion: new Date(),
            },
          });
        }
      }

      return interaccion;
    });
  }

  async listarCambiosCompetidor(empresaId: string, area: AreaUsuario) {
    return this.prisma.paraArea(area, async (tx) => {
      const perfil = await tx.competidorPerfil.findUnique({ where: { empresaId } });
      if (!perfil) {
        throw new NotFoundException('Esta empresa no tiene perfil de competidor.');
      }
      return tx.competidorCambio.findMany({
        where: { competidorPerfilId: perfil.id },
        orderBy: { fechaDeteccion: 'desc' },
      });
    });
  }
}
