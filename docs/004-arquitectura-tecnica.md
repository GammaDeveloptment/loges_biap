# Documento 004 — Arquitectura Técnica (Cómo está construido Loges-BIAP)

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.2 (actualiza la sección de Base de Datos e Infraestructura tras confirmar que Gammacargo tiene servidor PostgreSQL propio)
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento continúa el Documento 003 — Arquitectura Funcional. Allí se definió **qué** hace Loges-BIAP (módulos, actores, flujo). Aquí se define **cómo** se construye: stack de backend, frontend, base de datos, proveedor de IA/LLM y orquestación de agentes, e infraestructura cloud.

Cada decisión se evalúa contra los cuatro criterios exigidos por el proyecto (ver `CLAUDE.md`, sección 8):

1. **Volumen de datos esperado.**
2. **Necesidad de agentes de IA concurrentes.**
3. **Facilidad de integración con CRM/ERP de Gammacargo.**
4. **Costo de infraestructura.**

**Nota de alcance:** Gammacargo no tiene, a la fecha, ninguna cuenta o contrato previo con un proveedor de nube o de IA (confirmado con el cliente) — esa parte de la evaluación (backend, frontend, IA/LLM) se apoya únicamente en los cuatro criterios anteriores y en argumentos de primeros principios (tamaño de equipo, mantenibilidad), sin tomar como referencia ningún otro proyecto o cliente. La excepción es la **base de datos**: Gammacargo sí tiene un servidor PostgreSQL propio (compartido con otros sistemas, con equipo de soporte interno), lo cual sí condiciona y mejora la decisión de la sección 3.

Regla de oro aplicada también aquí: si una elección tecnológica bloquea la posibilidad de licenciar Loges-BIAP a otras empresas logísticas en el futuro (Documento 001, nota estratégica), se señala explícitamente y se propone mitigación — no se decide en silencio.

---

## 1. Backend

### Alternativas evaluadas

| | **Node.js + TypeScript (NestJS)** | Python (FastAPI) |
|---|---|---|
| Volumen de datos | Sobrado para el volumen esperado (miles a cientos de miles de registros de empresas/embarques, no big data). | Igual de sobrado; Python no aporta ventaja aquí porque no se hace procesamiento masivo tipo data lake. |
| Agentes de IA concurrentes | Concurrencia vía I/O asíncrono nativo + cola de trabajos (BullMQ/Redis) para controlar cuántos agentes corren a la vez por fuente. SDK de agentes de Anthropic disponible en TypeScript. | Ecosistema de agentes más maduro históricamente (LangChain, LlamaIndex) pero Loges-BIAP no necesita ese tipo de framework: el Documento 001 excluye scraping/crawling masivo, por lo que la orquestación es más simple que un pipeline de datos. |
| Integración CRM/ERP | Tipado compartido (DTOs) con el frontend si este también es TypeScript; cliente HTTP maduro para cualquier CRM/ERP REST/SOAP. | Igualmente viable; sin ventaja diferencial. |
| Costo de infraestructura | Runtime ligero, buen aprovechamiento de instancias pequeñas/medianas. | Equivalente. |
| Mantenibilidad para el equipo | Si el frontend se construye en TypeScript (sección 2), usar el mismo lenguaje en el backend permite compartir tipos/contratos de datos y que una sola persona pueda mantener ambas capas sin cambiar de contexto — relevante para un equipo de desarrollo reducido como el que arrancará este proyecto. | Backend en Python + frontend en TypeScript implica mantener dos lenguajes, dos ecosistemas de dependencias y dos convenciones de estilo, sin que ninguno de los cuatro criterios obligatorios lo justifique en este caso. |

### Decisión

**Node.js + TypeScript, con NestJS como framework de backend.**

Justificación: ninguno de los cuatro criterios obligatorios (volumen de datos, concurrencia de agentes, integración CRM/ERP, costo) favorece de forma decisiva a Node/TypeScript sobre Python — ambos son igualmente capaces para lo que Loges-BIAP necesita en esta fase. El desempate es de mantenibilidad: un solo lenguaje entre frontend y backend reduce la carga de un equipo de desarrollo pequeño. Adicionalmente, NestJS impone una estructura modular (módulos, providers, DI) que encaja de forma natural con los módulos funcionales ya definidos en el Documento 003 (Descubrimiento de Cargadores, Análisis de Competidores, Enriquecimiento de Proveedores, etc. → un módulo NestJS por módulo funcional). Esto facilita que el Documento 007 (Roadmap) pueda planificar cada módulo como una unidad de trabajo independiente, tal como exige la metodología del `CLAUDE.md` (Fase 2, "no se avanza al siguiente módulo sin pruebas y documentación").

---

## 2. Frontend

### Alternativas evaluadas

| | **Next.js (React + TypeScript)** | SPA con Vite + React |
|---|---|---|
| Necesidades del producto | Requiere paneles por rol (Documento 003, 3.8), autenticación, y datos que cambian de forma continua (no un sitio estático). Next.js da App Router, Server Components y rutas API propias (útiles como capa intermedia hacia el backend/CRM-ERP sin exponer credenciales al navegador). | Cubre la parte de UI, pero no trae capa de servidor propia: cualquier proxy hacia CRM/ERP o lógica sensible tendría que vivir aparte, sumando una pieza más a mantener. |
| Integración CRM/ERP | Las API routes de Next.js sirven como Backend-for-Frontend para llamadas que no deben exponerse directo al navegador (ej. tokens de integración con el CRM). | Necesitaría un servidor adicional para el mismo propósito. |
| Costo/infraestructura | Se despliega de forma económica en plataformas administradas (Vercel u otra) con buen soporte para Next.js. | Requiere hosting propio de un servidor Node adicional si se necesita SSR/BFF, incrementando el costo operativo. |

### Decisión

**Next.js con TypeScript**, compartiendo tipos (contratos de API) con el backend NestJS mediante un paquete o carpeta de tipos compartidos dentro del monorepo (ver sección 7). Esto reduce errores de integración entre frontend y backend, algo relevante dado que varios roles (Comercial, Operaciones, Gerencia, Dirección General) consumen vistas distintas del mismo dato.

---

## 3. Base de Datos

### Dato de partida (confirmado con el cliente)

Gammacargo ya opera un servidor PostgreSQL propio, **compartido con otros sistemas**, pero puede crear una **base de datos exclusiva** para Loges-BIAP dentro de ese servidor. Existe un equipo de soporte interno que administra backups, parches y monitoreo de ese servidor. Este hecho reemplaza la evaluación original (que asumía partir de cero sin infraestructura propia) — se actualiza la decisión de este documento en consecuencia.

### Alternativas evaluadas (revisadas)

| | **PostgreSQL autogestionado — servidor propio de Gammacargo (base de datos dedicada)** | PostgreSQL gestionado externo (ej. Supabase) |
|---|---|---|
| Volumen de datos | Mismo motor relacional, misma capacidad para las entidades del Documento 005 (empresa, embarque, contacto, proveedor, fuente, nivel de confianza, historial). Sin diferencia de volumen soportado. | Sin diferencia de volumen soportado. |
| Agentes de IA concurrentes | Escrituras concurrentes controladas por transacciones estándar de Postgres. Al ser una base dedicada (no un servidor completo) dentro del servidor compartido, se puede acotar el uso de recursos (pool de conexiones, límites de CPU/memoria) para no afectar a los demás sistemas que viven en ese servidor. | Igual capacidad transaccional; sin este punto de coordinación con otros sistemas de Gammacargo. |
| Integración CRM/ERP | Ninguna diferencia — la integración siempre pasa por el backend NestJS, nunca directo a la base de datos. | Igual. |
| Costo de infraestructura | **Costo marginal**: se reutiliza un servidor que Gammacargo ya paga y ya mantiene; no hay factura adicional de plataforma gestionada. | Costo recurrente de un plan gestionado adicional, sin necesidad real dado que ya existe soporte interno para Postgres. |
| Soberanía y cumplimiento de datos | La información comercial sensible (cargadores, competidores, proveedores) permanece dentro de la infraestructura de Gammacargo — refuerza el valor de Ética/soberanía del Documento 001 y simplifica el Documento 012-B (cumplimiento legal por país). | Los datos residen en la infraestructura de un tercero fuera de Gammacargo. |
| Permisos y seguridad (Documento 011) | Row Level Security (RLS) es una función nativa de PostgreSQL, disponible igual en un servidor propio — se configura por SQL/migraciones en vez de un panel gestionado. | RLS con panel de administración incluido, pero no aporta algo que no se pueda lograr igual con RLS nativo. |

### Decisión

**PostgreSQL autogestionado, en una base de datos dedicada dentro del servidor compartido que Gammacargo ya opera**, administrado por el equipo de soporte interno existente. Se descarta un proveedor gestionado externo (Supabase u otro): no aporta ninguna ventaja que no exista ya internamente, y sí introduciría un costo y una dependencia externa innecesarios.

Reglas de convivencia con el servidor compartido, a formalizar con el equipo de soporte antes del Documento 013:
- Base de datos y usuario/rol de conexión exclusivos para Loges-BIAP (sin acceso cruzado a esquemas de otros sistemas).
- Límites explícitos de pool de conexiones (ej. vía PgBouncer) para que los agentes de IA concurrentes no agoten conexiones que otros sistemas del mismo servidor necesiten.
- Acuerdo sobre ventanas de mantenimiento/backup ya existentes del servidor, para que el Documento 014 (Plan de Pruebas) y el Documento 013 (Infraestructura) las respeten.

### Conectividad de red — fase de pruebas vs. fase futura

El servidor **puede** exponerse hacia afuera más adelante, pero **para las pruebas se empieza con acceso solo por VPN a la red interna de Gammacargo**. Esto tiene una consecuencia directa sobre dónde vive el backend (ver sección 6): mientras la base de datos no sea alcanzable desde internet, el backend (NestJS + workers) debe desplegarse dentro de la red de Gammacargo o con conexión VPN a ella — no puede vivir en un PaaS externo genérico (Railway/Render) que no ofrece salida VPN hacia una red privada de forma simple.

El frontend (Next.js) no se ve afectado por esta restricción porque, por diseño (sección 2), **nunca habla directo con la base de datos** — solo consume la API del backend por HTTPS. Esto significa que aunque la base de datos esté detrás de VPN, el frontend puede seguir viviendo en un servicio externo (Vercel), siempre que la API del backend exponga un endpoint HTTPS autenticado hacia el frontend.

### ⚠️ Riesgo y mitigación

Depender de la disponibilidad de la VPN/red interna para que el backend alcance la base de datos introduce un punto de fragilidad operativa (si la VPN cae, el backend pierde la base de datos). **Mitigación:** manejo de reintentos y *circuit breaker* en la capa de acceso a datos del backend, y monitoreo de conectividad como parte del Documento 013. Cuando el servidor se exponga hacia afuera con firewall/IP allowlist, el cambio para el backend es solo de configuración de red (cadena de conexión, reglas de firewall) — no de código, gracias a que el acceso a datos ya está encapsulado detrás del ORM (Prisma o Drizzle) en el backend.

---

## 4. Proveedor de IA / LLM

### Alternativas evaluadas

| | **Anthropic Claude (API + Agent SDK)** | OpenAI (API + Assistants/Agents) |
|---|---|---|
| Necesidad de agentes concurrentes | El Agent SDK de Anthropic está diseñado para orquestar agentes con herramientas (tool use), que es exactamente el patrón que necesita el Motor de Agentes del Documento 003 (3.6) y que se detallará en el Documento 009. | Igualmente capaz de tool use / function calling; no hay diferencia funcional decisiva para este caso de uso. |
| Facilidad de integración | Ambos exponen APIs REST maduras y SDKs oficiales en TypeScript; ninguno impone una integración más simple que el otro para este caso de uso. | Igualmente madura. |
| Costo de infraestructura | Estrategia de modelos por nivel de tarea (ver abajo) permite controlar el costo variable, que es el más sensible al volumen de fuentes procesadas; comparable entre ambos proveedores a la fecha de este documento. | Estructura de costos comparable. |

Este es, de los cuatro componentes del stack, el que **menos depende de un antecedente propio de Gammacargo**: no existe cuenta ni contrato previo con ningún proveedor de IA, por lo que la decisión se apoya en ajuste técnico, no en continuidad operativa.

### Decisión

**Anthropic Claude** como proveedor principal de IA, con una estrategia de **modelos por nivel de tarea** para controlar costo:

- Tareas de alto volumen y bajo riesgo (clasificar, extraer campos estructurados de una fuente ya identificada) → modelo de nivel intermedio (rápido y económico).
- Tareas de juicio (resolver conflictos entre fuentes, evaluar nivel de confianza, priorizar candidatos) → modelo de nivel superior, usado con menor frecuencia.

Justificación técnica (no de precedente): el Agent SDK de Anthropic está construido específicamente para el patrón de orquestación de agentes con herramientas (tool use) que necesita el Motor de Agentes del Documento 003 (3.6). La mitigación de bloqueo descrita abajo hace que esta elección sea reversible si en la negociación comercial real con Gammacargo (fuera del alcance técnico de este documento) resultara más conveniente OpenAI u otro proveedor.

### ⚠️ Riesgo de bloqueo a futuro y mitigación

Escribir las llamadas al LLM directamente contra el SDK de Anthropic en cada módulo acoplaría todo el motor de agentes a un único proveedor. **Mitigación:** el Motor de Agentes (Documento 009) debe definir una interfaz interna propia ("proveedor de razonamiento") detrás de la cual vive la llamada real a Anthropic. Si en el futuro Gammacargo necesita cambiar o combinar proveedores (por costo, disponibilidad regional u otro motivo), el cambio ocurre en un solo punto, no en cada módulo funcional.

---

## 5. Orquestación de Agentes y Colas de Trabajo

El Motor de Agentes (Documento 003, 3.6) necesita ejecutar tareas de descubrimiento/enriquecimiento de forma concurrente, controlada y sin duplicar trabajo. Se propone:

- **Cola de trabajos:** BullMQ sobre Redis. Cada tarea (buscar cargadores de un sector/país, verificar un proveedor, monitorear un competidor) es un job en cola, con control de concurrencia por fuente para respetar límites de uso de cada fuente pública (coherente con el valor de Ética del Documento 001 y con lo que definirá el Documento 012-B de cumplimiento legal).
- **Redis:** gestionado externo (ej. Upstash) si el segmento de red de Gammacargo donde vive el backend permite salida a internet (tráfico solo de salida, no requiere abrir la VPN en sentido contrario); si el equipo de soporte prefiere no permitir esa salida, la alternativa es un Redis autoadministrado en la misma VM interna del backend — a confirmar con el equipo de soporte antes del Documento 013.
- Este diseño permite escalar el número de workers de forma independiente al backend web si el volumen de fuentes crece, sin rediseño.

---

## 6. Infraestructura Cloud y Despliegue (adelanto — se profundiza en Documento 013)

| Componente | Propuesta | Alternativa considerada | Por qué se prefiere la propuesta |
|---|---|---|---|
| Frontend (Next.js) | Vercel (u otro hosting externo) | Contenedor propio dentro de la red de Gammacargo | El frontend nunca toca la base de datos directamente (solo la API del backend por HTTPS), así que no depende de la VPN interna; se beneficia de un hosting externo optimizado para Next.js. |
| Backend (NestJS) + workers | **Contenedor (Docker) desplegado dentro de la red de Gammacargo o con VPN de sitio hacia ella** — a coordinar con el equipo de soporte interno | Plataforma administrada externa genérica (Railway/Render) | Mientras la base de datos solo sea accesible por VPN interna (sección 3), el backend debe tener esa misma vía de acceso; un PaaS externo genérico no ofrece salida VPN simple hacia una red privada. Cuando el servidor se exponga hacia afuera con firewall/IP allowlist, esta pieza puede migrar a un PaaS externo sin cambios de código, solo de despliegue. |
| Base de datos | PostgreSQL autogestionado — servidor compartido de Gammacargo, base de datos dedicada | Postgres gestionado externo (Supabase, RDS, Cloud SQL) | Ver sección 3. |
| Cola de trabajos | Redis (gestionado externo o autoadministrado en la misma red — ver sección 5) | — | Depende de si el segmento de red del backend permite salida a internet; a confirmar con soporte. |
| CI/CD | GitHub Actions, con el job de despliegue del backend apuntando al entorno interno/VPN de Gammacargo | Pipelines propios | Estándar de facto, bajo costo; el paso de despliegue del backend requiere coordinarse con el equipo de soporte interno para el acceso a la red donde vive. |

Este componente se retoma con detalle (ambientes, monitoreo, alertas, y el procedimiento exacto de despliegue dentro de la red de Gammacargo) en el Documento 013.

---

## 7. Estructura de Repositorio Propuesta

Se mantiene la separación indicada en `CLAUDE.md` (`docs/` para documentación, carpeta de producto para el código), y dentro del código se propone un monorepo simple para compartir tipos entre frontend y backend:

```
backend/
  docs/                → Documentos 001-015 (este blueprint)
  apps/
    api/                → NestJS (módulos funcionales, motor de agentes, integraciones)
    web/                → Next.js (paneles por rol)
  packages/
    shared-types/        → Contratos/DTOs compartidos entre api y web
```

(La carpeta `front` ya existente en el entorno de trabajo puede consolidarse dentro de `apps/web` cuando arranque la Fase 2, o mantenerse como repositorio separado si Gammacargo prefiere desplegar frontend y backend de forma independiente — esta es una decisión operativa, no técnica, que debe confirmarse antes del Documento 007.)

---

## 8. Resumen del Stack

| Capa | Elección |
|---|---|
| Backend | Node.js + TypeScript, NestJS |
| Frontend | Next.js + TypeScript |
| Base de datos | PostgreSQL autogestionado — base de datos dedicada en servidor compartido de Gammacargo, acceso vía ORM (Prisma/Drizzle) desde el backend |
| IA / LLM | Anthropic Claude (API + Agent SDK), detrás de una interfaz interna propia |
| Orquestación de agentes | BullMQ + Redis (gestionado externo o interno, según política de salida a internet de la red) |
| Despliegue frontend | Vercel (u otro hosting externo) |
| Despliegue backend/workers | Contenedor Docker dentro de la red de Gammacargo o con VPN hacia ella (empieza en red interna; puede migrar a un PaaS externo si el servidor se expone hacia afuera más adelante) |
| CI/CD | GitHub Actions |

---

## 9. Relación con los Siguientes Documentos

El Documento 005 — Modelo de Datos Empresarial formaliza el esquema de PostgreSQL para las entidades ya mencionadas en el Documento 003. El Documento 009 — Arquitectura de Agentes de IA detalla la interfaz interna de "proveedor de razonamiento" mencionada en la sección 4. El Documento 010 — Especificación de API define los contratos REST que expone el backend NestJS hacia el CRM/ERP de Gammacargo. El Documento 011 — Modelo de Permisos formaliza el uso de RLS descrito en la sección 3. El Documento 013 — Infraestructura y Despliegue amplía la sección 6.

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) antes de continuar con el Documento 005, conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
