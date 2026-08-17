'use client';

import type { LucideIcon } from 'lucide-react';

// Boton de icono con tooltip nativo (title/aria-label) - el texto de la
// accion no desaparece, solo deja de ocupar espacio en pantalla; sigue
// siendo accesible para lectores de pantalla y visible al pasar el mouse.
type Variante = 'primario' | 'peligro' | 'neutro';

const CLASE_POR_VARIANTE: Record<Variante, string> = {
  primario: 'primario',
  peligro: 'boton-icono-peligro',
  neutro: 'fantasma',
};

export function IconButton({
  icono: Icono,
  etiqueta,
  onClick,
  variante = 'neutro',
  disabled,
  tipo = 'button',
}: {
  icono: LucideIcon;
  etiqueta: string;
  onClick?: () => void;
  variante?: Variante;
  disabled?: boolean;
  tipo?: 'button' | 'submit';
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      title={etiqueta}
      aria-label={etiqueta}
      className={`boton-icono ${CLASE_POR_VARIANTE[variante]}`}
    >
      <Icono size={17} strokeWidth={2} />
    </button>
  );
}
