'use client';

import { useEffect, useState } from 'react';
import { obtenerSesion, type Sesion } from '@/lib/session';
import type { AreaUsuario } from '@loges-biap/shared-types';

// Vista de inicio por rol (Documento 006, seccion 3). El contenido real por
// modulo llega en entregas posteriores (Documento 007) - esto solo confirma
// que la navegacion y el area correctas se resuelven desde el login.
const MENSAJE_POR_AREA: Record<AreaUsuario, string> = {
  comercial:
    'Cargadores candidatos nuevos desde tu ultima sesion apareceran aqui.',
  gerencia_comercial:
    'Alertas recientes de competidores y resumen comparativo de cobertura apareceran aqui.',
  operaciones_compras:
    'Proveedores pendientes de evaluacion por zona/tipo de servicio apareceran aqui.',
  direccion_general:
    'Panel de tendencias y resumen ejecutivo cruzando los demas modulos aparecera aqui.',
  administrador:
    'Estado del Motor de Agentes y fuentes activas/inactivas apareceran aqui.',
};

export default function InicioPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  useEffect(() => {
    setSesion(obtenerSesion());
  }, []);

  if (!sesion) return null;

  return (
    <div>
      <h1>Hola, {sesion.usuario.nombre}</h1>
      <p>{MENSAJE_POR_AREA[sesion.usuario.area]}</p>
    </div>
  );
}
