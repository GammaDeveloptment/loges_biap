import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConectorSimuladoProveedores } from '../../conectores/conector-simulado-proveedores';
import type { CandidatoProveedor } from '../../conectores/conector-simulado-proveedores';
import type { RolEmpresa } from '@loges-biap/shared-types';

const ROL_POR_TIPO_SERVICIO: Record<CandidatoProveedor['tipoServicio'], RolEmpresa> = {
  transporte_terrestre: 'proveedor_transportista',
  agente_aduanal: 'proveedor_aduanal',
  bodega_almacen: 'proveedor_bodega',
};

// Documento 009, seccion 2.2 (enriquecimiento_proveedor). Mismo patron que
// descubrimiento_cargador: conector simulado (Documento 014, seccion 6)
// mientras el Documento 012-B no apruebe una fuente real.
@Injectable()
export class EnriquecimientoProveedoresHandler {
  private readonly logger = new Logger(EnriquecimientoProveedoresHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conector: ConectorSimuladoProveedores,
  ) {}

  async ejecutar(
    _ejecucionId: string,
    criterios: { zona?: string; tipoServicio?: CandidatoProveedor['tipoServicio'] },
  ): Promise<string> {
    const fuente = await this.prisma.fuente.findFirst({
      where: { nombre: this.conector.fuenteNombre, activa: true },
    });
    if (!fuente) {
      throw new Error(`La fuente '${this.conector.fuenteNombre}' no existe o no esta activa.`);
    }

    const respuesta = await this.conector.consultar(criterios);
    let nuevos = 0;
    let actualizados = 0;

    await this.prisma.paraArea('direccion_general', async (tx) => {
      for (const candidato of respuesta.candidatos) {
        const esNueva = await this.procesarCandidato(tx, candidato, fuente);
        if (esNueva) nuevos++;
        else actualizados++;
      }
    });

    return `Encontrados ${respuesta.candidatos.length} proveedores: ${nuevos} nuevos, ${actualizados} ya existentes.`;
  }

  private async procesarCandidato(
    tx: Prisma.TransactionClient,
    candidato: CandidatoProveedor,
    fuente: { id: string; nivelConfianzaBase: 'ALTA' | 'MEDIA' | 'BAJA' },
  ): Promise<boolean> {
    let empresa = candidato.identificadorFiscal
      ? await tx.empresa.findFirst({ where: { identificadorFiscal: candidato.identificadorFiscal } })
      : await tx.empresa.findFirst({ where: { nombreLegal: candidato.nombreLegal, pais: candidato.pais } });

    const esNueva = !empresa;

    if (!empresa) {
      empresa = await tx.empresa.create({
        data: {
          nombreLegal: candidato.nombreLegal,
          identificadorFiscal: candidato.identificadorFiscal,
          pais: candidato.pais,
          fuenteDescubrimientoId: fuente.id,
          nivelConfianzaGeneral: fuente.nivelConfianzaBase,
          fechaUltimaVerificacion: new Date(),
        },
      });
    } else {
      await tx.empresa.update({ where: { id: empresa.id }, data: { fechaUltimaVerificacion: new Date() } });
    }

    const rol = ROL_POR_TIPO_SERVICIO[candidato.tipoServicio];
    const rolVigente = await tx.empresaRol.findFirst({
      where: { empresaId: empresa.id, rol, vigente: true },
    });
    if (!rolVigente) {
      await tx.empresaRol.create({ data: { empresaId: empresa.id, rol, fuenteId: fuente.id } });
    }

    const perfilExistente = await tx.proveedorPerfil.findUnique({ where: { empresaId: empresa.id } });
    if (!perfilExistente) {
      await tx.proveedorPerfil.create({
        data: {
          empresaId: empresa.id,
          tipoServicio: candidato.tipoServicio,
          zonaCobertura: candidato.zonaCobertura,
          estadoEvaluacion: 'nuevo',
        },
      });
    }

    if (candidato.contacto) {
      const contactoVigente = await tx.contacto.findFirst({
        where: { empresaId: empresa.id, nombre: candidato.contacto.nombre, vigente: true },
      });
      if (!contactoVigente) {
        await tx.contacto.create({
          data: {
            empresaId: empresa.id,
            nombre: candidato.contacto.nombre,
            cargo: candidato.contacto.cargo,
            email: candidato.contacto.email,
            telefono: candidato.contacto.telefono,
            fuenteId: fuente.id,
            nivelConfianza: fuente.nivelConfianzaBase,
          },
        });
      }
    }

    return esNueva;
  }
}
