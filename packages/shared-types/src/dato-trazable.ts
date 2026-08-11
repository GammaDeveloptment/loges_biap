import { NivelConfianza } from './enums';

// Convencion "dato trazable" (Documento 010, seccion 3): todo campo que en el
// Documento 005 tiene fuente y confianza propias se expone con esta forma,
// nunca como un valor plano.
export interface FuenteReferencia {
  id: string;
  nombre: string;
  tipo: string;
}

export interface DatoTrazable<T> {
  valor: T;
  fuente: FuenteReferencia;
  nivelConfianza: NivelConfianza;
  fechaVerificacion: string; // ISO 8601
}
