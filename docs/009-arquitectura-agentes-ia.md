# Documento 009 — Arquitectura de Agentes de IA

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.1
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento es, junto con el Documento 012, el núcleo técnico diferenciador de Loges-BIAP (`CLAUDE.md`, sección 6): si algo aquí entra en conflicto con lo escrito en los Documentos 003-005, son estos documentos los que deben ajustarse, no al revés — pero hasta ahora no ha aparecido ningún conflicto; este documento detalla mecanismos que los Documentos 003 (módulo 3.6), 004 (secciones 4-5) y 005 (secciones 4 y 6) ya dejaron anunciados.

**Principio no negociable (Documento 001):** No hacemos scraping. No hacemos crawling. No hacemos IA como fin en sí mismo. En términos de arquitectura, esto significa que un agente **nunca navega la web de forma abierta ni extrae contenido de páginas no autorizadas** — solo consulta **conectores definidos y auditados** (Documento 012) hacia fuentes públicas concretas (registros mercantiles, aduaneros, cámaras de comercio, estadísticas de comercio exterior), cuyo uso ya fue validado legalmente (Documento 012-B). La IA se usa para **comprender, estructurar y verificar** lo que esos conectores devuelven — no para decidir qué sitio visitar por su cuenta.

## 1. Dos Piezas Distintas: Motor de Agentes vs. Proveedor de Razonamiento

Tal como quedó anunciado en el Documento 007 (Entregas 1 y 4), la arquitectura separa dos responsabilidades que suelen confundirse bajo el nombre genérico "agente de IA":

| Pieza | Qué hace | Con qué se construye |
|---|---|---|
| **Motor de Agentes** (orquestador) | Decide qué tarea ejecutar, cuándo, con qué prioridad, y cuántas tareas corren a la vez por fuente. No entiende el contenido de los datos. | BullMQ + Redis (Documento 004, sección 5). |
| **Proveedor de Razonamiento** (interfaz interna) | Recibe el contenido crudo que devuelve un conector y lo convierte en datos estructurados, resuelve conflictos entre fuentes y decide el nivel de confianza. Es quien "entiende". | Anthropic Claude, API + Agent SDK, detrás de una interfaz propia (Documento 004, sección 4). |

Esta separación es la que permite, según el Documento 004, cambiar de proveedor de IA en el futuro sin tocar el orquestador, y escalar la cantidad de workers sin depender del proveedor de IA.

## 2. Tipos de Tarea de Agente

Cada fila de `ejecucion_agente` (Documento 005, sección 6) corresponde a uno de estos cuatro tipos:

### 2.1 `descubrimiento_cargador`

- **Entrada:** criterios definidos por Comercial (sector, país, tipo de carga — Documento 003, 3.1) o una regla de actualización programada.
- **Proceso:** el Motor de Agentes consulta los conectores de fuentes de comercio exterior relevantes para esos criterios (Documento 012); el Proveedor de Razonamiento extrae de la respuesta cruda los campos de `empresa` y `registro_comercio_exterior` (Documento 005), y verifica que la empresa no tenga ya el rol `cliente_actual` ni una interacción `descartado` vigente (Documento 005, sección 3.11) antes de proponerla como candidata.
- **Salida:** filas nuevas o actualizadas en `empresa`, `empresa_rol` (`cargador_candidato`), `registro_comercio_exterior`.

### 2.2 `enriquecimiento_proveedor`

- **Entrada:** zona geográfica y tipo de servicio requerido (Documento 003, 3.3).
- **Proceso:** consulta conectores de fuentes sectoriales/registros de licencias; el Proveedor de Razonamiento estructura los datos de contacto y evidencia operativa, y verifica cruzado contra más de una fuente cuando estén disponibles.
- **Salida:** filas en `empresa`, `empresa_rol` (`proveedor_*`), `proveedor_perfil`, `contacto`.

### 2.3 `monitoreo_competidor`

- **Entrada:** lista de competidores ya registrados (`competidor_perfil`, Documento 005).
- **Proceso:** consulta periódica de fuentes públicas corporativas del competidor; el Proveedor de Razonamiento compara el estado nuevo contra el último estado conocido y decide si el cambio es significativo (nueva ruta, alianza, expansión) antes de generar una alerta — evita notificar ruido.
- **Salida:** filas en `competidor_cambio`.

### 2.4 `actualizacion_tendencia`

- **Entrada:** ninguna externa — se ejecuta sobre los datos ya acumulados en `registro_comercio_exterior`.
- **Proceso:** agregación periódica (no requiere razonamiento de lenguaje natural en la mayoría de los casos, es principalmente cálculo); el Proveedor de Razonamiento solo interviene si se necesita interpretar una variación atípica antes de publicarla.
- **Salida:** filas en `indicador_tendencia`.

## 3. Ciclo de Vida de una Tarea

```
1. Planificación   → el Motor de Agentes decide qué tarea ejecutar según prioridad
                      (antigüedad de última verificación, criterios pendientes, o
                      solicitud manual de un usuario).
2. Ejecución        → se consulta el/los conector(es) correspondientes (Documento 012),
                      respetando el límite de concurrencia por fuente (sección 6).
3. Estructuración   → el Proveedor de Razonamiento convierte la respuesta cruda en
                      campos del Documento 005.
4. Verificación cruzada → si existe más de una fuente para el mismo hecho, se
                      comparan; coincidencias elevan el nivel de confianza,
                      discrepancias generan una decisión explicable (sección 5).
5. Publicación      → se escriben/actualizan las filas correspondientes y una fila
                      en `historial_cambio` (Documento 005, sección 5).
6. Registro          → se actualiza `ejecucion_agente` (estado, resultado_resumen,
                      fecha_fin).
```

Ninguna tarea salta directamente del paso 2 al 5: todo dato pasa por estructuración y verificación antes de ser visible para un usuario, cumpliendo la regla del Documento 003 ("ningún dato se presenta sin su fuente y nivel de confianza").

## 4. Planificación y Priorización

El Motor de Agentes prioriza tareas según:

1. **Solicitud manual de un usuario** (ej. Comercial pide una búsqueda puntual) — máxima prioridad.
2. **Datos vencidos** — empresas o proveedores con `fecha_ultima_verificacion` más antigua se re-verifican antes que los recién actualizados.
3. **Cobertura de criterios activos** — sectores/países/rutas que Gammacargo ha marcado como relevantes (vía búsquedas frecuentes) se monitorean con más frecuencia que el resto.

Esto evita el patrón ingenuo de "recorrer todo de nuevo cada vez", que además violaría el principio de no sobrecargar las fuentes públicas (sección 6).

## 5. Verificación Cruzada y Nivel de Confianza

Regla ya anunciada en el Documento 005, sección 4, aquí detallada:

- Cada fuente tiene un `nivel_confianza_base` (Documento 005, 3.1).
- Si un mismo hecho (ej. el sector de una empresa) es reportado igual por **dos fuentes independientes**, el nivel de confianza sube un escalón sobre el más alto de los dos.
- Si dos fuentes **discrepan**, el Proveedor de Razonamiento no promedia ni adivina: registra ambas versiones en `historial_cambio` con su fuente respectiva, conserva la de mayor `nivel_confianza_base` como valor vigente, y marca el atributo como `pendiente de reverificación` (Documento 006, sección 5) para que una tercera fuente o una revisión humana lo resuelva.
- El nivel de confianza **nunca lo asigna un usuario a mano** — siempre es resultado de esta regla, para que sea auditable y repetible (Documento 005, sección 4).

## 6. Control de Concurrencia y Respeto a las Fuentes

- Cada conector (Documento 012) declara un límite de solicitudes concurrentes y un intervalo mínimo entre consultas, coherente con sus términos de uso verificados (Documento 012-B).
- El Motor de Agentes hace cumplir ese límite a nivel de cola (BullMQ, un límite de concurrencia por fuente, no solo un límite global) — así una fuente lenta o restrictiva no se ve sobrecargada aunque haya muchas tareas en cola para otras fuentes.
- Si una fuente indica error de límite excedido, la tarea se reintenta con retroceso exponencial, no en bucle inmediato.

## 7. Manejo de Errores

- Una tarea que falla (conector caído, respuesta no interpretable, error del Proveedor de Razonamiento) se marca en `ejecucion_agente.estado = fallido` con un `resultado_resumen` explicando el motivo — nunca falla en silencio.
- Los fallos son visibles en el Monitor del Motor de Agentes del panel de Administración (Documento 006, sección 7), no solo en logs técnicos.
- Un fallo repetido de la misma fuente (ej. 3 fallos consecutivos) marca la fuente como `activa = false` temporalmente y genera una alerta, en vez de seguir reintentando indefinidamente.

## 8. Estrategia de Modelos por Costo

Aplicando la estrategia ya definida en el Documento 004, sección 4:

| Tarea | Nivel de modelo | Por qué |
|---|---|---|
| Estructurar campos de una fuente ya identificada (secciones 2.1-2.2) | Intermedio | Alto volumen, tarea de extracción, bajo riesgo si se verifica cruzado después. |
| Resolver discrepancias entre fuentes (sección 5) | Superior | Baja frecuencia, requiere juicio, impacto directo en la confianza mostrada al usuario. |
| Detectar si un cambio de competidor es significativo (sección 2.3) | Superior | Evitar alertas de ruido tiene más valor que ahorrar costo aquí. |
| Cálculo de tendencias (sección 2.4) | Sin modelo (cálculo agregado) salvo interpretación de variaciones atípicas | La mayoría es agregación numérica, no comprensión de lenguaje. |

## 9. Alcance y Seguridad de las Herramientas del Agente

Un agente no tiene acceso de escritura directo a la base de datos ni a sistemas externos por su cuenta:

- Toda escritura pasa por el backend NestJS (Documento 004), que valida contra el esquema del Documento 005 antes de persistir.
- Un agente solo puede invocar los conectores declarados para su tipo de tarea (sección 2) — no puede "decidir" consultar una fuente distinta a la que su tarea define.
- Ninguna tarea de agente ejecuta acciones hacia el CRM/ERP de Gammacargo (Documento 003, módulo 3.7) directamente; la sincronización es un paso separado y auditable (`sincronizacion_externa`, Documento 005), no una acción del agente de descubrimiento.

## 10. Relación con los Siguientes Documentos

El Documento 010 — Especificación de API expone los resultados de estos agentes (nunca el proceso interno) hacia el CRM/ERP. El Documento 011 — Modelo de Permisos define quién puede disparar una tarea manual (sección 4, punto 1) frente a lo que corre solo de forma programada. El Documento 012 — Arquitectura de Scraping y Conectores define en detalle cada conector que este documento asume como dado, incluyendo sus límites de concurrencia (sección 6). El Documento 012-B — Cumplimiento Legal es la condición de entrada para que cualquiera de estos conectores pueda activarse en producción.

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) antes de continuar con el Documento 010, conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
