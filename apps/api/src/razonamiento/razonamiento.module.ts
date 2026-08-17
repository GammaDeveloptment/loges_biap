import { Module } from '@nestjs/common';
import { AnthropicProveedorRazonamiento } from './anthropic-proveedor-razonamiento';

// Token de inyeccion (no la clase concreta): si en el futuro Gammacargo
// necesita cambiar o combinar proveedores de IA (Documento 004, seccion 4),
// el cambio es este 'useClass', no tocar cada modulo que use razonamiento.
export const PROVEEDOR_RAZONAMIENTO = 'PROVEEDOR_RAZONAMIENTO';

@Module({
  providers: [{ provide: PROVEEDOR_RAZONAMIENTO, useClass: AnthropicProveedorRazonamiento }],
  exports: [PROVEEDOR_RAZONAMIENTO],
})
export class RazonamientoModule {}
