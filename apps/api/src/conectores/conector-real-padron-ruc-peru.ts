import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type {
  CandidatoCargador,
  Conector,
  ParametrosConsultaCargador,
  RespuestaConsultaCargador,
} from './conector.interface';

// Documento 012-B, seccion 9: primera fuente real activada para descubrir
// cargadores en Peru (aprobada con salvedad de transparencia - ver esa
// seccion). El dataset real (~3.3GB, sin razon social ni direccion, solo
// RUC + actividad economica + distrito) es demasiado grande para descargar
// en cada consulta, asi que este conector lee un cache local pre-filtrado
// (Lima, sectores de interes) generado por
// scripts/actualizar-cache-padron-ruc.ts - que hay que re-correr cuando
// SUNAT publique una version nueva (mensual). Si el cache no existe todavia,
// devuelve cero candidatos en vez de fallar - no es un error de la fuente.
const RUTA_CACHE = join(process.cwd(), 'prisma', 'data', 'padron-ruc-lima-cache.json');
const LIMITE_CANDIDATOS_POR_CONSULTA = 15;

interface FilaCachePadronRuc {
  ruc: string;
  sector: string;
  actividad: string;
  distrito: string;
  provincia: string;
  departamento: string;
}

interface ArchivoCachePadronRuc {
  generadoEl: string;
  fuenteArchivo: string;
  filas: FilaCachePadronRuc[];
}

@Injectable()
export class ConectorRealPadronRucPeru
  implements Conector<ParametrosConsultaCargador, RespuestaConsultaCargador>
{
  private readonly logger = new Logger(ConectorRealPadronRucPeru.name);

  // Debe coincidir exactamente con `fuente.nombre` ya registrado y aprobado
  // en la base real (Documento 012-B, seccion 9) - el handler busca la fuente
  // por este nombre antes de usar el conector.
  fuenteNombre = 'Padron RUC - Datos Abiertos (SUNAT, Peru)';

  limites = {
    // Se lee un cache local, nunca se llama a datosabiertos.gob.pe en una
    // consulta en vivo - estos limites son vestigiales para cumplir la
    // interfaz, no protegen nada real en este conector.
    solicitudesPorMinuto: 60,
    intervaloMinimoMs: 0,
  };

  private cache: ArchivoCachePadronRuc | null | undefined;

  private cargarCache(): ArchivoCachePadronRuc | null {
    if (this.cache !== undefined) return this.cache;
    if (!existsSync(RUTA_CACHE)) {
      this.logger.warn(
        `No existe ${RUTA_CACHE} - correr scripts/actualizar-cache-padron-ruc.ts antes de esperar candidatos reales de Peru.`,
      );
      this.cache = null;
      return null;
    }
    this.cache = JSON.parse(readFileSync(RUTA_CACHE, 'utf-8')) as ArchivoCachePadronRuc;
    return this.cache;
  }

  async consultar(parametros: ParametrosConsultaCargador): Promise<RespuestaConsultaCargador> {
    if (parametros.pais && parametros.pais !== 'PE') {
      return { fechaConsulta: new Date(), candidatos: [] };
    }

    const cache = this.cargarCache();
    if (!cache) {
      return { fechaConsulta: new Date(), candidatos: [] };
    }

    const filasFiltradas = cache.filas.filter((f) => !parametros.sector || f.sector === parametros.sector);

    // Documento 012-B, seccion 8-D (corregida 2026-08-20): esta fuente NO
    // expone razon social ni direccion exacta - nunca se inventa un nombre;
    // se deja explicito en el propio valor para que nadie lo confunda con
    // un dato real de identificacion.
    const candidatos: CandidatoCargador[] = filasFiltradas.slice(0, LIMITE_CANDIDATOS_POR_CONSULTA).map((f) => ({
      nombreLegal: `RUC ${f.ruc} (sin razon social - el Padron RUC no la expone)`,
      identificadorFiscal: `PE-RUC-${f.ruc}`,
      pais: 'PE',
      sector: f.sector,
      direccion: `${f.distrito}, ${f.provincia}, ${f.departamento}, Peru (ubicacion aproximada por distrito - la fuente no expone direccion exacta)`,
    }));

    return { fechaConsulta: new Date(), candidatos };
  }

  async saludable(): Promise<boolean> {
    return this.cargarCache() !== null;
  }
}
