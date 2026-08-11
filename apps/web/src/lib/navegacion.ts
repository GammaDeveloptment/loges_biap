import type { AreaUsuario } from '@loges-biap/shared-types';

// Navegacion principal filtrada por area (Documento 006, seccion 2), en el
// mismo orden y con las mismas visibilidades de la matriz de permisos del
// Documento 011, seccion 3.
//
// Nota: estas rutas viven bajo el grupo de rutas `(panel)`, que en el App
// Router de Next.js no agrega un segmento a la URL (es solo organizacion de
// layout) - por eso los href son planos (`/cargadores`, no `/panel/cargadores`).
export interface ItemNavegacion {
  href: string;
  etiqueta: string;
  areas: AreaUsuario[];
}

export const NAVEGACION: ItemNavegacion[] = [
  {
    href: '/inicio',
    etiqueta: 'Inicio',
    areas: [
      'comercial',
      'gerencia_comercial',
      'operaciones_compras',
      'direccion_general',
      'administrador',
    ],
  },
  {
    href: '/cargadores',
    etiqueta: 'Cargadores',
    areas: ['comercial', 'direccion_general'],
  },
  {
    href: '/competidores',
    etiqueta: 'Competidores',
    areas: ['gerencia_comercial', 'direccion_general'],
  },
  {
    href: '/proveedores',
    etiqueta: 'Proveedores Logisticos',
    areas: ['operaciones_compras', 'direccion_general'],
  },
  {
    href: '/tendencias',
    etiqueta: 'Tendencias de Mercado',
    areas: ['gerencia_comercial', 'direccion_general'],
  },
  {
    href: '/administracion',
    etiqueta: 'Administracion',
    areas: ['administrador'],
  },
];
