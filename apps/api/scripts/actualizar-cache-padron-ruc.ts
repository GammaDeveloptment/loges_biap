// Documento 012 (Arquitectura de Conectores) + Documento 012-B (fuente "Padron
// RUC - Datos Abiertos", aprobada seccion 9): el dataset real es un CSV
// mensual de ~3.3GB sin nombre/direccion (solo RUC, actividad economica y
// distrito) - demasiado grande para descargar en cada ejecucion del agente
// (violaria el principio de respetar limites de la fuente, Documento 012-B
// seccion 3, pregunta 6). Este script se corre manualmente/periodicamente
// (mensual, cuando SUNAT publica una version nueva) para filtrar solo lo
// relevante (Lima, sectores de interes, contribuyentes activos con negocio)
// a un archivo de cache chico que el conector real lee en tiempo de consulta.
//
// Uso: npx ts-node scripts/actualizar-cache-padron-ruc.ts [url-del-zip]
// Si no se pasa URL, usa la ultima conocida al momento de escribir esto.

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const URL_POR_DEFECTO = 'https://www.datosabiertos.gob.pe/sites/default/files/PadronRUC_202607.zip';
const ZIP_TEMPORAL = join(__dirname, '..', '.tmp-padron-ruc.zip');
const CACHE_SALIDA = join(__dirname, '..', 'prisma', 'data', 'padron-ruc-lima-cache.json');

// Documento 012-B, seccion 9: el patron de negocio de Gammacargo (comerciantes
// pequenos consolidados por un tercero importador) se investigo para estos
// rubros especificos (mismos que el catalogo sintetico de la Entrega 2) - no
// es una lista exhaustiva de toda actividad economica, es la acotada al caso
// de uso ya validado con el cliente.
const PALABRAS_POR_SECTOR: Record<string, RegExp> = {
  repuestos_automotrices: /REPUESTO|AUTOPARTE|PARTES.*VEHICULO|VEHICULO.*(PARTE|ACCESORIO)/,
  textiles: /TEXTIL|HILADO|TEJIDO/,
  ropa: /PRENDAS DE VESTIR|CONFECCION/,
  calzado: /CALZADO/,
  accesorios_celular: /TELEFON|CELULAR|EQUIPO.*COMUNICACION/,
};

// Corrida de prueba (2026-08-20, 13.3M filas): "textiles" atrapaba tambien
// lavanderias/tintorerias ("LAVADO Y LIMPIEZA...DE PRODUCTOS TEXTILES") -
// son negocios de servicio, no comerciantes vendiendo productos textiles
// (el patron de negocio real, Documento 012 seccion 3). Se excluyen aparte
// en vez de complicar el regex principal de cada sector.
const EXCLUSIONES_POR_SECTOR: Partial<Record<string, RegExp>> = {
  textiles: /LAVADO|LIMPIEZA EN SECO|TINTORERIA/,
};

interface FilaCache {
  ruc: string;
  sector: string;
  actividad: string;
  distrito: string;
  provincia: string;
  departamento: string;
}

async function descargarSiHaceFalta(url: string): Promise<void> {
  if (existsSync(ZIP_TEMPORAL)) {
    console.log(`Ya existe ${ZIP_TEMPORAL}, no se vuelve a descargar (borrarlo a mano si se quiere forzar).`);
    return;
  }
  console.log(`Descargando ${url} ...`);
  await new Promise<void>((resolve, reject) => {
    // curl, no fetch: el sitio devuelve 418 sin un User-Agent de navegador.
    const proceso = spawn('curl', [
      '-sL', url,
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '-o', ZIP_TEMPORAL,
      '--max-time', '600',
    ]);
    proceso.on('exit', (codigo) => (codigo === 0 ? resolve() : reject(new Error(`curl salio con codigo ${codigo}`))));
    proceso.on('error', reject);
  });
  console.log('Descarga completa.');
}

function detectarSector(actividadConcatenada: string): string | null {
  for (const [sector, patron] of Object.entries(PALABRAS_POR_SECTOR)) {
    if (!patron.test(actividadConcatenada)) continue;
    const exclusion = EXCLUSIONES_POR_SECTOR[sector];
    if (exclusion && exclusion.test(actividadConcatenada)) continue;
    return sector;
  }
  return null;
}

async function filtrarYCachear(): Promise<void> {
  console.log('Leyendo el CSV dentro del zip en streaming (esto tarda varios minutos, es un archivo de ~3.3GB)...');

  const unzip = spawn('unzip', ['-p', ZIP_TEMPORAL], { stdio: ['ignore', 'pipe', 'inherit'] });
  const lector = createInterface({ input: unzip.stdout });

  let encabezado: string[] | null = null;
  let idx: Record<string, number> = {};
  const resultado: FilaCache[] = [];
  let filasLeidas = 0;
  const porSector: Record<string, number> = {};

  for await (const linea of lector) {
    if (!encabezado) {
      encabezado = linea.split(',');
      idx = Object.fromEntries(encabezado.map((nombre, i) => [nombre.trim(), i]));
      continue;
    }
    filasLeidas++;
    if (filasLeidas % 2_000_000 === 0) {
      console.log(`... ${filasLeidas.toLocaleString()} filas leidas, ${resultado.length} candidatos encontrados hasta ahora`);
    }

    const campos = linea.split(',');
    const departamento = campos[idx['Departamento']];
    if (departamento !== 'LIMA') continue;

    const estado = campos[idx['Estado']];
    if (estado !== 'ACTIVO') continue;

    const tipo = campos[idx['Tipo']];
    if (tipo === 'PERSONA NATURAL SIN NEGOCIO') continue;

    const actividad = [
      campos[idx['Actividad_Economica_CIIU_revision4_Principal']],
      campos[idx['Actividad_Economica_CIIU_revision3_Principal']],
    ].join(' ');
    if (actividad.includes('NO DISPONIBLE') && actividad.trim() === 'NO DISPONIBLE NO DISPONIBLE') continue;

    const sector = detectarSector(actividad);
    if (!sector) continue;

    const rev4 = campos[idx['Actividad_Economica_CIIU_revision4_Principal']];
    const rev3 = campos[idx['Actividad_Economica_CIIU_revision3_Principal']];
    resultado.push({
      ruc: campos[idx['RUC']],
      sector,
      // Solo para inspeccion/diagnostico de este script - el conector real
      // no lee este campo. Preferir el que de verdad matcheo el sector, no
      // el primero que sea truthy ("NO DISPONIBLE" tambien lo es).
      actividad: rev4 !== 'NO DISPONIBLE' ? rev4 : rev3,
      distrito: campos[idx['Distrito']],
      provincia: campos[idx['Provincia']],
      departamento,
    });
    porSector[sector] = (porSector[sector] ?? 0) + 1;
  }

  console.log(`Listo: ${filasLeidas.toLocaleString()} filas totales leidas, ${resultado.length} candidatos en Lima para los sectores de interes.`);
  console.log('Por sector:', porSector);

  writeFileSync(CACHE_SALIDA, JSON.stringify({ generadoEl: new Date().toISOString(), fuenteArchivo: URL_POR_DEFECTO, filas: resultado }, null, 2));
  console.log(`Cache escrito en ${CACHE_SALIDA}`);
}

async function main() {
  const url = process.argv[2] ?? URL_POR_DEFECTO;
  await descargarSiHaceFalta(url);
  await filtrarYCachear();
  unlinkSync(ZIP_TEMPORAL);
  console.log('Zip temporal eliminado.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
