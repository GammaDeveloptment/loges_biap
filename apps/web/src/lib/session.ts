'use client';

import type { LoginResponse } from '@loges-biap/shared-types';

// Sesion minima del lado del cliente para esta primera entrega (Documento
// 007, Entrega 0). No reemplaza el JWT como mecanismo de autorizacion real
// contra la API - solo evita pedir login en cada navegacion dentro del panel.
const SESSION_KEY = 'loges-biap-session';

export type Sesion = LoginResponse;

export function guardarSesion(sesion: Sesion) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

export function obtenerSesion(): Sesion | null {
  if (typeof window === 'undefined') return null;
  const bruto = localStorage.getItem(SESSION_KEY);
  return bruto ? (JSON.parse(bruto) as Sesion) : null;
}

export function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY);
}
