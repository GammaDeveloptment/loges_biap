import type { AreaUsuario, RolEmpresa } from '@loges-biap/shared-types';

// Documento 011, seccion 3: que roles de empresa puede ver cada area. "—" en
// la matriz del documento se traduce aqui como un arreglo vacio (sin acceso
// de lectura, no solo sin escritura).
export const ROLES_VISIBLES_POR_AREA: Record<AreaUsuario, RolEmpresa[]> = {
  comercial: ['cargador_candidato', 'cliente_actual'],
  gerencia_comercial: ['competidor'],
  operaciones_compras: ['proveedor_transportista', 'proveedor_aduanal', 'proveedor_bodega'],
  direccion_general: [
    'cargador_candidato',
    'cliente_actual',
    'competidor',
    'proveedor_transportista',
    'proveedor_aduanal',
    'proveedor_bodega',
  ],
  // Documento 011, seccion 6: Administrador queda fuera del contenido de
  // negocio por defecto.
  administrador: [],
};

export function rolesPermitidos(area: AreaUsuario): RolEmpresa[] {
  return ROLES_VISIBLES_POR_AREA[area];
}
