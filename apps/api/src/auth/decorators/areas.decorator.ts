import { SetMetadata } from '@nestjs/common';
import { AreaUsuario } from '@loges-biap/shared-types';

// Marca que areas (Documento 011, seccion 2.1) pueden acceder a un endpoint.
// Se combina con AreasGuard. Un endpoint sin @Areas(...) queda abierto a
// cualquier usuario autenticado - usarlo explicitamente, no por omision,
// para que la matriz de permisos del Documento 011 quede visible en el codigo.
export const AREAS_KEY = 'areas';
export const Areas = (...areas: AreaUsuario[]) => SetMetadata(AREAS_KEY, areas);
