import { Injectable } from '@nestjs/common';
import type { Conector } from './conector.interface';

export interface ParametrosConsultaCompetidor {
  pais?: string;
}

export interface HechoCompetidor {
  tipoCambio: 'nueva_ruta' | 'nueva_alianza' | 'expansion' | 'otro';
  descripcion: string;
}

export interface CandidatoCompetidor {
  nombreLegal: string;
  identificadorFiscal?: string;
  pais: string;
  tipo: 'naviera' | 'freight_forwarder' | 'agente_carga';
  coberturaGeografica: string;
  hechos: HechoCompetidor[];
}

export interface RespuestaConsultaCompetidor {
  fechaConsulta: Date;
  candidatos: CandidatoCompetidor[];
}

// Catalogo sintetico (Documento 014, seccion 6) - Documento 003, modulo 3.2.
// Los "hechos" representan el estado actual conocido de cada competidor; el
// handler compara contra lo ya registrado (competidor_cambio) y solo genera
// una alerta cuando algo es realmente nuevo (Documento 009, seccion 2.3).
const CATALOGO_SINTETICO: CandidatoCompetidor[] = [
  {
    nombreLegal: 'Naviera Transoceanica del Istmo S.A.',
    identificadorFiscal: 'CR-COMP-0001',
    pais: 'CR',
    tipo: 'naviera',
    coberturaGeografica: 'Centroamerica y Caribe',
    hechos: [
      { tipoCambio: 'nueva_ruta', descripcion: 'Nueva ruta directa Puerto Limon - Miami' },
      { tipoCambio: 'nueva_alianza', descripcion: 'Alianza operativa con Freight Forwarder Andino Ltda.' },
    ],
  },
  {
    nombreLegal: 'Freight Forwarder Andino Ltda.',
    identificadorFiscal: 'CR-COMP-0002',
    pais: 'CR',
    tipo: 'freight_forwarder',
    coberturaGeografica: 'Sudamerica y Centroamerica',
    hechos: [{ tipoCambio: 'expansion', descripcion: 'Apertura de oficina propia en Costa Rica' }],
  },
];

@Injectable()
export class ConectorSimuladoCompetidores
  implements Conector<ParametrosConsultaCompetidor, RespuestaConsultaCompetidor>
{
  fuenteNombre = 'Fuente Simulada - Datos Sinteticos (Documento 014, seccion 6)';

  limites = { solicitudesPorMinuto: 60, intervaloMinimoMs: 0 };

  async consultar(parametros: ParametrosConsultaCompetidor): Promise<RespuestaConsultaCompetidor> {
    const candidatos = CATALOGO_SINTETICO.filter(
      (c) => !parametros.pais || c.pais === parametros.pais,
    );
    return { fechaConsulta: new Date(), candidatos };
  }

  async saludable(): Promise<boolean> {
    return true;
  }
}
