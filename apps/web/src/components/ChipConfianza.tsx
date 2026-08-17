// Documento 006, seccion 5: chip de fuente/confianza visible junto a cada
// dato - patron transversal reutilizado en toda pantalla que muestre datos
// trazables (Documento 010, seccion 3).
const CLASE_POR_NIVEL: Record<string, string> = {
  ALTA: 'chip chip-alta',
  MEDIA: 'chip chip-media',
  BAJA: 'chip chip-baja',
};

export function ChipConfianza({ nivel, titulo }: { nivel: string; titulo?: string }) {
  return (
    <span className={CLASE_POR_NIVEL[nivel] ?? 'chip chip-baja'} title={titulo}>
      {nivel}
    </span>
  );
}
