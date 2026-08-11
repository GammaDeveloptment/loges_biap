# Documento 014 — Plan de Pruebas

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.1
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento reúne y formaliza las pruebas que los Documentos 003-013 ya fueron señalando como necesarias a lo largo de la serie (cada uno con su propio "esto debe probarse"), en vez de dejarlas dispersas. `CLAUDE.md` ya exige que "cada módulo debe entregarse con pruebas... no se avanza al siguiente módulo sin esto" — este documento define **qué tipo de prueba corresponde a qué regla**, para que esa exigencia sea verificable y no una formalidad.

## 1. Principio Rector

La mayoría de los sistemas prueban bien "lo que el sistema debe hacer". Loges-BIAP, por el tipo de reglas que tiene (permisos, cumplimiento legal, trazabilidad), depende igual de probar **lo que el sistema no debe hacer**: un rol no debe ver datos fuera de su alcance (Documento 011), una fuente no aprobada no debe poder activarse (Documento 012-B), un dato no debe presentarse sin fuente y confianza (Documento 003). Cada sección de este documento incluye explícitamente casos de "debe rechazar/excluir/negar", no solo de camino feliz.

## 2. Niveles de Prueba

| Nivel | Qué cubre | Ejemplo en Loges-BIAP |
|---|---|---|
| Unitaria | Lógica de negocio aislada | Regla de asignación de `nivel_confianza` (Documento 009, sección 5). |
| Integración | Interacción entre componentes reales (BD, cola) | Un job de BullMQ escribe correctamente en `ejecucion_agente` y `historial_cambio`. |
| Contrato de API | Cumplimiento del Documento 010 | Cada endpoint responde con el formato de error y el patrón "dato trazable" documentados. |
| Extremo a extremo (E2E) | El flujo completo del Documento 003, sección 4 | Un usuario de Comercial busca, ve resultados, abre una ficha y la marca como contactada. |
| Seguridad/permisos | Documento 011 | Un usuario de un área no puede leer ni escribir lo que su matriz de permisos le niega. |
| Resiliencia de infraestructura | Documento 013 | Comportamiento ante caída de VPN, de una fuente, o de Redis. |

## 3. Matriz de Pruebas Obligatorias por Regla de Negocio

Esta tabla es la síntesis del documento: cada fila viene de una regla ya escrita en un documento anterior.

| Regla | Origen | Prueba obligatoria |
|---|---|---|
| Ningún dato se presenta sin fuente y confianza | Documento 003, §5 | Prueba de contrato: toda respuesta de `/empresas/{id}` con campos enriquecibles incluye `fuente` y `nivel_confianza` (Documento 010, §3). |
| El nivel de confianza sube con corroboración cruzada, nunca se asigna a mano | Documento 009, §5 | Prueba unitaria: dos fuentes independientes coincidiendo eleva el nivel; una API que intente fijar `nivel_confianza` directamente debe rechazarse. |
| Discrepancia entre fuentes no se promedia, se registra y marca pendiente | Documento 009, §5 | Prueba unitaria + integración: verificar la fila en `historial_cambio` y el estado `pendiente de reverificación`. |
| Empresa con `cliente_actual` o interacción `descartado` se excluye del descubrimiento | Documento 005, §3.11; Documento 009, §2.1 | Prueba de integración: una tarea de `descubrimiento_cargador` no debe re-proponer una empresa en ese estado. |
| Un agente solo usa conectores declarados para su tarea | Documento 009, §9 | Prueba unitaria: invocar un conector no autorizado para un tipo de tarea debe fallar. |
| Ninguna fuente se activa sin `terminos_uso_verificados = true` | Documento 012, §4; Documento 012-B, §7 | Prueba de integración: intentar activar una fuente sin esa bandera debe ser rechazado por el backend, no solo advertido. |
| Límite de concurrencia por fuente | Documento 009, §6 | Prueba de carga: N tareas simultáneas sobre la misma fuente nunca exceden su límite declarado (Documento 012, §2). |
| Un rol no accede a lo que su matriz le niega | Documento 011, §3 | Prueba de seguridad por cada combinación rol × recurso denegado — no solo los permitidos. |
| RLS aplica aunque el backend tenga un error de lógica | Documento 011, §5 | Prueba de integración directa contra PostgreSQL (sin pasar por el backend) confirmando que la política de RLS igual filtra. |
| `historial_cambio` es append-only | Documento 005, §5 | Prueba de integración: intentar un `UPDATE`/`DELETE` directo sobre esa tabla debe estar bloqueado a nivel de base de datos, no solo por convención de la aplicación. |
| Fallo de conector no se tolera en silencio | Documento 012, §5 | Prueba de integración: simular una fuente con formato cambiado y confirmar que la tarea queda `fallido`, no que estructura datos incorrectos. |
| Sincronización con HubSpot es idempotente | Documento 010, §1, §4.5 | Prueba de integración: dos solicitudes idénticas de `POST /sincronizaciones` en curso no generan dos registros en HubSpot. |

## 4. Pruebas por Entrega (alineadas al Documento 007)

Cada entrega del roadmap tiene ya un "criterio de salida" (Documento 007) — este documento exige que ese criterio se verifique con una prueba automatizada, no solo con una revisión manual:

| Entrega (Documento 007) | Prueba que certifica el criterio de salida |
|---|---|
| 0 — Fundaciones | E2E de login por cada área con la navegación esperada (Documento 006, §2 filtrada por rol). |
| 1 — Motor de Agentes (esqueleto) | Integración: una tarea de prueba se encola, ejecuta y registra de extremo a extremo. |
| 2 — Descubrimiento de Cargadores (MVP) | E2E completo de la sección 2 de este documento (fila 1). **Ver sección 6 sobre el uso de conectores simulados mientras el Documento 012-B no tenga una fuente aprobada.** |
| 3 — Proveedores y Competidores | E2E de evaluación de proveedor y de alerta de cambio de competidor. |
| 4 — Motor de IA | Unitarias de verificación cruzada (fila 2-3 de la sección 3). |
| 5 — API + Interfaz Web | Pruebas de contrato completas del Documento 010. |
| 6 — Administración y Tendencias | E2E del panel de Administración (fuentes, monitor de agentes) y de tendencias (solo lectura). |
| 7 — Integraciones CRM/ERP | Integración del adaptador HubSpot (Documento 010, §4.5.1), incluyendo el caso de idempotencia. |
| 8 — Producción | Pruebas de resiliencia de infraestructura (sección 7 de este documento). |

## 5. Pruebas de Calidad de Datos

Más allá de la lógica (sección 3), se valida periódicamente sobre datos reales ya en producción (no solo en desarrollo):

- Ninguna fila de `empresa_atributo` o `contacto` vigente debería carecer de `fuente_id`.
- Ninguna fuente con `activa = false` debería tener tareas de agente ejecutándose contra ella (Documento 012, §4).
- Proporción de datos con `fecha_ultima_verificacion` vencida (Documento 003, §3.5) — no es un "fallo" binario, pero se reporta como métrica de salud del sistema, visible en el panel de Administración (Documento 006, §7).

## 6. Entorno y Datos de Prueba: Restricción Importante

**Los ambientes de desarrollo y pruebas (Documento 013, §1) no deben consultar fuentes externas reales que aún no tengan `terminos_uso_verificados = true` (Documento 012-B)** — hacerlo en un ambiente de pruebas sería la misma violación que hacerlo en producción, ya que igualmente consulta la fuente real. En consecuencia:

- Todo conector (Documento 012, §2) debe tener una **implementación simulada (mock)** que responde con datos sintéticos representativos, usada por defecto en pruebas automatizadas y en desarrollo local mientras una fuente no esté aprobada.
- El uso del conector real, incluso en el ambiente de Pruebas/Staging, requiere la misma aprobación del Documento 012-B que en producción — "staging" no es una excepción legal.
- Los datos sintéticos de prueba deben incluir deliberadamente casos de discrepancia entre fuentes, fuente caída, y formato inesperado, para ejercitar las filas 3 y 6 de la sección 3 sin depender de que una fuente real falle en el momento justo de la prueba.

## 7. Pruebas de Resiliencia de Infraestructura (Documento 013)

- Simulación de caída de conectividad VPN/backend-a-base de datos: el backend debe fallar de forma explícita (Documento 004, §3, mitigación de *circuit breaker*), no colgarse ni devolver datos parciales silenciosamente.
- Simulación de caída de Redis: las tareas en cola no se pierden de forma inconsistente — se verifica contra `ejecucion_agente` como fuente de verdad (Documento 013, §6).
- Prueba de restauración de backup de la base de datos — pendiente de poder ejecutarse hasta que el Documento 013 (sección 8) confirme la política de backup con el equipo de soporte de Gammacargo.

## 8. Criterios de Salida de Cobertura

- Ninguna entrega del Documento 007 se considera completa sin que las filas de la sección 3 relevantes a esa entrega tengan una prueba automatizada pasando — no basta con verificación manual puntual.
- Un cambio que modifique una regla de negocio ya cubierta por la sección 3 debe actualizar su prueba correspondiente en el mismo cambio, no dejarla desactualizada para después.

## 9. Relación con los Siguientes Documentos

El Documento 015 — Manual del Desarrollador debe explicar cómo ejecutar cada nivel de prueba de la sección 2 localmente, incluyendo cómo activar los conectores simulados de la sección 6.

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) antes de continuar con el Documento 015, conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
