# Documento 015 — Manual del Desarrollador

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.1
**Fecha:** Julio 2026

---

## 0. Contexto

Este es el último documento del blueprint de Fase 1 (`CLAUDE.md`). Su público es un desarrollador que se incorpora al proyecto una vez la Fase 2 esté autorizada — no repite el contenido de los Documentos 001-014, sino que indica dónde está cada decisión y cómo ponerse a trabajar sobre ella el primer día.

## 1. Qué Leer Antes de Escribir Código

No hace falta leer los 15 documentos con el mismo nivel de detalle. Orden recomendado:

| Prioridad | Documentos | Por qué |
|---|---|---|
| Imprescindible | 001 (Fundación), 003 (Arquitectura Funcional), 005 (Modelo de Datos) | Sin esto, cualquier código que se escriba corre el riesgo de resolver el problema equivocado. |
| Antes de tocar tu primera área | 004 (Arquitectura Técnica), 009 (Agentes de IA) si tocas el motor, 011 (Permisos) si tocas cualquier endpoint | Decisiones ya tomadas que no se deben reabrir sin razón nueva. |
| Consulta continua | 006 (UX/UI), 010 (API), 012/012-B (conectores y su gate legal) | Se consultan una y otra vez durante el desarrollo, no de una sola vez. |
| Contexto de negocio | 002 (Modelo de Negocio), 007 (Roadmap), 008 (Presentación) | Útiles para entender el "por qué", no bloquean empezar a programar. |
| Operación | 013 (Infraestructura), 014 (Plan de Pruebas) | Necesarios antes de desplegar, no antes de programar. |

## 2. Requisitos Previos

- **Acceso VPN a la red interna de Gammacargo** (Documento 004, sección 3; Documento 013, sección 1) — sin esto no hay forma de alcanzar la base de datos de desarrollo. Solicitarlo al equipo de soporte de Gammacargo antes de empezar, no el primer día de código.
- Acceso al repositorio Git del proyecto.
- Credenciales de la base de datos de desarrollo (`loges_biap_dev` o equivalente, Documento 013, sección 1) — provistas por el equipo de soporte de Gammacargo.
- API key de Anthropic para desarrollo (Documento 004, sección 4) — con límite de uso bajo, distinta de la de producción.
- Node.js y Docker instalados localmente (para levantar PostgreSQL/Redis de prueba si no se conecta directo a la base compartida durante el desarrollo inicial).

## 3. Estructura del Repositorio

```
backend/
  docs/                → Documentos 001-015 (este blueprint)
  apps/
    api/                → NestJS: un módulo por módulo funcional (Documento 003)
    web/                → Next.js: paneles por rol (Documento 006)
  packages/
    shared-types/        → Contratos/DTOs compartidos entre api y web (Documento 004, sección 7)
```

Cada módulo funcional del Documento 003 (Descubrimiento de Cargadores, Análisis de Competidores, Enriquecimiento de Proveedores, Inteligencia de Mercado) es un módulo NestJS independiente dentro de `apps/api`, con su propio conjunto de pruebas (Documento 014).

## 4. Configurar el Ambiente Local

1. Clonar el repositorio y conectarse a la VPN de Gammacargo.
2. Copiar `.env.example` a `.env` en `apps/api` y `apps/web`, completando: cadena de conexión a `loges_biap_dev`, credenciales de Redis, API key de Anthropic (desarrollo), secreto de JWT (Documento 011).
3. Instalar dependencias (`npm install` en la raíz del monorepo).
4. Ejecutar las migraciones del esquema del Documento 005 contra la base de desarrollo.
5. Cargar los datos sintéticos de prueba (Documento 014, sección 6) — **no conectarse a ninguna fuente externa real** durante el desarrollo local, ya que ninguna tiene todavía `terminos_uso_verificados = true` (Documento 012-B).

## 5. Correr el Proyecto Localmente

- Backend: `npm run start:dev` en `apps/api` — expone la API del Documento 010 en local.
- Frontend: `npm run dev` en `apps/web` — consume la API local, nunca la base de datos directamente (Documento 006).
- Worker de agentes: proceso separado dentro de `apps/api` que consume la cola de BullMQ (Documento 009) — se levanta con su propio comando para poder probarlo de forma aislada del servidor HTTP.

## 6. Correr las Pruebas

Según los niveles del Documento 014, sección 2:

- Unitarias: `npm run test` — no requieren VPN ni base de datos real.
- Integración: `npm run test:integration` — requiere la base de datos de desarrollo (VPN activa).
- E2E: `npm run test:e2e` — levanta backend y frontend juntos contra datos sintéticos.
- Los conectores de fuentes (Documento 012) corren en modo simulado por defecto en todos los niveles de prueba (Documento 014, sección 6) — activar un conector real requiere una variable de entorno explícita que solo debe usarse una vez que el Documento 012-B apruebe esa fuente.

## 7. Convenciones de Código

- **Lenguaje ubicuo:** las entidades de dominio (`empresa`, `fuente`, `nivel_confianza`, `interaccion_usuario`, etc.) se nombran en español, igual que en el Documento 005 — no se traducen a inglés en el código, para que el modelo de datos, la documentación y las conversaciones con Gammacargo usen siempre el mismo término.
- El código técnico que no es lenguaje de dominio (nombres de funciones auxiliares, utilidades, infraestructura) sigue la convención estándar en inglés del ecosistema NestJS/TypeScript.
- Tipos compartidos entre `api` y `web` viven en `packages/shared-types` — no se duplican DTOs entre frontend y backend (Documento 004, sección 7).
- Ningún endpoint nuevo se documenta solo en el código: se refleja en el Documento 010 como parte del mismo cambio, no como una tarea aparte para "después".

## 8. Cómo Agregar un Nuevo Módulo

Siguiendo la metodología obligatoria de `CLAUDE.md` (sección 7), en este orden:

1. Objetivo del módulo — ¿qué decisión de negocio apoya? (Documento 001, regla de oro).
2. Casos de uso — ¿ya están en el Documento 003? Si no, ese documento se actualiza primero.
3. Diseño técnico — ¿encaja en la arquitectura del Documento 004, o requiere una excepción que debe justificarse igual que ese documento justificó sus decisiones?
4. Modelo de datos — extender el Documento 005, no crear un esquema paralelo.
5. API — extender el catálogo del Documento 010, respetando el versionado (sección 7 de ese documento).
6. Implementación.
7. Pruebas — agregar filas nuevas a la matriz del Documento 014, sección 3, si el módulo introduce una regla de negocio nueva.
8. Documentación — actualizar el documento correspondiente, no solo el código.
9. Revisión y optimización.

Ningún paso se salta aunque el módulo parezca pequeño — es la misma disciplina que ya se aplicó a los quince documentos de este blueprint.

## 9. Flujo de Git y Revisión

- Una rama por entrega o por módulo (alineado al Documento 007), no una rama gigante para "toda la Fase 2".
- Un PR no se aprueba sin las pruebas de la sección 6 pasando, incluyendo las filas de la matriz del Documento 014 relevantes al cambio.
- Un PR que toque permisos (Documento 011) o el gate legal de fuentes (Documento 012-B) requiere una revisión adicional explícita — son las dos áreas donde un error no es solo un bug, es un incidente de datos o de cumplimiento.

## 10. Mapa Rápido: "Quiero Cambiar X"

| Quiero... | Reviso primero |
|---|---|
| Agregar un campo a la ficha de empresa | Documento 005 (modelo de datos) y Documento 010 (contrato de API) |
| Cambiar qué ve un rol | Documento 011 (matriz de permisos) — no solo el código de la pantalla |
| Agregar una fuente nueva | Documento 012-B primero (aprobación legal) — recién después el Documento 012 (conector) |
| Cambiar la lógica de nivel de confianza | Documento 009, sección 5 |
| Agregar un endpoint para el CRM/ERP | Documento 010, sección 4.5 (y su adaptador específico) |
| Desplegar a un ambiente nuevo | Documento 013 |

## 11. Problemas Comunes

- **"No puedo conectarme a la base de datos"** → confirmar que la VPN de Gammacargo está activa antes de revisar la cadena de conexión (Documento 004, sección 3).
- **"Mi tarea de agente falla contra una fuente real"** → verificar que esa fuente tiene `terminos_uso_verificados = true` (Documento 012-B); si no, el rechazo es el comportamiento esperado, no un bug.
- **"El backend no puede desplegarse desde el pipeline"** → confirmar que el runner autoalojado (Documento 013, sección 3) está activo dentro de la red de Gammacargo.

## 12. Glosario Rápido

| Término | Significado |
|---|---|
| Fuente | Origen público de datos, con su propio nivel de confianza base (Documento 005). |
| Nivel de confianza | Qué tan verificado está un dato — nunca se asigna a mano (Documento 009). |
| Conector | Forma técnica estructurada de consultar una fuente (Documento 012). |
| Ejecución de agente | Registro persistente de una tarea del Motor de Agentes (Documento 005/009). |
| Interacción de usuario | Contactar/evaluar/descartar una empresa, siempre registrado (Documento 005). |
| Rol de empresa | Cargador candidato, competidor, proveedor, cliente actual — la misma empresa puede tener varios (Documento 005). |

## 13. Cierre del Blueprint

Con este documento se completa la serie 001-015 (más el 012-B) exigida por `CLAUDE.md`. Esto **no autoriza el inicio de la Fase 2** — falta la validación explícita del cliente sobre el conjunto completo del blueprint, y quedan puntos abiertos señalados a lo largo de la serie (en particular: aprobación legal de al menos una fuente real, Documento 012-B; confirmación del ERP, Documento 007/010; y la coordinación operativa con el equipo de soporte de Gammacargo señalada en el Documento 013).

---

*Este documento, junto con los Documentos 001-014 y 012-B, completa el blueprint de la Fase 1. Requiere validación explícita del cliente (Ronald Cespedes, Grupo Gammacargo) antes de que el proyecto pueda pasar a la Fase 2, conforme a `CLAUDE.md`.*
