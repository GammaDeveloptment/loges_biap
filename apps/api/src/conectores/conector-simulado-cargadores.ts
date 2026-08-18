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
  // Candidatos de Peru descubiertos por registro mercantil/tributario por
  // rubro+ubicacion (Documento 012, seccion 3, nota agosto 2026), no por
  // comercio exterior propio - modelan el patron de consolidacion descrito
  // por el cliente (varios comerciantes pequenos, un tercero importa el
  // contenedor). Por eso, a diferencia del catalogo de Costa Rica arriba,
  // estos candidatos NO tienen "comercioExterior" ni "contacto": el Padron
  // RUC de SUNAT (investigado en el Documento 012-B, anexo D) solo expone
  // razon social, rubro y domicilio fiscal - nunca telefono ni email. No
  // se inventa ese dato aqui para que la demo no genere una expectativa
  // que la fuente real no va a poder cumplir.
  {
    nombreLegal: 'Comercial Repuestos El Faro E.I.R.L.',
    identificadorFiscal: 'PE-SIM-0004',
    pais: 'PE',
    sector: 'repuestos_automotrices',
    direccion: 'Jr. Montevideo 1245, Cercado de Lima, Lima, Peru',
  },
  {
    nombreLegal: 'Textiles y Confecciones Rimac S.A.C.',
    identificadorFiscal: 'PE-SIM-0005',
    pais: 'PE',
    sector: 'textiles',
    direccion: 'Jr. Andahuaylas 340, Cercado de Lima, Lima, Peru',
  },
  {
    nombreLegal: 'Moda Express Gamarra S.A.C.',
    identificadorFiscal: 'PE-SIM-0006',
    pais: 'PE',
    sector: 'ropa',
    direccion: 'Jr. Gamarra 815, La Victoria, Lima, Peru',
  },
  {
    nombreLegal: 'Calzados San Jacinto E.I.R.L.',
    identificadorFiscal: 'PE-SIM-0007',
    pais: 'PE',
    sector: 'calzado',
    direccion: 'Jr. Paruro 1120, Cercado de Lima, Lima, Peru',
  },
  {
    nombreLegal: 'Importaciones de Accesorios Tecno Cell S.A.C.',
    identificadorFiscal: 'PE-SIM-0008',
    pais: 'PE',
    sector: 'accesorios_celular',
    direccion: 'Av. Wilson 632, Cercado de Lima, Lima, Peru',
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
