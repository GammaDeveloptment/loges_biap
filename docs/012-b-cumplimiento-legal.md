# Documento 012-B — Cumplimiento Legal de Fuentes de Comercio Exterior y Datos

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.4
**Fecha:** Julio 2026 (actualizado agosto 2026)

---

## 0. Contexto y Advertencia de Alcance

**Este documento es un marco metodológico, no una opinión legal.** Define qué preguntas hay que responder, con qué criterio y quién debe responderlas, antes de que cualquier fuente candidata del Documento 012 pueda activarse como conector real. **No contiene conclusiones legales sobre países, instituciones o fuentes específicas**, porque esas conclusiones requieren asesoría legal calificada por país (Documento 002, sección 8) — algo que está fuera de lo que este proceso de documentación puede generar de forma responsable.

Esto no es una limitación cosmética: es la aplicación directa de la propia regla del proyecto (`CLAUDE.md`, sección 9): *"Cero ambigüedad sobre qué fuentes de datos son legalmente utilizables antes de iniciar el Documento 012."* Una ambigüedad resuelta con una suposición no verificada sigue siendo una ambigüedad — solo que oculta.

## 1. Objetivo

Que ninguna fuente pase de "candidata" (Documento 012, sección 3) a "activa" (`fuente.activa = true` y `fuente.terminos_uso_verificados = true`, Documento 005) sin haber pasado por una evaluación explícita, documentada y con responsable identificado — nunca por una decisión implícita de un desarrollador al construir el conector.

## 2. Principios Legales Generales (aplican a cualquier fuente, antes de la revisión específica por país)

Estos son criterios de evaluación, no verificaciones ya hechas:

1. **Acceso público real, no acceso obtenido evadiendo una restricción.** Una fuente detrás de autenticación, con `robots.txt` que la excluye explícitamente, o con términos de uso que prohíben el acceso automatizado, no califica como "pública" para este propósito aunque el contenido en sí sea de interés público.
2. **Los términos de uso explícitos priman sobre la intuición de "es información pública".** Que una entidad gubernamental publique un dato no significa automáticamente que su reuso comercial esté permitido — algunos marcos regulatorios distinguen entre "publicado para consulta ciudadana" y "disponible para explotación comercial por terceros".
3. **Distinción entre datos de empresa y datos personales.** Loges-BIAP recolecta tanto datos corporativos (`empresa`, `registro_comercio_exterior`) como datos de personas naturales (`contacto`: nombre, cargo, email, teléfono — Documento 005, sección 3.4). Los segundos activan leyes de protección de datos personales que no necesariamente aplican a los primeros, y esas leyes varían por país.
4. **Normativa aduanera específica.** Varios países regulan de forma particular el uso de datos de comercio exterior (declaraciones de importación/exportación) más allá de la ley de protección de datos general — esto debe revisarse como un criterio propio, no asumirse cubierto por el punto 2.
5. **Límites técnicos como límites legales.** Un límite de tasa o una condición de atribución indicada en los términos de uso de una fuente no es una sugerencia técnica opcional — es parte de la condición bajo la cual el uso es legal, y el conector (Documento 012, sección 2) debe implementarla como tal.

## 3. Marco de Evaluación por Fuente (checklist)

Para cada institución candidata identificada dentro de una categoría del Documento 012 (sección 3), la evaluación debe responder, con respaldo de asesoría legal:

| # | Pregunta | Por qué importa |
|---|---|---|
| 1 | ¿El acceso es público, sin necesidad de autenticación ni de evadir una restricción técnica? | Condición mínima de entrada (principio 1). |
| 2 | ¿Qué dicen los términos de uso explícitos (o `robots.txt`) sobre acceso automatizado y reuso comercial? | Principio 2. |
| 3 | ¿Qué tipo de dato expone: solo corporativo, o también personal (contactos de personas naturales)? | Principio 3 — determina si aplica ley de protección de datos personales. |
| 4 | Si expone datos personales, ¿bajo qué base legal del país correspondiente se puede procesar (interés legítimo, dato ya público por ley, consentimiento, otra)? | Principio 3. |
| 5 | ¿Existe normativa aduanera o sectorial específica del país que restrinja el uso de este tipo de dato más allá de la ley general? | Principio 4. |
| 6 | ¿Qué límites de tasa, atribución o condiciones de uso impone la fuente, y quedan reflejados en la configuración del conector (Documento 012, sección 2)? | Principio 5. |
| 7 | ¿Requiere un registro, convenio o autorización formal con la entidad fuente antes de integrarse? | Puede aplicar incluso si el acceso técnico ya es posible. |
| 8 | Nivel de riesgo resultante (bajo / medio / alto) y justificación. | Para decidir prioridad de revisión, no para evitarla. |

## 4. Plantilla de Registro por Fuente

Cada fuente evaluada se documenta con esta estructura (una fila = una fuente candidata evaluada), sirviendo de respaldo directo al campo `fuente.terminos_uso_verificados` del Documento 005:

| Campo | Contenido |
|---|---|
| País | |
| Categoría (Documento 012, sección 3) | |
| Institución candidata | |
| Tipo de dato expuesto | Corporativo / Personal / Ambos |
| Base legal aplicable (si datos personales) | |
| Normativa sectorial/aduanera aplicable | |
| Límites de uso identificados (tasa, atribución, otros) | |
| Resultado | Aprobada / Rechazada / Pendiente |
| Responsable de la validación | Nombre y calidad (ej. asesoría legal externa, legal interno de Gammacargo) |
| Fecha de validación | |
| Referencia del respaldo legal | Documento, dictamen u opinión que sustenta el resultado |

**Estado a la fecha de este documento: ninguna fuente candidata del Documento 012 tiene una fila completada con resultado "Aprobada".** Todas están, por defecto, en "Pendiente" — este es un hecho sobre el estado del proyecto, no una opinión legal sobre las fuentes en sí.

## 5. Casos que Requieren Atención Especial

- **Datos personales en `contacto` (Documento 005).** Antes de aprobar cualquier fuente que exponga nombre, cargo, correo o teléfono de una persona, debe confirmarse la base legal aplicable en el país de esa persona, no solo en el país de Gammacargo — el comercio exterior es, por definición, transfronterizo.
- **Compilación de bases de datos completas vs. consulta puntual.** El Documento 012 (sección 1) ya limita los conectores a consultas puntuales o descargas estructuradas declaradas, en vez de extracción masiva — esto reduce el riesgo, pero la evaluación legal (sección 3) igual debe confirmarlo caso por caso, ya que algunos marcos protegen la compilación de una base de datos como derecho propio del compilador original, independientemente del método de extracción.
- **Reglas de comercio exterior país-específicas.** El hecho de que una fuente de comercio exterior sea legal de usar en el país de origen del dato no garantiza que su uso por parte de una empresa de otro país (Gammacargo) esté igualmente permitido — esto debe evaluarse explícitamente, no asumirse por simetría.
- **Registro mercantil/tributario general como fuente primaria de descubrimiento (agregado agosto 2026).** El cliente confirmó que **Perú es un mercado real objetivo**, y describió un patrón de negocio concreto: comerciantes pequeños que se agrupan para importar a través de un tercero consolidador, en vez de importar cada uno a su propio nombre (Documento 012, sección 3, nota agregada). Para este patrón, la fuente de comercio exterior no sirve para descubrir a los comerciantes individuales — solo al consolidador. La fuente que sí aplicaría es un **registro mercantil/tributario general filtrado por actividad económica y ubicación** (ej. RUC/SUNAT por rubro y distrito en Perú). Es una categoría de fuente ya contemplada en el Documento 012, pero con un peso distinto al que se le había dado hasta ahora — debe evaluarse con la misma prioridad que la fuente de comercio exterior, no como secundaria, cuando Gammacargo designe a quien ejecute la evaluación de la sección 3. Nota importante: al ser un registro tributario/mercantil general, es más probable que mezcle datos personales (persona natural con negocio propio, común en comercio informal) con datos corporativos — aplica con más fuerza el criterio del principio 3 de este documento.

## 6. Gobernanza y Responsabilidad de Aprobación

- Ninguna fuente se marca `terminos_uso_verificados = true` (Documento 005) sin que exista una fila completa de la plantilla de la sección 4, con responsable y referencia identificados.
- El responsable de aprobar una fuente **debe ser una persona designada por Gammacargo con respaldo de asesoría legal**, nunca el equipo de desarrollo por su cuenta — el equipo de desarrollo implementa el conector (Documento 012) una vez que la fuente ya fue aprobada, no antes ni en paralelo.
- Se recomienda extender el esquema de `fuente` (Documento 005) con tres campos de soporte a esta gobernanza: `aprobado_por`, `fecha_aprobacion_legal`, `referencia_legal` — de forma que la aprobación quede trazable en el mismo dato, igual que se exige trazabilidad para cualquier otro hecho del sistema (Documento 005, sección 4).

## 7. Relación con los Siguientes Documentos

Ninguna fuente candidata del Documento 012 puede convertirse en un conector activo sin pasar por el proceso de este documento — esto bloquea directamente la Entrega 2 del Documento 007 (MVP de Descubrimiento de Cargadores) hasta que al menos una fuente, en al menos un país, tenga una fila "Aprobada" en la plantilla de la sección 4. El Documento 013 — Infraestructura y Despliegue no debe habilitar salida de red hacia ninguna fuente que no tenga ese estado. El Documento 014 — Plan de Pruebas debe verificar que el sistema efectivamente rechaza la activación de una fuente sin `terminos_uso_verificados = true`, no solo que lo permite cuando sí lo tiene.

## 8. Anexo — Investigación Factual de Fuentes Candidatas para Perú (agosto 2026)

**Advertencia de alcance, otra vez:** lo que sigue es investigación puramente factual hecha por el equipo de desarrollo para adelantarle trabajo al responsable de la evaluación legal (sección 6) — **no es una evaluación del checklist de la sección 3, no llena la plantilla de la sección 4, y no constituye ninguna conclusión sobre si el uso de estas fuentes es legal.** Varios puntos quedan marcados explícitamente como no verificados; no deben asumirse como confirmados.

### A. Registro mercantil/tributario general (para descubrir comerciantes por rubro + ubicación, Documento 012 §3 nota agregada)

| Fuente | Tipo de consulta | API | Términos de uso | Tipo de dato |
|---|---|---|---|---|
| **SUNAT — Consulta RUC** (`e-consultaruc.sunat.gob.pe`) | Solo puntual: por RUC, DNI/CE/pasaporte, o razón social ya conocida. **No permite filtrar por actividad económica ni distrito** — no sirve para "descubrir" empresas nuevas por rubro/zona. | Existe una API oficial pero para validación de comprobantes de pago, requiere credenciales SOL del propio contribuyente — no es una API pública de búsqueda de terceros. | No se localizó una página de términos de uso general (solo aviso de copyright). **No verificado.** | Mezcla persona natural con negocio y persona jurídica, sin distinción de acceso. |
| **Datos Abiertos — Padrón RUC** (`datosabiertos.gob.pe`) | Descarga masiva (no interactiva), publicaciones mensuales desde abril 2022. Formato CSV/ZIP — permitiría filtrar localmente por rubro/ubicación una vez descargado (inferido, columnas exactas no confirmadas). | N/A (descarga directa). | Licencia **Open Data Commons Attribution (ODC-BY)** indicada en la plataforma — reuso permitido con atribución a SUNAT. | Mezcla persona natural y jurídica. |
| **SUNARP — Directorio de Personas Jurídicas** (`sunarp.gob.pe/bus-personas-juridicas.asp`) | Búsqueda por nombre/razón social; sin filtro por actividad ni ubicación. Gratuita, sin registro (según fuentes secundarias, no confirmado en vivo). | No se encontró API oficial. | El propio directorio se declara "referencial, sin valor legal probatorio". | Datos corporativos (personas jurídicas) únicamente. |

### B. Comercio exterior (para identificar al consolidador/importador)

| Fuente | Tipo de consulta | API | Términos de uso | Tipo de dato |
|---|---|---|---|---|
| **SUNAT — Estadísticas de Comercio Exterior** (`sunat.gob.pe/estad-comExt`) | Tablas predefinidas descargables, **desglosadas por importador/exportador individual** (razón social/RUC visible), además de por aduana, país y partida arancelaria. Cobertura observada mayormente 2000-2017 en las páginas revisadas — **vigencia de datos más recientes no verificada**. | No se encontró API documentada. | No encontrados explícitamente. | Corporativo (razón social/RUC del importador o exportador formal). |
| **SUNAT — Operatividad Aduanera** (antes "ADUANET") | Portal para operadores/despachadores autorizados y clasificación arancelaria — no es un buscador de estadísticas por empresa. Propósito distinto al de arriba. | — | — | — |
| **VUCE** (`vuce.gob.pe`, MINCETUR) | Sistema transaccional de trámites (permisos, licencias sanitarias/fitosanitarias) con autenticación de usuario — **no se encontró evidencia de que exponga públicamente listados o estadísticas de empresas importadoras/exportadoras**. Función de ventanilla de trámites, no de repositorio estadístico. | — | — | — |
| **MINCETUR — Datos Abiertos** | 8 datasets publicados en `datosabiertos.gob.pe`, contenido no revisado individualmente — pendiente si se necesita. | — | — | — |

**Puntos explícitamente no verificados/pendientes**, a resolver por quien haga la evaluación real: términos de uso formales de SUNAT sobre uso automatizado; columnas exactas del padrón RUC; contenido y licencia del dataset de SUNARP en datos abiertos; vigencia post-2017 de las estadísticas de comercio exterior de SUNAT; contenido de los 8 datasets de MINCETUR.

**Lectura preliminar solo para orientar dónde mirar primero** (no es una recomendación de aprobación): de lo investigado, el **Padrón RUC de Datos Abiertos** es la única fuente de la Categoría A con licencia de reuso explícita encontrada y con datos descargables en bulk — sería el punto de partida más eficiente para que el responsable legal empiece su revisión formal.

### C. Redes sociales (TikTok, Meta/Instagram) — vías oficiales investigadas, ninguna viable como mecanismo de descubrimiento (agosto 2026)

Se evaluó si alguna herramienta oficial de estas plataformas (no scraping) podría servir para descubrir negocios pequeños por categoría/ubicación. Hallazgo factual, no legal: **ninguna de las tres plataformas ofrece hoy un mecanismo oficial de búsqueda de negocios por categoría/ubicación.**

- **Meta Ad Library** (`facebook.com/ads/library`): de acceso público, permite filtrar por país (incluido Perú) y palabra clave, y **solo** si el negocio paga publicidad activa en ese momento — devuelve nombre de la Página anunciante y un enlace a ella, nunca teléfono/email directo. Utilidad real: baja, porque la mayoría de comercios informales del tipo descrito no suelen pagar anuncios. La cobertura de la **API** (`ads_archive`) para anuncios comerciales no-políticos en Perú específicamente **no quedó confirmada** — solo el sitio web se verificó funcionando así.
- **Meta Graph API (búsqueda de Páginas)**: la búsqueda abierta de páginas por categoría/ubicación fue eliminada por Meta desde ~2018-2019 y sigue sin existir en 2026 — la función vigente ("Page Public Content Access") solo sirve para consultar una Página que ya se conoce, requiere aprobación de Meta, no para descubrir nuevas.
- **TikTok Research API**: sigue restringida a instituciones académicas/ONG en regiones específicas (no incluye Perú) y **prohíbe explícitamente su uso para herramientas comerciales** — queda descartada para este proyecto, no solo por dificultad de acceso sino por prohibición contractual directa.
- **Instagram (Graph API "Business Discovery")**: solo permite consultar una cuenta cuyo `username` ya se conoce de antemano — no es una búsqueda por categoría/ubicación.
- **Herramientas de audiencia/insights** (TikTok Creative Center, sucesoras de Meta Audience Insights): dan solo datos demográficos/de tendencia agregados, nunca nombres de negocios específicos.

**Conclusión de esta investigación:** no existe hoy una vía de redes sociales, oficial y dentro de términos de servicio, comparable en utilidad al Padrón RUC de la Categoría A. Cualquier herramienta que sí "buscara" negocios en estas plataformas por palabra clave implicaría scraping no autorizado por sus términos de uso — fuera del alcance de este proyecto (`CLAUDE.md`: *"no hacemos scraping, no hacemos crawling"*).

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) — en este caso, además, requiere que Gammacargo designe quién ejecuta la evaluación legal real de la sección 3 antes de que el proyecto pueda avanzar a la Entrega 2 del Documento 007. Se continúa con el Documento 013 conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
