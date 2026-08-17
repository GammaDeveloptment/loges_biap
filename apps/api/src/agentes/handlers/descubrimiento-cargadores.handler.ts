import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConectorSimuladoCargadores } from '../../conectores/conector-simulado-cargadores';
import type { CandidatoCargador } from '../../conectores/conector.interface';

// Documento 009, seccion 2.1 (descubrimiento_cargador) + seccion 3 (ciclo de
// vida completo de una tarea). Usa el conector simulado (Documento 014,
// seccion 6) mientras ninguna fuente real tenga aprobacion del Documento
// 012-B - el resto de esta logica (estructurar, excluir, registrar
// historial) es identica a como funcionara con un conector real.
@Injectable()
export class DescubrimientoCargadoresHandler {
  private readonly logger = new Logger(DescubrimientoCargadoresHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conector: ConectorSimuladoCargadores,
  ) {}

  async ejecutar(
    ejecucionId: string,
    criterios: { sector?: string; pais?: string },
  ): Promise<string> {
    // `fuente` no tiene RLS por area (Documento 011, seccion 5) - se puede
    // leer directo, sin paraArea.
    const fuente = await this.prisma.fuente.findFirst({
      where: { nombre: this.conector.fuenteNombre, activa: true },
    });
    if (!fuente) {
      throw new Error(
        `La fuente '${this.conector.fuenteNombre}' no existe o no esta activa - correr el seed (prisma/seed.ts).`,
      );
    }

    const respuesta = await this.conector.consultar(criterios);

    let nuevos = 0;
    let excluidos = 0;
    let actualizados = 0;

    // El Motor de Agentes escribe como proceso de sistema, no como un
    // usuario humano con sesion abierta - 'direccion_general' es la unica
    // area con lectura/escritura de todo el contenido de negocio en las
    // politicas del Documento 011, por eso se reutiliza aqui (ver
    // PrismaService.paraArea).
    await this.prisma.paraArea('direccion_general', async (tx) => {
      for (const candidato of respuesta.candidatos) {
        const resultado = await this.procesarCandidato(tx, candidato, fuente, ejecucionId);
        if (resultado === 'nuevo') nuevos++;
        else if (resultado === 'excluido') excluidos++;
        else actualizados++;
      }
    });

    return `Encontrados ${respuesta.candidatos.length} candidatos: ${nuevos} nuevos, ${actualizados} ya existentes, ${excluidos} excluidos (cliente actual o descartados, Documento 009 seccion 2.1).`;
  }

  private async procesarCandidato(
    tx: Prisma.TransactionClient,
    candidato: CandidatoCargador,
    fuente: { id: string; nivelConfianzaBase: 'ALTA' | 'MEDIA' | 'BAJA' },
    ejecucionId: string,
  ): Promise<'nuevo' | 'excluido' | 'actualizado'> {
    let empresa = candidato.identificadorFiscal
      ? await tx.empresa.findFirst({
          where: { identificadorFiscal: candidato.identificadorFiscal },
        })
      : await tx.empresa.findFirst({
          where: { nombreLegal: candidato.nombreLegal, pais: candidato.pais },
        });

    const esNueva = !empresa;

    if (!empresa) {
      empresa = await tx.empresa.create({
        data: {
          nombreLegal: candidato.nombreLegal,
          identificadorFiscal: candidato.identificadorFiscal,
          pais: candidato.pais,
          sector: candidato.sector,
          fuenteDescubrimientoId: fuente.id,
          nivelConfianzaGeneral: fuente.nivelConfianzaBase,
          fechaUltimaVerificacion: new Date(),
        },
      });
      await this.registrarHistorial(tx, 'empresa', empresa.id, 'nombreLegal', null, candidato.nombreLegal, fuente.id, ejecucionId);
    } else {
      await tx.empresa.update({
        where: { id: empresa.id },
        data: { fechaUltimaVerificacion: new Date() },
      });
    }

    // Documento 009, seccion 2.1: excluir si ya es cliente actual o si la
    // interaccion mas reciente registrada fue "descartado" (salvo revision
    // explicita posterior - Documento 003, seccion 5).
    const rolClienteActual = await tx.empresaRol.findFirst({
      where: { empresaId: empresa.id, rol: 'cliente_actual', vigente: true },
    });
    const ultimaInteraccion = await tx.interaccionUsuario.findFirst({
      where: { empresaId: empresa.id },
      orderBy: { fecha: 'desc' },
    });

    if (rolClienteActual || ultimaInteraccion?.tipoAccion === 'descartado') {
      this.logger.log(`Empresa ${empresa.id} excluida del descubrimiento (Documento 009, 2.1).`);
      return 'excluido';
    }

    const rolCandidato = await tx.empresaRol.findFirst({
      where: { empresaId: empresa.id, rol: 'cargador_candidato', vigente: true },
    });
    if (!rolCandidato) {
      await tx.empresaRol.create({
        data: {
          empresaId: empresa.id,
          rol: 'cargador_candidato',
          fuenteId: fuente.id,
        },
      });
    }

    if (candidato.direccion) {
      await tx.empresaAtributo.create({
        data: {
          empresaId: empresa.id,
          atributo: 'direccion',
          valor: candidato.direccion,
          fuenteId: fuente.id,
          nivelConfianza: fuente.nivelConfianzaBase,
          ejecucionAgenteId: ejecucionId,
        },
      });
    }

    if (candidato.contacto) {
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

    await tx.registroComercioExterior.create({
      data: {
        empresaId: empresa.id,
        tipoOperacion: candidato.comercioExterior.tipoOperacion,
        productoDescripcion: candidato.comercioExterior.productoDescripcion,
        paisOrigen: candidato.comercioExterior.paisOrigen,
        paisDestino: candidato.comercioExterior.paisDestino,
        periodoInicio: new Date(),
        periodoFin: new Date(),
        fuenteId: fuente.id,
        nivelConfianza: fuente.nivelConfianzaBase,
        ejecucionAgenteId: ejecucionId,
      },
    });

    return esNueva ? 'nuevo' : 'actualizado';
  }

  private async registrarHistorial(
    tx: Prisma.TransactionClient,
    entidadTipo: string,
    entidadId: string,
    campo: string,
    valorAnterior: string | null,
    valorNuevo: string,
    fuenteId: string,
    ejecucionAgenteId: string,
  ) {
    await tx.historialCambio.create({
      data: {
        entidadTipo,
        entidadId,
        campo,
        valorAnterior,
        valorNuevo,
        fuenteId,
        ejecucionAgenteId,
      },
    });
  }
}
