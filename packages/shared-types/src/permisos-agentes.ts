import type { AreaUsuario, TipoTareaAgente } from './enums';

// Documento 011, seccion 3 ("Ejecuciones de agente"): cada area solo puede
// disparar manualmente el tipo de tarea de su propio modulo. Direccion
// General y Administrador tienen solo lectura (Documento 010, seccion 4.4),
// nunca disparo manual.
//
// Vive en shared-types (no solo en apps/api) porque el frontend tambien lo
// necesita: sin esto, una pantalla le muestra el boton "Buscar candidatos
// nuevos" a un area que el backend va a rechazar con 403 apenas lo toque
// (encontrado probando en navegador como direccion_general, Entrega 5).
export const AREAS_QUE_PUEDEN_DISPARAR: Record<TipoTareaAgente, AreaUsuario[]> = {
  descubrimiento_cargador: ['comercial'],
  monitoreo_competidor: ['gerencia_comercial'],
  enriquecimiento_proveedor: ['operaciones_compras'],
  actualizacion_tendencia: [],
};

export function puedeDispararTarea(
  area: AreaUsuario,
  tipoTarea: TipoTareaAgente,
): boolean {
  return AREAS_QUE_PUEDEN_DISPARAR[tipoTarea].includes(area);
}
