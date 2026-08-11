// Enumeraciones del dominio de Loges-BIAP (Documento 005 - Modelo de Datos Empresarial).
// Nombres en espanol: lenguaje ubicuo del negocio (Documento 015, seccion 7).
//
// Se usan "string literal unions" (no `enum` de TypeScript) a proposito: los
// enums de Prisma generados en apps/api son declaraciones independientes con
// los mismos valores, y un `enum` de TS no es asignable a otro aunque los
// valores coincidan (tipado nominal). Un valor literal de un enum de Prisma
// SI es asignable a un string literal union, asi que este paquete se puede
// compartir entre api y web sin conversiones ni dependecia de @prisma/client.

export const NIVELES_CONFIANZA = ['ALTA', 'MEDIA', 'BAJA'] as const;
export type NivelConfianza = (typeof NIVELES_CONFIANZA)[number];

export const ROLES_EMPRESA = [
  'cargador_candidato',
  'cliente_actual',
  'competidor',
  'proveedor_transportista',
  'proveedor_aduanal',
  'proveedor_bodega',
] as const;
export type RolEmpresa = (typeof ROLES_EMPRESA)[number];

export const ESTADOS_EMPRESA = ['activa', 'descartada', 'inactiva'] as const;
export type EstadoEmpresa = (typeof ESTADOS_EMPRESA)[number];

export const TIPOS_OPERACION_COMERCIO_EXTERIOR = [
  'importacion',
  'exportacion',
] as const;
export type TipoOperacionComercioExterior =
  (typeof TIPOS_OPERACION_COMERCIO_EXTERIOR)[number];

export const TIPOS_SERVICIO_PROVEEDOR = [
  'transporte_terrestre',
  'agente_aduanal',
  'bodega_almacen',
] as const;
export type TipoServicioProveedor = (typeof TIPOS_SERVICIO_PROVEEDOR)[number];

export const ESTADOS_EVALUACION_PROVEEDOR = [
  'nuevo',
  'en_evaluacion',
  'aprobado',
  'descartado',
] as const;
export type EstadoEvaluacionProveedor =
  (typeof ESTADOS_EVALUACION_PROVEEDOR)[number];

export const TIPOS_COMPETIDOR = [
  'naviera',
  'freight_forwarder',
  'agente_carga',
] as const;
export type TipoCompetidor = (typeof TIPOS_COMPETIDOR)[number];

export const TIPOS_CAMBIO_COMPETIDOR = [
  'nueva_ruta',
  'nueva_alianza',
  'expansion',
  'otro',
] as const;
export type TipoCambioCompetidor = (typeof TIPOS_CAMBIO_COMPETIDOR)[number];

export const TIPOS_AGREGACION_TENDENCIA = ['sector', 'ruta', 'pais'] as const;
export type TipoAgregacionTendencia =
  (typeof TIPOS_AGREGACION_TENDENCIA)[number];

export const TIPOS_ACCION_INTERACCION = [
  'contactado',
  'evaluado',
  'descartado',
  'marcado_relevante',
] as const;
export type TipoAccionInteraccion = (typeof TIPOS_ACCION_INTERACCION)[number];

export const TIPOS_TAREA_AGENTE = [
  'descubrimiento_cargador',
  'enriquecimiento_proveedor',
  'monitoreo_competidor',
  'actualizacion_tendencia',
] as const;
export type TipoTareaAgente = (typeof TIPOS_TAREA_AGENTE)[number];

export const ESTADOS_EJECUCION_AGENTE = [
  'pendiente',
  'en_progreso',
  'completado',
  'fallido',
] as const;
export type EstadoEjecucionAgente = (typeof ESTADOS_EJECUCION_AGENTE)[number];

export const SISTEMAS_DESTINO_SINCRONIZACION = ['crm', 'erp'] as const;
export type SistemaDestinoSincronizacion =
  (typeof SISTEMAS_DESTINO_SINCRONIZACION)[number];

export const ESTADOS_SINCRONIZACION = [
  'pendiente',
  'exitosa',
  'fallida',
] as const;
export type EstadoSincronizacion = (typeof ESTADOS_SINCRONIZACION)[number];

export const ACCIONES_AUDITORIA = [
  'login_exitoso',
  'login_fallido',
  'acceso_denegado',
] as const;
export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number];

// Areas de usuario (Documento 011, seccion 2.1) - determinan navegacion y permisos.
export const AREAS_USUARIO = [
  'comercial',
  'gerencia_comercial',
  'operaciones_compras',
  'direccion_general',
  'administrador',
] as const;
export type AreaUsuario = (typeof AREAS_USUARIO)[number];
