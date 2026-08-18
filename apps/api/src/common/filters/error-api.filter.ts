import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ApiException } from '../api-exception';

const CODIGO_POR_STATUS: Record<number, string> = {
  400: 'SOLICITUD_INVALIDA',
  401: 'NO_AUTENTICADO',
  403: 'PERMISO_DENEGADO',
  404: 'NO_ENCONTRADO',
  409: 'CONFLICTO',
  422: 'VALIDACION_NEGOCIO',
};

// Documento 010, seccion 5: formato de error unico en toda la API -
// {error:{codigo,mensaje,detalle}} - para que un integrador de CRM/ERP
// programe contra `codigo`, no contra el texto de `mensaje`. Antes de este
// filtro, Nest devolvia su forma default ({message,error,statusCode}), que
// no coincide con lo que el frontend ya esperaba leer (Documento 010 nunca
// se habia implementado de verdad - ver Entrega 5).
@Catch()
export class ErrorApiFilter implements ExceptionFilter {
  private readonly logger = new Logger('ErrorApiFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ApiException) {
      response.status(exception.getStatus()).json({
        error: { codigo: exception.codigo, mensaje: exception.message, detalle: exception.detalle },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const cuerpo = exception.getResponse();
      const mensajeCrudo =
        typeof cuerpo === 'object' && cuerpo !== null && 'message' in cuerpo
          ? (cuerpo as { message: string | string[] }).message
          : exception.message;
      const esListaDeValidacion = Array.isArray(mensajeCrudo);

      response.status(status).json({
        error: {
          codigo: CODIGO_POR_STATUS[status] ?? 'ERROR_DESCONOCIDO',
          mensaje: esListaDeValidacion
            ? 'La solicitud no paso las validaciones de campos.'
            : (mensajeCrudo as string),
          detalle: esListaDeValidacion ? mensajeCrudo : undefined,
        },
      });
      return;
    }

    // No es una condicion de negocio esperada - es un bug real. Se registra
    // completo del lado del servidor pero nunca se expone el mensaje interno
    // a un consumidor externo (CRM/ERP), solo un codigo generico.
    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrio un error inesperado en el servidor.' },
    });
  }
}
