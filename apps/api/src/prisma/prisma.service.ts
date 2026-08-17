import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { AREAS_USUARIO, type AreaUsuario } from '@loges-biap/shared-types';

// Punto unico de acceso a PostgreSQL (Documento 004, seccion 3: todo acceso a
// datos pasa por el backend a traves de un ORM, nunca directo desde el frontend).
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Documento 011, seccion 5: las politicas RLS leen `app.current_user_area`
  // por sesion. Postgres solo respeta `SET LOCAL` dentro de una transaccion
  // explicita (fuera de una, el valor no se fijaria de forma confiable con
  // el pool de conexiones de Prisma) - por eso toda consulta contra una
  // tabla con RLS por area debe pasar por aqui, nunca usar `this.prisma`
  // directo para esas tablas.
  //
  // 'direccion_general' representa al Motor de Agentes actuando como
  // proceso de sistema (Documento 009): sus escrituras no pertenecen a un
  // usuario humano navegando en ese instante, y direccion_general ya tiene
  // lectura/escritura de todo el contenido de negocio en las politicas del
  // Documento 011, seccion 3 - reutilizarla evita inventar un pseudo-area
  // "sistema" que las politicas tendrian que conocer aparte.
  async paraArea<T>(
    area: AreaUsuario,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!AREAS_USUARIO.includes(area)) {
      throw new Error(`Area invalida para RLS: '${area}'.`);
    }
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_user_area = '${area}'`);
      return fn(tx);
    });
  }
}
