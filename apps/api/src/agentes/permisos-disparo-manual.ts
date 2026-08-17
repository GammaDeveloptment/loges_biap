import type { AreaUsuario, TipoTareaAgente } from '@loges-biap/shared-types';

// Documento 011, seccion 3 ("Ejecuciones de agente"): cada area solo puede
// disparar manualmente el tipo de tarea de su propio modulo. Direccion
// General y Administrador tienen solo lectura (Documento 010, seccion 4.4),
// nunca disparo manual.
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
