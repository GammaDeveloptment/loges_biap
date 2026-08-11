# Documento 012-B — Cumplimiento Legal de Fuentes de Comercio Exterior y Datos

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.1
**Fecha:** Julio 2026

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

## 6. Gobernanza y Responsabilidad de Aprobación

- Ninguna fuente se marca `terminos_uso_verificados = true` (Documento 005) sin que exista una fila completa de la plantilla de la sección 4, con responsable y referencia identificados.
- El responsable de aprobar una fuente **debe ser una persona designada por Gammacargo con respaldo de asesoría legal**, nunca el equipo de desarrollo por su cuenta — el equipo de desarrollo implementa el conector (Documento 012) una vez que la fuente ya fue aprobada, no antes ni en paralelo.
- Se recomienda extender el esquema de `fuente` (Documento 005) con tres campos de soporte a esta gobernanza: `aprobado_por`, `fecha_aprobacion_legal`, `referencia_legal` — de forma que la aprobación quede trazable en el mismo dato, igual que se exige trazabilidad para cualquier otro hecho del sistema (Documento 005, sección 4).

## 7. Relación con los Siguientes Documentos

Ninguna fuente candidata del Documento 012 puede convertirse en un conector activo sin pasar por el proceso de este documento — esto bloquea directamente la Entrega 2 del Documento 007 (MVP de Descubrimiento de Cargadores) hasta que al menos una fuente, en al menos un país, tenga una fila "Aprobada" en la plantilla de la sección 4. El Documento 013 — Infraestructura y Despliegue no debe habilitar salida de red hacia ninguna fuente que no tenga ese estado. El Documento 014 — Plan de Pruebas debe verificar que el sistema efectivamente rechaza la activación de una fuente sin `terminos_uso_verificados = true`, no solo que lo permite cuando sí lo tiene.

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) — en este caso, además, requiere que Gammacargo designe quién ejecuta la evaluación legal real de la sección 3 antes de que el proyecto pueda avanzar a la Entrega 2 del Documento 007. Se continúa con el Documento 013 conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
