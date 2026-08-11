import { SetMetadata } from '@nestjs/common';

// Marca un endpoint como accesible sin JWT (ej. POST /auth/login). Sin este
// decorador, JwtAuthGuard (aplicado globalmente) exige autenticacion por
// defecto - el mismo principio de "nada abierto salvo excepcion explicita"
// que ya aplica a la matriz de permisos (Documento 011, seccion 3).
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
