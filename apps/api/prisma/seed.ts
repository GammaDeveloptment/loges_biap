// Datos sinteticos de arranque (Documento 014, seccion 6: nunca fuentes
// externas reales, solo para tener un usuario por area y poder probar login
// y navegacion filtrada por rol - Entrega 0, criterio de salida, Documento 007).
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USUARIOS_DE_PRUEBA = [
  { nombre: 'Comercial Demo', email: 'comercial@demo.loges-biap.local', area: 'comercial' as const },
  { nombre: 'Gerencia Comercial Demo', email: 'gerencia@demo.loges-biap.local', area: 'gerencia_comercial' as const },
  { nombre: 'Operaciones Demo', email: 'operaciones@demo.loges-biap.local', area: 'operaciones_compras' as const },
  { nombre: 'Direccion General Demo', email: 'direccion@demo.loges-biap.local', area: 'direccion_general' as const },
  { nombre: 'Administrador Demo', email: 'admin@demo.loges-biap.local', area: 'administrador' as const },
];

const PASSWORD_DEMO = 'CambiarEn1erUso!';

async function main() {
  const passwordHasheada = await bcrypt.hash(PASSWORD_DEMO, 12);

  for (const usuario of USUARIOS_DE_PRUEBA) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {},
      create: { ...usuario, password: passwordHasheada },
    });
  }

  console.log(
    `Sembrados ${USUARIOS_DE_PRUEBA.length} usuarios de prueba (password: ${PASSWORD_DEMO}) - usar solo en desarrollo local.`,
  );

  // Fuente simulada (Documento 014, seccion 6): no es una fuente externa
  // real, por eso se marca activa directamente - la regla de aprobacion
  // legal del Documento 012-B aplica a fuentes que consultan datos de
  // terceros reales, no a un catalogo sintetico que el propio proyecto
  // controla para pruebas y desarrollo (Entrega 2, Documento 007).
  const NOMBRE_FUENTE_SIMULADA = 'Fuente Simulada - Datos Sinteticos (Documento 014, seccion 6)';
  const fuenteSimulada = await prisma.fuente.findFirst({
    where: { nombre: NOMBRE_FUENTE_SIMULADA },
  });
  if (!fuenteSimulada) {
    await prisma.fuente.create({
      data: {
        nombre: NOMBRE_FUENTE_SIMULADA,
        tipo: 'otro',
        pais: 'N/A',
        nivelConfianzaBase: 'MEDIA',
        terminosUsoVerificados: true,
        activa: true,
        aprobadoPor: 'Sistema (fuente simulada, no consulta datos reales de terceros)',
        fechaAprobacionLegal: new Date(),
        referenciaLegal: 'Documento 014, seccion 6 - no aplica evaluacion de 012-B a datos sinteticos',
      },
    });
    console.log('Fuente simulada creada para la Entrega 2.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
