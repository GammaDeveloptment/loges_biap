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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
