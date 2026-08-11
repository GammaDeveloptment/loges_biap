# Documento 007 — Roadmap de Desarrollo

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.1
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento traduce la secuencia de Fase 2 definida en `CLAUDE.md` (sección 7) en entregas concretas, con objetivo, dependencias y criterio de salida por etapa. No fija fechas de calendario: el tamaño del equipo de desarrollo aún no está definido, y comprometer fechas sin esa variable sería una estimación sin base. En su lugar, se ordena por **dependencia técnica y de riesgo** — qué debe existir antes de que otra cosa pueda construirse, y qué parte del proyecto es más incierta y conviene validar primero.

**Recordatorio de disciplina de fase (`CLAUDE.md`):** este roadmap describe la Fase 2, pero **no autoriza a empezar la Fase 2**. La Fase 2 solo inicia cuando el blueprint completo (Documentos 001–015, incluyendo el 012-B) esté aprobado por el cliente. Al momento de escribir este documento, los Documentos 008 a 015 siguen pendientes — en particular, el Documento 012 (conectores) y el 012-B (cumplimiento legal) son bloqueantes directos de la primera entrega funcional real (ver sección 3, Entrega 2).

## 1. Principios de Secuenciación

1. **Lo más incierto va primero.** El Motor de Agentes y el Módulo de Descubrimiento de Cargadores son el núcleo diferenciador (`CLAUDE.md`, sección 6) y también lo menos probado — conviene validarlos temprano con un alcance pequeño, no al final con todo el peso de las demás capas encima.
2. **Ninguna entrega se construye antes que su dependencia documental.** Si un módulo depende de un documento de la Fase 1 que aún no existe o no está validado, la entrega correspondiente no puede iniciar aunque el equipo esté disponible.
3. **Cada entrega es una rebanada vertical, no una capa horizontal completa.** En vez de "toda la base de datos" y luego "todo el backend" y luego "todo el frontend", cada entrega construye lo mínimo de cada capa necesario para un módulo funcional completo y demostrable (metodología por módulo, `CLAUDE.md` sección 7).
4. **Ninguna entrega se da por cerrada sin pruebas y documentación**, tal como exige `CLAUDE.md`: "no se avanza al siguiente módulo sin esto".

## 2. Metodología Obligatoria por Módulo (recordatorio)

Cada entrega de la sección 3 debe pasar por los nueve pasos ya definidos en `CLAUDE.md`: objetivo del módulo, casos de uso, diseño técnico, modelo de datos, API, implementación, pruebas, documentación, revisión y optimización. Los pasos 1-4 (objetivo, casos de uso, diseño técnico, modelo de datos) ya están en gran parte resueltos por los Documentos 003, 004, 005 y 006 — la Fase 2 los verifica e implementa, no los inventa desde cero.

## 3. Entregas (secuencia de Fase 2)

### Entrega 0 — Fundaciones técnicas

**Objetivo:** dejar listo lo que todo módulo posterior necesita: repositorio, esquema de base de datos, autenticación y estructura de permisos.

| Ítem del `CLAUDE.md` §7 | Qué implica aquí |
|---|---|
| 1. Repositorio y arquitectura base | Monorepo `apps/api` (NestJS) + `apps/web` (Next.js) + `packages/shared-types`, según el Documento 004, sección 7. |
| 2. Base de datos | Migraciones del esquema completo del Documento 005 sobre el servidor PostgreSQL de Gammacargo (base dedicada, Documento 004 sección 3). |
| 3. Autenticación y permisos | Login + roles base (`usuario.area`) y Row Level Security inicial — detalle fino de permisos según el Documento 011. |

**Dependencias documentales:** Documentos 004, 005, 011 (011 aún pendiente en la Fase 1 — ver sección 0).
**Criterio de salida:** un usuario de cada área puede autenticarse y ve una navegación vacía pero correcta según su rol; el esquema de datos existe y tiene su primera migración versionada.

### Entrega 1 — Motor de Agentes (esqueleto de orquestación)

**Objetivo:** construir la infraestructura de ejecución de agentes (cola de trabajos, registro de `ejecucion_agente`, control de concurrencia por fuente) **antes** de que tenga una tarea real que ejecutar. Este es el ítem 4 del `CLAUDE.md` §7 ("Motor de agentes"), distinto del ítem 7 ("Motor de IA"): aquí se construye el orquestador (BullMQ + Redis, Documento 004 sección 5); el "razonamiento" con LLM se conecta después (Entrega 4).

**Dependencias documentales:** Documento 009 — Arquitectura de Agentes de IA (pendiente).
**Criterio de salida:** el sistema puede encolar, ejecutar y registrar una tarea de prueba de extremo a extremo, sin lógica de negocio real todavía.

### Entrega 2 — MVP de Descubrimiento de Cargadores

**Objetivo:** primera funcionalidad de negocio real, con el alcance más acotado posible (ej. un solo país, un sector, una o dos fuentes) para validar el patrón completo: fuente → hallazgo → nivel de confianza → ficha de empresa → interacción del usuario (Documento 003, módulo 3.1; Documento 006, sección 4.1-4.2).

**⚠️ Dependencia bloqueante:** esta entrega no puede iniciar hasta que el **Documento 012 (Arquitectura de scraping y conectores)** y, especialmente, el **Documento 012-B (Cumplimiento legal de fuentes)** estén validados. Sin 012-B no hay certeza de qué fuentes son legalmente utilizables por país — construir el conector antes arriesga tener que rehacerlo.

**Dependencias documentales:** Documentos 009, 012, 012-B (todos pendientes en la Fase 1).
**Criterio de salida:** un usuario de Comercial puede buscar por sector/país, ver resultados con fuente y confianza visibles, abrir una ficha de empresa y marcarla como contactada — con datos reales de al menos una fuente pública ya validada legalmente.

### Entrega 3 — Enriquecimiento: Proveedores Logísticos y Competidores

**Objetivo:** extender el mismo patrón validado en la Entrega 2 (Documento 005: `empresa` + roles) a los módulos 3.2 y 3.3 del Documento 003 — directorio de proveedores con evaluación, y monitoreo de competidores con alertas de cambio.

**Dependencias documentales:** Entrega 2 completa (reutiliza su infraestructura); Documento 006, secciones 4.3 y 4.4.
**Criterio de salida:** Operaciones/Compras puede evaluar un proveedor y Gerencia Comercial puede ver alertas de cambios de al menos un competidor monitoreado.

### Entrega 4 — Motor de IA (comprensión y estructuración)

**Objetivo:** conectar el "proveedor de razonamiento" (interfaz interna definida en el Documento 004, sección 4, y detallada en el Documento 009) al Motor de Agentes de la Entrega 1, mejorando lo que las Entregas 2 y 3 ya construyeron: clasificación de campos, resolución de conflictos entre fuentes, verificación cruzada y asignación de `nivel_confianza` (Documento 005, sección 4).

**Dependencias documentales:** Documento 009.
**Criterio de salida:** el nivel de confianza de un dato puede subir automáticamente cuando dos fuentes independientes lo corroboran (regla ya definida en el Documento 005), sin intervención manual.

### Entrega 5 — API REST e Interfaz Web Completa

**Objetivo:** formalizar los contratos REST (Documento 010) que hasta ahora las entregas anteriores consumieron de forma interna, y completar las pantallas del Documento 006 que falten (paneles por rol, sección 3 del Documento 006).

**Dependencias documentales:** Documento 010.
**Criterio de salida:** existe una especificación de API versionada y publicada, y cada rol de negocio tiene su panel de inicio funcional (Documento 006, sección 3).

### Entrega 6 — Panel Administrativo y Tendencias de Mercado

**Objetivo:** módulo 3.9 (administración: usuarios, fuentes, monitor de agentes, Documento 006 sección 7) y módulo 3.4 (tendencias, Documento 006 sección 4.5) — ambos de menor urgencia comercial inmediata que el descubrimiento de cargadores, pero necesarios antes de producción.

**Dependencias documentales:** Documentos 003 (3.4, 3.9), 006 (secciones 4.5, 7), 011.
**Criterio de salida:** un Administrador puede gestionar usuarios/fuentes y ver el estado del Motor de Agentes sin acceder a la base de datos directamente; Dirección General tiene su panel de tendencias con datos reales.

### Entrega 7 — Integraciones: Exportación a CRM/ERP

**Objetivo:** módulo 3.7 del Documento 003 — sincronización real hacia el CRM y ERP de Gammacargo, incluyendo el flujo inverso de "cliente actual" que excluye empresas ya ganadas del Módulo de Descubrimiento (Documento 005, `empresa_rol`).

**Dependencias documentales:** Documento 010 (contratos; adaptador HubSpot en 4.5.1, adaptador Loges en 4.5.2). Ambos sistemas ya confirmados con el cliente. Para el adaptador de Loges, esta entrega depende además de acordar con el equipo que mantiene Loges el esquema exacto de la tabla nueva y las credenciales de acceso mínimo (Documento 010, 4.5.2).
**Criterio de salida:** una empresa candidata (cargador) puede exportarse a HubSpot y un proveedor evaluado puede escribirse en la tabla nueva de Loges; en ambos casos el estado de sincronización es visible (`sincronizacion_externa`, Documento 005).

### Entrega 8 — Despliegue en Producción

**Objetivo:** llevar el sistema desde el ambiente de pruebas (VPN interna, Documento 004 sección 3) al ambiente de producción definitivo, con monitoreo y respaldo formalizados.

**Dependencias documentales:** Documento 013 — Infraestructura y Despliegue.
**Criterio de salida:** los cuatro roles de negocio usan Loges-BIAP en producción con datos reales y monitoreo activo.

## 4. Tabla Resumen de Dependencias Documentales

| Entrega | Documentos de la Fase 1 requeridos | Estado a la fecha |
|---|---|---|
| 0 — Fundaciones | 004, 005, 011 | 004 y 005 listos; 011 pendiente |
| 1 — Motor de Agentes (esqueleto) | 009 | Pendiente |
| 2 — Descubrimiento de Cargadores (MVP) | 009, 012, 012-B | Pendiente — **bloqueante crítico** |
| 3 — Proveedores y Competidores | Entrega 2, 003, 006 | Depende de Entrega 2 |
| 4 — Motor de IA | 009 | Pendiente |
| 5 — API + Interfaz Web | 010, 006 | 006 listo; 010 pendiente |
| 6 — Administración y Tendencias | 003, 006, 011 | 003 y 006 listos; 011 pendiente |
| 7 — Integraciones CRM/ERP | 010 | CRM (HubSpot, §4.5.1) y ERP (Loges, §4.5.2) confirmados; falta acordar el esquema de la tabla nueva en Loges con quien lo mantiene |
| 8 — Producción | 013 | Pendiente |

## 5. Riesgos Identificados para la Planificación

- **El Documento 012-B puede acotar el alcance geográfico inicial.** Si el cumplimiento legal de fuentes solo está claro para uno o dos países al momento de construir la Entrega 2, el MVP de Descubrimiento debe lanzarse acotado a esos países, no a toda la cobertura que Gammacargo opera.
- **La integración con Loges (ERP) escribe directo a una tabla de su base de datos, no vía API (Documento 010, §4.5.2).** Esto es más rápido de construir pero acopla a Loges-BIAP con el esquema interno de Loges — el riesgo y su mitigación (aislar la escritura detrás de un único adaptador) ya están documentados; falta acordar el esquema exacto de esa tabla con quien mantiene Loges antes de esta entrega.
- **El acceso a la base de datos por VPN (Documento 004) puede introducir fricción en ambientes de desarrollo/pruebas tempranos** (Entregas 0-2) si el equipo de desarrollo no tiene acceso VPN ya configurado — coordinar con el equipo de soporte de Gammacargo antes de la Entrega 0, no durante.

## 6. Relación con los Siguientes Documentos

El Documento 008 — Presentación Comercial puede apoyarse en esta secuencia para comunicar expectativas de entrega a Gammacargo. El Documento 009 — Arquitectura de Agentes de IA y el Documento 012 / 012-B deben resolverse antes de que la Entrega 2 de este roadmap pueda iniciar. El Documento 013 — Infraestructura y Despliegue detalla la Entrega 8. El Documento 014 — Plan de Pruebas debe mapear un plan de pruebas por cada una de las entregas aquí definidas, no solo al final del proyecto.

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) antes de continuar con el Documento 008, conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
