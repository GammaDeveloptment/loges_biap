# Documento 012 — Arquitectura de Scraping y Conectores

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.3
**Fecha:** Julio 2026 (actualizado agosto 2026)

---

## 0. Contexto

Este documento es, junto con el Documento 009, el núcleo técnico diferenciador de Loges-BIAP (`CLAUDE.md`, sección 6). Define **cómo se construye un conector** hacia una fuente pública — el contrato técnico que el Motor de Agentes (Documento 009) consume — no todavía **qué fuentes concretas** están activas.

**Advertencia explícita y deliberada:** este documento **no valida legalmente ninguna fuente**. Esa validación es responsabilidad exclusiva del Documento 012-B — Cumplimiento Legal de Fuentes, que debe hacerse con asesoría legal por país (Documento 002, sección 8: "Asesoría legal especializada en protección de datos, por país"). Nombrar aquí una institución o portal específico sin esa validación sería exactamente el riesgo que `CLAUDE.md` señala: "el Documento 012 puede diseñarse con capacidades legalmente inviables en algunos mercados". Por eso este documento habla de **categorías de fuente** y de la **forma que debe tener un conector**, no de fuentes nombradas — el Documento 012-B es el que decide, país por país, cuáles de estas categorías tienen una fuente real activable y bajo qué condiciones.

## 1. Principio de Diseño: Conector como Contrato, no como Rastreador

Un conector en Loges-BIAP es una **consulta estructurada y acotada** a una fuente conocida, con parámetros conocidos (ej. "buscar por sector y país", "consultar por identificador fiscal") — nunca un programa que navega un sitio siguiendo enlaces para descubrir contenido no solicitado. Esta distinción no es semántica: es la que separa un conector de Loges-BIAP de un crawler, y sostiene el principio no negociable del Documento 001 ("no hacemos scraping, no hacemos crawling").

Tres formas válidas de conector, todas estructuradas:

| Tipo | Descripción | Ejemplo de patrón (sin nombrar una fuente real) |
|---|---|---|
| **Conector de API oficial** | La fuente expone una API pública documentada. | Un portal aduanero que ofrece un endpoint de consulta de estadísticas de comercio exterior. |
| **Conector de datos abiertos** | La fuente publica archivos estructurados (CSV/JSON/XML) de forma periódica, sin API interactiva. | Un portal de datos abiertos gubernamental que publica un padrón de importadores/exportadores mensual. |
| **Conector de consulta puntual** | La fuente es un formulario público de búsqueda por un parámetro conocido (nombre, identificador fiscal), sin capacidad ni necesidad de enumerar todo el sitio. | Un registro mercantil que permite buscar una empresa por nombre o identificador. |

Lo que **no** es un conector válido en Loges-BIAP: cualquier mecanismo que descargue una página y siga sus enlaces para "ver qué encuentra", o que extraiga contenido no destinado a consulta pública (áreas autenticadas, contenido protegido por robots.txt o términos de uso que lo prohíban explícitamente — esto se resuelve en el Documento 012-B, no aquí).

## 2. Contrato Técnico de un Conector

Todo conector implementa la misma interfaz interna, sin importar su tipo (sección 1):

```typescript
interface Conector {
  fuenteId: string;                 // referencia a `fuente` (Documento 005)
  consultar(parametros: ParametrosConsulta): Promise<RespuestaCruda>;
  limites: {
    solicitudesPorMinuto: number;
    intervaloMinimoMs: number;
  };
  saludable(): Promise<boolean>;    // chequeo de disponibilidad, sin consumir cupo de consulta real
}
```

- `parametros` son siempre los que la tarea de agente ya conoce (Documento 009, sección 2) — sector, país, identificador — nunca un conector decide por su cuenta qué buscar.
- `RespuestaCruda` incluye la fecha de la consulta y el `fuenteId`, y se entrega tal cual al Proveedor de Razonamiento (Documento 009) para estructurar — el conector no interpreta el contenido, solo lo obtiene.
- `limites` es información **declarada por el conector**, no una sugerencia: el Motor de Agentes (Documento 009, sección 6) la hace cumplir de forma dura a nivel de cola.

## 3. Categorías de Fuente por Módulo

Mapeo entre los módulos del Documento 003 y las categorías de fuente que necesitan (sin nombrar instituciones — eso es el Documento 012-B):

| Módulo (Documento 003) | Categorías de fuente relevantes |
|---|---|
| 3.1 Descubrimiento de Cargadores | Registros/estadísticas de comercio exterior (importación/exportación); registros mercantiles. |
| 3.2 Análisis de Competidores | Información corporativa pública (sitio propio del competidor, comunicados, registros mercantiles). |
| 3.3 Enriquecimiento de Proveedores | Registros de licencias/permisos de transporte y agentes aduanales; registros mercantiles. |
| 3.4 Inteligencia de Mercado y Tendencias | Estadísticas agregadas de comercio exterior (no requiere una fuente nueva — reutiliza lo recolectado por 3.1). |

**Nota agregada (agosto 2026) — caso de importación consolidada:** el cliente identificó un patrón real que la tabla anterior no cubría bien: muchos cargadores potenciales objetivo (ej. comerciantes minoristas informales agrupados por rubro y zona, como los repuesteros de un centro comercial popular) **no importan a su propio nombre** — varios se agrupan y un tercero (consolidador/agente de carga) importa un contenedor completo a su nombre, distribuyendo la mercadería entre ellos ya en destino. Para este patrón, "Registros/estadísticas de comercio exterior" (3.1) solo revela al **consolidador**, nunca a los comerciantes individuales — son datos de categorías distintas, con propósitos distintos:

- Para descubrir a los comerciantes individuales (el objetivo comercial real): **registro mercantil/tributario general filtrado por actividad económica y ubicación** (ej. RUC por rubro y distrito) — ya estaba nombrado como categoría en la tabla ("registros mercantiles"), pero antes se asumía secundario frente al dato de comercio exterior; para este patrón es la fuente **primaria**, no secundaria.
- Para identificar al consolidador (relevante para 3.2, como competidor/intermediario, o para 3.3 si se evalúa como aliado en vez de competencia): sí aplica el dato de comercio exterior de la tabla, buscando importadores de alta frecuencia de mercadería variada consistente con reventa fragmentada, no un importador único de gran volumen homogéneo.

## 4. Ciclo de Vida de un Conector

```
1. Propuesto     → se identifica una categoría de fuente (sección 3) con una institución candidata concreta.
2. En validación → el Documento 012-B revisa: ¿es legal usarla en el/los país(es) de interés?
                   ¿bajo qué condiciones (límites de tasa, atribución, uso comercial permitido)?
3. Construido    → se implementa el contrato de la sección 2 contra esa fuente concreta.
4. Activo        → `fuente.activa = true` y `fuente.terminos_uso_verificados = true`
                   (Documento 005) — ambas condiciones son obligatorias, no basta una.
5. Monitoreado   → `saludable()` se ejecuta periódicamente; fallos repetidos desactivan
                   el conector automáticamente (Documento 009, sección 7).
6. Revalidación  → si la fuente cambia sus términos de uso o su formato de respuesta,
                   vuelve al paso 2 antes de reactivarse.
```

**Ningún conector puede pasar del paso 3 al 4 sin que `terminos_uso_verificados` esté en `true`.** Esta es una regla de arquitectura, no solo de proceso: el backend debe rechazar la activación de una fuente que no tenga esa bandera, independientemente de si el conector ya está construido y probado técnicamente.

## 5. Manejo de Cambios y Fallos de una Fuente

- Si una fuente cambia el formato de su respuesta de forma incompatible, el conector debe fallar de forma explícita (excepción tipada), nunca intentar "adivinar" la estructura nueva — eso es responsabilidad de una actualización deliberada del conector, no de un intento silencioso de tolerancia a fallos que podría estructurar mal un dato sin que nadie lo note.
- Todo fallo de conector se refleja en `ejecucion_agente.estado = fallido` (Documento 005/009), visible en el Monitor de Administración (Documento 006, sección 7).
- Un conector no reintenta agresivamente ante un error de la fuente (ej. HTTP 429, 503): aplica retroceso exponencial y respeta cualquier cabecera de reintento (`Retry-After`) que la fuente indique.

## 6. Relación con los Siguientes Documentos

El **Documento 012-B — Cumplimiento Legal de Fuentes** es el paso obligatorio siguiente: decide qué instituciones concretas, por país, pueden implementarse como conectores según este contrato, y bajo qué condiciones. El Documento 013 — Infraestructura y Despliegue debe considerar que el backend necesita salida de red hacia estas fuentes externas (relevante junto con la restricción de VPN del Documento 004). El Documento 014 — Plan de Pruebas debe incluir pruebas específicas de comportamiento ante fuentes caídas, con formato cambiado, o que excedan el límite de tasa — no solo el camino feliz.

## 7. Primer Conector Real Construido — Padrón RUC, Perú (agosto 2026)

Tras la aprobación (con salvedad de transparencia, Documento 012-B sección 9) de la fuente "Padrón RUC - Datos Abiertos (SUNAT, Perú)", se construyó el primer conector real del proyecto (`ConectorRealPadronRucPeru`), reemplazando a los candidatos sintéticos de Perú del conector simulado (Documento 014, sección 6) — Costa Rica sigue sin fuente real aprobada, así que su catálogo sintético se mantiene sin cambios.

**Desviación deliberada del ciclo puramente "en vivo":** el dataset real es un CSV de ~3.3 GB publicado mensualmente (sin API de consulta), demasiado grande para descargar en cada ejecución del Motor de Agentes sin violar el principio de respetar los límites de la fuente (Documento 012-B, sección 3, pregunta 6). Por eso el conector no llama a la fuente en vivo: lee un **caché local pre-filtrado** (`apps/api/prisma/data/padron-ruc-lima-cache.json`, generado y regenerado por `scripts/actualizar-cache-padron-ruc.ts`, corrido manualmente — no automatizado con cron todavía). El script descarga el ZIP, lo procesa en streaming (nunca carga los ~3.3 GB completos en memoria), y guarda solo las filas de Lima que coinciden con los rubros de interés del cliente (repuestos automotrices, textiles, ropa, calzado, accesorios de celular — los mismos del catálogo sintético original). Al 2026-08-20, sobre 13.36 millones de filas nacionales, esto produjo ~154 mil candidatos filtrados para Lima.

**Limitación real descubierta al construirlo, no asumida de antemano:** el dataset real no expone razón social ni dirección exacta — solo RUC, actividad económica y ubicación a nivel distrito (ver Documento 012-B, sección 8-D, corregida el 2026-08-20 tras inspeccionar el archivo real en vez de confiar en investigación previa sin verificar). El conector nunca inventa un nombre: usa `"RUC {numero} (sin razon social - el Padron RUC no la expone)"` como marcador explícito, y la dirección aproximada se marca igual de explícita como "ubicación aproximada por distrito". Esta es una decisión de producto explícita del cliente (2026-08-20): construir el conector igual, aceptando candidatos sin nombre como punto de partida para prospección manual del equipo comercial, en vez de esperar a evaluar legalmente un segundo servicio (la consulta interactiva de SUNAT) que sí tendría nombre.

**Mantenimiento pendiente, explícito:** el caché debe regenerarse corriendo `npm run actualizar:padron-ruc` (desde `apps/api`) cada vez que SUNAT publique una versión nueva del Padrón RUC (mensual) — no hay automatización todavía. El archivo de caché no se versiona en git (`.gitignore`) por su tamaño y porque es datos derivados, reproducibles corriendo el script.

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) antes de continuar con el Documento 012-B, conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
