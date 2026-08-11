// Formato de error estandar de la API (Documento 010, seccion 5).
export interface ApiErrorBody {
  error: {
    codigo: string;
    mensaje: string;
    detalle?: unknown;
  };
}
