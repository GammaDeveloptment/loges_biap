// Contrato tecnico de un conector (Documento 012, seccion 2). El Motor de
// Agentes solo conoce esta interfaz - nunca le importa si detras hay una
// fuente real o, como en este momento, un conector simulado (Documento 014,
// seccion 6) mientras el Documento 012-B no apruebe ninguna fuente real.
export interface ParametrosConsultaCargador {
  sector?: string;
  pais?: string;
}

export interface CandidatoCargador {
  nombreLegal: string;
  identificadorFiscal?: string;
  pais: string;
  sector: string;
  direccion?: string;
  contacto?: {
    nombre: string;
    cargo?: string;
    email?: string;
    telefono?: string;
  };
  // Opcional: un candidato descubierto por registro mercantil/tributario
  // por rubro+ubicacion (Documento 012, seccion 3, nota agosto 2026) no
  // tiene una declaracion de comercio exterior propia - a diferencia de un
  // cargador que si importa/exporta a su nombre. No inventar este dato
  // cuando la fuente real no lo provee.
  comercioExterior?: {
    tipoOperacion: 'importacion' | 'exportacion';
    productoDescripcion: string;
    paisOrigen: string;
    paisDestino: string;
  };
}

export interface RespuestaConsultaCargador {
  fechaConsulta: Date;
  candidatos: CandidatoCargador[];
}

export interface Conector<TParametros, TRespuesta> {
  fuenteNombre: string;
  limites: {
    solicitudesPorMinuto: number;
    intervaloMinimoMs: number;
  };
  consultar(parametros: TParametros): Promise<TRespuesta>;
  saludable(): Promise<boolean>;
}
