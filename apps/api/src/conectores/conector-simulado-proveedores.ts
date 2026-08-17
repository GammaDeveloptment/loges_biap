import { Injectable } from '@nestjs/common';
import type { Conector } from './conector.interface';

export interface ParametrosConsultaProveedor {
  zona?: string;
  tipoServicio?: 'transporte_terrestre' | 'agente_aduanal' | 'bodega_almacen';
}

export interface CandidatoProveedor {
  nombreLegal: string;
  identificadorFiscal?: string;
  pais: string;
  tipoServicio: 'transporte_terrestre' | 'agente_aduanal' | 'bodega_almacen';
  zonaCobertura: string;
  contacto?: { nombre: string; cargo?: string; email?: string; telefono?: string };
}

export interface RespuestaConsultaProveedor {
  fechaConsulta: Date;
  candidatos: CandidatoProveedor[];
}

// Catalogo sintetico (Documento 014, seccion 6) - Documento 003, modulo 3.3.
const CATALOGO_SINTETICO: CandidatoProveedor[] = [
  {
    nombreLegal: 'Transportes Rapidos del Valle S.A.',
    identificadorFiscal: 'CR-PROV-0001',
    pais: 'CR',
    tipoServicio: 'transporte_terrestre',
    zonaCobertura: 'Gran Area Metropolitana',
    contacto: { nombre: 'Carlos Mena', cargo: 'Gerente de Operaciones', email: 'operaciones@transrapidos.example' },
  },
  {
    nombreLegal: 'Agencia Aduanal Puerto Limon Ltda.',
    identificadorFiscal: 'CR-PROV-0002',
    pais: 'CR',
    tipoServicio: 'agente_aduanal',
    zonaCobertura: 'Limon',
    contacto: { nombre: 'Sofia Vindas', cargo: 'Agente Aduanal Autorizada' },
  },
  {
    nombreLegal: 'Almacenes Fiscales del Pacifico S.A.',
    identificadorFiscal: 'CR-PROV-0003',
    pais: 'CR',
    tipoServicio: 'bodega_almacen',
    zonaCobertura: 'Puntarenas',
  },
];

@Injectable()
export class ConectorSimuladoProveedores
  implements Conector<ParametrosConsultaProveedor, RespuestaConsultaProveedor>
{
  fuenteNombre = 'Fuente Simulada - Datos Sinteticos (Documento 014, seccion 6)';

  limites = { solicitudesPorMinuto: 60, intervaloMinimoMs: 0 };

  async consultar(parametros: ParametrosConsultaProveedor): Promise<RespuestaConsultaProveedor> {
    const candidatos = CATALOGO_SINTETICO.filter((c) => {
      const coincideZona = !parametros.zona || c.zonaCobertura === parametros.zona;
      const coincideTipo = !parametros.tipoServicio || c.tipoServicio === parametros.tipoServicio;
      return coincideZona && coincideTipo;
    });
    return { fechaConsulta: new Date(), candidatos };
  }

  async saludable(): Promise<boolean> {
    return true;
  }
}
