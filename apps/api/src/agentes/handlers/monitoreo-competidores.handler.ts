import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConectorSimuladoCompetidores } from '../../conectores/conector-simulado-competidores';
import type { CandidatoCompetidor } from '../../conectores/conector-simulado-competidores';

// Documento 009, seccion 2.3 (monitoreo_competidor). El conector devuelve el
// estado actual conocido del competidor; el handler compara cada "hecho"
// contra lo ya registrado en competidor_cambio y solo genera una alerta
// nueva cuando algo no se conocia antes - evita "notificar ruido" (Documento
// 009, seccion 2.3) igual que en la Entrega 2 con registro_comercio_exterior.
@Injectable()
export class MonitoreoCompetidoresHandler {
  private readonly logger = new Logger(MonitoreoCompetidoresHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conector: ConectorSimuladoCompetidores,
  ) {}

  async ejecutar(_ejecucionId: string, criterios: { pais?: string }): Promise<string> {
    const fuente = await this.prisma.fuente.findFirst({
      where: { nombre: this.conector.fuenteNombre, activa: true },
    });
    if (!fuente) {
      throw new Error(`La fuente '${this.conector.fuenteNombre}' no existe o no esta activa.`);
    }

    const respuesta = await this.conector.consultar(criterios);
    let alertasNuevas = 0;

    await this.prisma.paraArea('direccion_general', async (tx) => {
      for (const candidato of respuesta.candidatos) {
        alertasNuevas += await this.procesarCandidato(tx, candidato, fuente);
      }
    });

    return `Monitoreados ${respuesta.candidatos.length} competidores: ${alertasNuevas} alertas nuevas.`;
  }

  private async procesarCandidato(
    tx: Prisma.TransactionClient,
    candidato: CandidatoCompetidor,
    fuente: { id: string; nivelConfianzaBase: 'ALTA' | 'MEDIA' | 'BAJA' },
  ): Promise<number> {
    let empresa = candidato.identificadorFiscal
      ? await tx.empresa.findFirst({ where: { identificadorFiscal: candidato.identificadorFiscal } })
      : await tx.empresa.findFirst({ where: { nombreLegal: candidato.nombreLegal, pais: candidato.pais } });

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

    const rolVigente = await tx.empresaRol.findFirst({
      where: { empresaId: empresa.id, rol: 'competidor', vigente: true },
    });
    if (!rolVigente) {
      await tx.empresaRol.create({ data: { empresaId: empresa.id, rol: 'competidor', fuenteId: fuente.id } });
    }

    let perfil = await tx.competidorPerfil.findUnique({ where: { empresaId: empresa.id } });
    if (!perfil) {
      perfil = await tx.competidorPerfil.create({
        data: {
          empresaId: empresa.id,
          tipo: candidato.tipo,
          coberturaGeografica: candidato.coberturaGeografica,
          fechaUltimoMonitoreo: new Date(),
        },
      });
    } else {
      await tx.competidorPerfil.update({
        where: { id: perfil.id },
        data: { coberturaGeografica: candidato.coberturaGeografica, fechaUltimoMonitoreo: new Date() },
      });
    }

    let alertasNuevas = 0;
    for (const hecho of candidato.hechos) {
      const yaConocido = await tx.competidorCambio.findFirst({
        where: {
          competidorPerfilId: perfil.id,
          tipoCambio: hecho.tipoCambio,
          descripcion: hecho.descripcion,
        },
      });
      if (!yaConocido) {
        await tx.competidorCambio.create({
          data: {
            competidorPerfilId: perfil.id,
            tipoCambio: hecho.tipoCambio,
            descripcion: hecho.descripcion,
            fuenteId: fuente.id,
          },
        });
        alertasNuevas++;
      }
    }

    return alertasNuevas;
  }
}
