import { Injectable } from '@nestjs/common';

// Segunda fuente sintetica INDEPENDIENTE (Documento 014, seccion 6) - existe
// solo para poder demostrar de verdad la verificacion cruzada del Documento
// 009, seccion 5 (dos fuentes que coinciden en distinta redaccion elevan la
// confianza; dos que discrepan de verdad quedan marcadas para revision), que
// no se puede probar con una sola fuente. A diferencia del conector
// principal, esta devuelve texto libre (descripcionLibre) en vez de un
// campo ya estructurado - el Proveedor de Razonamiento (Documento 009,
// seccion 1) es quien extrae la direccion de ahi.
export interface CandidatoCargadorSecundario {
  identificadorFiscal: string;
  nombreLegal: string;
  descripcionLibre: string;
}

export interface RespuestaConsultaCargadorSecundaria {
  fechaConsulta: Date;
  candidatos: CandidatoCargadorSecundario[];
}

const CATALOGO_SINTETICO: CandidatoCargadorSecundario[] = [
  {
    identificadorFiscal: 'CR-SIM-0001',
    nombreLegal: 'Textiles del Caribe S.A.',
    // Misma direccion que la fuente principal, pero redactada distinto -
    // debe corroborar (esElMismoHecho = true) y subir la confianza.
    descripcionLibre:
      'Textiles del Caribe opera desde sus instalaciones en la Free Zone Metropolitana, en Heredia, Costa Rica, con acceso directo a la Ruta 1.',
  },
  {
    identificadorFiscal: 'CR-SIM-0002',
    nombreLegal: 'Agroindustrial Volcan Verde Ltda.',
    // Ciudad distinta a la de la fuente principal (Cartago) - discrepancia
    // real, debe quedar marcada como pendiente de reverificacion.
    descripcionLibre:
      'Agroindustrial Volcan Verde Ltda. tiene su planta de empaque ubicada en Alajuela, Costa Rica, cerca del aeropuerto.',
  },
];

@Injectable()
export class ConectorSimuladoCargadoresSecundario {
  fuenteNombre = 'Fuente Simulada Secundaria - Registro Independiente (Documento 014, seccion 6)';

  limites = { solicitudesPorMinuto: 60, intervaloMinimoMs: 0 };

  async consultar(): Promise<RespuestaConsultaCargadorSecundaria> {
    return { fechaConsulta: new Date(), candidatos: CATALOGO_SINTETICO };
  }

  async saludable(): Promise<boolean> {
    return true;
  }
}
