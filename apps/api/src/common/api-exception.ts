import { HttpException, HttpStatus } from '@nestjs/common';

// Documento 010, seccion 5: cuando el codigo de error importa para que un
// consumidor (CRM/ERP, no solo el frontend) programe contra el, no contra el
// texto del mensaje - se lanza esto en vez de un HttpException generico.
export class ApiException extends HttpException {
  constructor(
    public readonly codigo: string,
    mensaje: string,
    status: HttpStatus,
    public readonly detalle?: unknown,
  ) {
    super(mensaje, status);
  }
}
