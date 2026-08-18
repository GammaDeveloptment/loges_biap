import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { NivelConfianza } from '@loges-biap/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { ConectorSimuladoCargadores } from '../../conectores/conector-simulado-cargadores';
import type { CandidatoCargador } from '../../conectores/conector.interface';
import { ConectorSimuladoCargadoresSecundario } from '../../conectores/conector-simulado-cargadores-secundario';
import { PROVEEDOR_RAZONAMIENTO } from '../../razonamiento/razonamiento.module';
import type { ProveedorRazonamiento } from '../../razonamiento/proveedor-razonamiento.interface';

const ORDEN_CONFIANZA: NivelConfianza[] = ['BAJA', 'MEDIA', 'ALTA'];
function subirUnEscalon(a: NivelConfianza, b: NivelConfianza): NivelConfianza {
  const indice = Math.max(ORDEN_CONFIANZA.indexOf(a), ORDEN_CONFIANZA.indexOf(b));
  return ORDEN_CONFIANZA[Math.min(indice + 1, ORDEN_CONFIANZA.length - 1)];
}

interface FuenteRef {
  id: string;
  nivelConfianzaBase: NivelConfianza;
}

// Documento 009, seccion 2.1 (descubrimiento_cargador) + seccion 3 (ciclo de
// vida completo de una tarea) + seccion 5 (verificacion cruzada, Entrega 4).
// Usa conectores simulados (Documento 014, seccion 6) mientras ninguna
// fuente real tenga aprobacion del Documento 012-B - el resto de esta
// logica (estructurar, comparar, excluir, registrar historial) es identica
// a como funcionara con conectores reales.
@Injectable()
export class DescubrimientoCargadoresHandler {
  private readonly logger = new Logger(DescubrimientoCargadoresHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conector: ConectorSimuladoCargadores,
    private readonly conectorSecundario: ConectorSimuladoCargadoresSecundario,
    @Inject(PROVEEDOR_RAZONAMIENTO) private readonly razonamiento: ProveedorRazonamiento,
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
    const fuenteSecundaria = await this.prisma.fuente.findFirst({
      where: { nombre: this.conectorSecundario.fuenteNombre, activa: true },
    });
    if (!fuente || !fuenteSecundaria) {
      throw new Error('Alguna de las fuentes simuladas no existe o no esta activa - correr el seed (prisma/seed.ts).');
    }

    const respuesta = await this.conector.consultar(criterios);
    const respuestaSecundaria = await this.conectorSecundario.consultar();

    let nuevos = 0;
    let excluidos = 0;
    let actualizados = 0;
    let corroboraciones = 0;
    let conflictos = 0;

    // El Motor de Agentes escribe como proceso de sistema, no como un
    // usuario humano con sesion abierta - 'direccion_general' es la unica
    // area con lectura/escritura de todo el contenido de negocio en las
    // politicas del Documento 011, por eso se reutiliza aqui (ver
    // PrismaService.paraArea).
    await this.prisma.paraArea('direccion_general', async (tx) => {
      for (const candidato of respuesta.candidatos) {
        const resultado = await this.procesarCandidatoPrimario(tx, candidato, fuente, ejecucionId);
        if (resultado === 'nuevo') nuevos++;
        else if (resultado === 'excluido') excluidos++;
        else actualizados++;
      }

      for (const candidatoSecundario of respuestaSecundaria.candidatos) {
        const resultado = await this.procesarCandidatoSecundario(
          tx,
          candidatoSecundario,
          fuenteSecundaria,
          ejecucionId,
        );
        if (resultado === 'corroborado') corroboraciones++;
        else if (resultado === 'conflicto') conflictos++;
      }
    }, { timeoutMs: 60_000 });

    return (
      `Encontrados ${respuesta.candidatos.length} candidatos: ${nuevos} nuevos, ${actualizados} ya existentes, ` +
      `${excluidos} excluidos (cliente actual o descartados, Documento 009 seccion 2.1). ` +
      `Fuente secundaria: ${corroboraciones} datos corroborados (confianza elevada), ${conflictos} discrepancias reales (pendientes de reverificacion, Documento 009 seccion 5).`
    );
  }

  private async procesarCandidatoPrimario(
    tx: Prisma.TransactionClient,
    candidato: CandidatoCargador,
    fuente: FuenteRef,
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
      await this.reconciliarAtributo(tx, empresa.id, 'direccion', candidato.direccion, fuente, ejecucionId);
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

    // registro_comercio_exterior es un log de evidencia (Documento 005,
    // seccion 3.5) sin columna "vigente" - pero re-detectar exactamente el
    // mismo hecho (mismo tipo/producto/origen/destino) en cada corrida no es
    // evidencia nueva, es la misma. Se deduplica por contenido, no por fecha.
    // Un candidato descubierto por registro mercantil/tributario (Documento
    // 012, seccion 3) no trae comercioExterior - no se inventa.
    if (candidato.comercioExterior) {
      const registroExistente = await tx.registroComercioExterior.findFirst({
        where: {
          empresaId: empresa.id,
          fuenteId: fuente.id,
          tipoOperacion: candidato.comercioExterior.tipoOperacion,
          productoDescripcion: candidato.comercioExterior.productoDescripcion,
          paisOrigen: candidato.comercioExterior.paisOrigen,
          paisDestino: candidato.comercioExterior.paisDestino,
        },
      });
      if (!registroExistente) {
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
      }
    }

    return esNueva ? 'nuevo' : 'actualizado';
  }

  // Documento 009, seccion 3 (Estructuracion) + seccion 5 (Verificacion
  // cruzada): esta fuente entrega texto libre, no un campo ya estructurado -
  // primero se extrae con el Proveedor de Razonamiento, luego se reconcilia
  // igual que cualquier otro atributo.
  private async procesarCandidatoSecundario(
    tx: Prisma.TransactionClient,
    candidato: { identificadorFiscal: string; nombreLegal: string; descripcionLibre: string },
    fuenteSecundaria: FuenteRef,
    ejecucionId: string,
  ): Promise<'nuevo' | 'actualizado' | 'corroborado' | 'conflicto' | 'sin_cambio'> {
    const empresa = await tx.empresa.findFirst({ where: { identificadorFiscal: candidato.identificadorFiscal } });
    if (!empresa) {
      // La fuente secundaria menciona una empresa que el descubrimiento
      // primario todavia no encontro en esta corrida - sin empresa base no
      // hay a que atributo asociarlo (Documento 009, seccion 2.1 asume la
      // empresa ya creada por la tarea de descubrimiento).
      return 'sin_cambio';
    }

    const direccionExtraida = await this.razonamiento.extraerDireccion(candidato.descripcionLibre);
    if (!direccionExtraida) {
      return 'sin_cambio';
    }

    return this.reconciliarAtributo(tx, empresa.id, 'direccion', direccionExtraida, fuenteSecundaria, ejecucionId);
  }

  // Documento 009, seccion 5: nucleo de la verificacion cruzada. Si no hay
  // valor vigente, se registra tal cual. Si el valor nuevo es identico al
  // vigente, no es un hallazgo nuevo. Si difiere, el Proveedor de
  // Razonamiento decide si es el mismo hecho redactado distinto
  // (corrobora -> sube la confianza) o una discrepancia real (se conserva
  // el valor de la fuente con mayor nivel_confianza_base, y se marca
  // pendiente_reverificacion - nunca se promedia ni se adivina).
  private async reconciliarAtributo(
    tx: Prisma.TransactionClient,
    empresaId: string,
    atributo: string,
    valorNuevo: string,
    fuenteNueva: FuenteRef,
    ejecucionId: string,
  ): Promise<'nuevo' | 'actualizado' | 'corroborado' | 'conflicto' | 'sin_cambio'> {
    const vigente = await tx.empresaAtributo.findFirst({
      where: { empresaId, atributo, vigente: true },
    });

    if (!vigente) {
      await tx.empresaAtributo.create({
        data: {
          empresaId,
          atributo,
          valor: valorNuevo,
          fuenteId: fuenteNueva.id,
          nivelConfianza: fuenteNueva.nivelConfianzaBase,
          ejecucionAgenteId: ejecucionId,
        },
      });
      return 'nuevo';
    }

    if (vigente.valor === valorNuevo) {
      return 'sin_cambio';
    }

    const comparacion = await this.razonamiento.compararHechos(
      vigente.valor,
      valorNuevo,
      `Campo '${atributo}' de una empresa de comercio exterior.`,
    );

    await this.registrarHistorial(tx, 'empresa_atributo', vigente.id, atributo, vigente.valor, valorNuevo, fuenteNueva.id, ejecucionId);

    if (comparacion.esElMismoHecho) {
      const nuevaConfianza = subirUnEscalon(vigente.nivelConfianza, fuenteNueva.nivelConfianzaBase);
      await tx.empresaAtributo.update({
        where: { id: vigente.id },
        data: { nivelConfianza: nuevaConfianza, fechaVerificacion: new Date() },
      });
      this.logger.log(`Corroborado '${atributo}' de empresa ${empresaId}: ${comparacion.explicacion}`);
      return 'corroborado';
    }

    // Discrepancia real: se conserva el valor de mayor nivel_confianza_base,
    // sin importar cual fuente lo reporto originalmente, y se marca para
    // revision - nunca se resuelve en silencio.
    const fuenteVigenteEsMasConfiable =
      ORDEN_CONFIANZA.indexOf(vigente.nivelConfianza) >= ORDEN_CONFIANZA.indexOf(fuenteNueva.nivelConfianzaBase);

    if (fuenteVigenteEsMasConfiable) {
      await tx.empresaAtributo.update({
        where: { id: vigente.id },
        data: { pendienteReverificacion: true },
      });
    } else {
      await tx.empresaAtributo.update({ where: { id: vigente.id }, data: { vigente: false } });
      await tx.empresaAtributo.create({
        data: {
          empresaId,
          atributo,
          valor: valorNuevo,
          fuenteId: fuenteNueva.id,
          nivelConfianza: fuenteNueva.nivelConfianzaBase,
          ejecucionAgenteId: ejecucionId,
          pendienteReverificacion: true,
        },
      });
    }

    this.logger.warn(`Discrepancia real en '${atributo}' de empresa ${empresaId}: ${comparacion.explicacion}`);
    return 'conflicto';
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
