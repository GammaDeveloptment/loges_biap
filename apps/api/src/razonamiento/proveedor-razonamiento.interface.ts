// Proveedor de Razonamiento (Documento 009, seccion 1): la pieza que
// "entiende" el contenido que un conector devuelve - el Motor de Agentes
// (BullMQ) nunca sabe que hay un LLM detras de esta interfaz, y esta
// interfaz nunca sabe que hoy es Anthropic Claude (Documento 004, seccion 4:
// mitigacion de bloqueo por proveedor).

export interface ResultadoComparacion {
  esElMismoHecho: boolean;
  explicacion: string;
}

export interface ProveedorRazonamiento {
  // Documento 009, seccion 3, paso 3 (Estructuracion): convierte contenido
  // libre en un campo estructurado. Nivel de modelo "intermedio" (Documento
  // 009, seccion 8): alto volumen, bajo riesgo, se verifica cruzado despues.
  extraerDireccion(textoLibre: string): Promise<string | null>;

  // Documento 009, seccion 3, paso 4 (Verificacion cruzada) + seccion 5:
  // decide si dos afirmaciones sobre el mismo campo son el mismo hecho
  // (aunque esten redactadas distinto) o una discrepancia real. Nivel de
  // modelo "superior": baja frecuencia, impacto directo en la confianza
  // mostrada al usuario.
  compararHechos(
    valorConocido: string,
    valorNuevo: string,
    contexto: string,
  ): Promise<ResultadoComparacion>;
}
