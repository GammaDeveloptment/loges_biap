import { Injectable } from '@nestjs/common';
import type {
  CandidatoCargador,
  Conector,
  ParametrosConsultaCargador,
  RespuestaConsultaCargador,
} from './conector.interface';

// Catalogo fijo de datos sinteticos (Documento 014, seccion 6): representa
// el tipo de hallazgo que un conector real de descubrimiento de cargadores
// devolveria (Documento 012, seccion 3), sin consultar ninguna fuente
// externa real. Se reemplaza por un conector real cuando el Documento 012-B
// apruebe al menos una fuente, sin que el resto del sistema deba cambiar.
const CATALOGO_SINTETICO: CandidatoCargador[] = [
  {
    nombreLegal: 'Textiles del Caribe S.A.',
    identificadorFiscal: 'CR-SIM-0001',
    pais: 'CR',
    sector: 'textiles',
    direccion: 'Zona Franca Metropolitana, Heredia, Costa Rica',
    contacto: { nombre: 'Marta Solano', cargo: 'Gerente de Comercio Exterior', email: 'contacto@textilescaribe.example' },
    comercioExterior: {
      tipoOperacion: 'exportacion',
      productoDescripcion: 'Prendas de vestir de algodon',
      paisOrigen: 'CR',
      paisDestino: 'US',
    },
  },
  {
    nombreLegal: 'Agroindustrial Volcan Verde Ltda.',
    identificadorFiscal: 'CR-SIM-0002',
    pais: 'CR',
    sector: 'agroindustria',
    direccion: 'Cartago, Costa Rica',
    contacto: { nombre: 'Luis Araya', cargo: 'Jefe de Exportaciones' },
    comercioExterior: {
      tipoOperacion: 'exportacion',
      productoDescripcion: 'Pina fresca',
      paisOrigen: 'CR',
      paisDestino: 'NL',
    },
  },
  {
    nombreLegal: 'Componentes Electronicos Istmo S.A.',
    identificadorFiscal: 'CR-SIM-0003',
    pais: 'CR',
    sector: 'electronica',
    comercioExterior: {
      tipoOperacion: 'importacion',
      productoDescripcion: 'Componentes de circuitos impresos',
      paisOrigen: 'CN',
      paisDestino: 'CR',
    },
  },
];

@Injectable()
export class ConectorSimuladoCargadores
  implements Conector<ParametrosConsultaCargador, RespuestaConsultaCargador>
{
  fuenteNombre = 'Fuente Simulada - Datos Sinteticos (Documento 014, seccion 6)';

  limites = {
    solicitudesPorMinuto: 60,
    intervaloMinimoMs: 0,
  };

  async consultar(
    parametros: ParametrosConsultaCargador,
  ): Promise<RespuestaConsultaCargador> {
    const candidatos = CATALOGO_SINTETICO.filter((c) => {
      const coincideSector = !parametros.sector || c.sector === parametros.sector;
      const coincidePais = !parametros.pais || c.pais === parametros.pais;
      return coincideSector && coincidePais;
    });

    return { fechaConsulta: new Date(), candidatos };
  }

  async saludable(): Promise<boolean> {
    return true;
  }
}
