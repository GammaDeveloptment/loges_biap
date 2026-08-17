import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type {
  ProveedorRazonamiento,
  ResultadoComparacion,
} from './proveedor-razonamiento.interface';

// Documento 009, seccion 8: estrategia de modelos por costo. Haiku para
// estructuracion de alto volumen/bajo riesgo, Sonnet para juicio de baja
// frecuencia (resolver discrepancias).
const MODELO_INTERMEDIO = 'claude-haiku-4-5-20251001';
const MODELO_SUPERIOR = 'claude-sonnet-5';

@Injectable()
export class AnthropicProveedorRazonamiento implements ProveedorRazonamiento {
  private readonly logger = new Logger(AnthropicProveedorRazonamiento.name);
  private readonly cliente: Anthropic;

  constructor(config: ConfigService) {
    this.cliente = new Anthropic({ apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY') });
  }

  async extraerDireccion(textoLibre: string): Promise<string | null> {
    const respuesta = await this.cliente.messages.create({
      model: MODELO_INTERMEDIO,
      max_tokens: 300,
      tools: [
        {
          name: 'reportar_direccion',
          description: 'Reporta la direccion fisica extraida del texto, si existe alguna.',
          input_schema: {
            type: 'object',
            properties: {
              direccion: {
                type: ['string', 'null'],
                description: 'La direccion fisica encontrada en el texto, o null si el texto no menciona ninguna.',
              },
            },
            required: ['direccion'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'reportar_direccion' },
      messages: [
        {
          role: 'user',
          content: `Extrae la direccion fisica (calle, zona, ciudad, pais) mencionada en este texto sobre una empresa. Si no menciona ninguna direccion, reporta null.\n\nTexto:\n"""${textoLibre}"""`,
        },
      ],
    });

    const bloque = respuesta.content.find((b) => b.type === 'tool_use');
    if (!bloque || bloque.type !== 'tool_use') {
      this.logger.warn('Anthropic no devolvio un tool_use para extraerDireccion.');
      return null;
    }
    const input = bloque.input as { direccion: string | null };
    return input.direccion;
  }

  async compararHechos(
    valorConocido: string,
    valorNuevo: string,
    contexto: string,
  ): Promise<ResultadoComparacion> {
    const respuesta = await this.cliente.messages.create({
      model: MODELO_SUPERIOR,
      max_tokens: 500,
      tools: [
        {
          name: 'reportar_comparacion',
          description:
            'Reporta si dos afirmaciones sobre el mismo campo describen el mismo hecho (aunque esten redactadas distinto) o son una discrepancia real.',
          input_schema: {
            type: 'object',
            properties: {
              esElMismoHecho: {
                type: 'boolean',
                description: 'true si ambos valores describen la misma realidad (ej. misma direccion escrita distinto); false si son informacion genuinamente distinta o contradictoria.',
              },
              explicacion: {
                type: 'string',
                description: 'Una oracion breve justificando la decision.',
              },
            },
            required: ['esElMismoHecho', 'explicacion'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'reportar_comparacion' },
      messages: [
        {
          role: 'user',
          content: `Contexto: ${contexto}\n\nValor ya conocido (fuente A): "${valorConocido}"\nValor nuevo reportado (fuente B): "${valorNuevo}"\n\n¿Describen el mismo hecho (aunque con palabras distintas), o son informacion realmente distinta/contradictoria?`,
        },
      ],
    });

    const bloque = respuesta.content.find((b) => b.type === 'tool_use');
    if (!bloque || bloque.type !== 'tool_use') {
      this.logger.warn('Anthropic no devolvio un tool_use para compararHechos.');
      return { esElMismoHecho: false, explicacion: 'Sin respuesta interpretable del modelo.' };
    }
    return bloque.input as ResultadoComparacion;
  }
}
