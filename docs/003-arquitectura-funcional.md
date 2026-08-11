# Documento 003 — Arquitectura Funcional (Qué hace Loges-BIAP)

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.1
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento continúa el Documento 001 — Fundación y el Documento 002 — Modelo de Negocio, ya adaptados a Loges-BIAP para Grupo Gammacargo. Aquí se define qué hace el sistema desde el punto de vista funcional: sus módulos, actores, entradas, salidas y flujo de trabajo. Deliberadamente no se abordan aquí decisiones de tecnología, base de datos o infraestructura — eso corresponde al Documento 004 — Arquitectura Técnica.

Regla de oro que guía cada módulo descrito: ¿esto ayuda a Gammacargo (o a su cliente) a tomar una mejor decisión logística o comercial? Todo módulo que no supere esa pregunta queda fuera de alcance.

## 1. Actores Funcionales

- **Comercial / Ventas** — busca nuevos cargadores y da seguimiento a oportunidades.
- **Operaciones / Compras** — evalúa y selecciona proveedores logísticos.
- **Gerencia Comercial** — analiza competidores y tendencias de mercado para decisiones estratégicas.
- **Administrador de la plataforma** — gestiona usuarios, permisos y configuración de fuentes.
- **Motor de Agentes de IA** — actor no humano que ejecuta el descubrimiento, enriquecimiento y actualización continua en segundo plano.

## 2. Visión General del Sistema

Loges-BIAP funciona como un flujo continuo: los agentes de IA descubren y enriquecen información pública relevante para el negocio de Gammacargo; esa información se estructura, se le asigna una fuente y un nivel de confianza, y queda disponible para los usuarios humanos a través de paneles y para los sistemas de Gammacargo a través de la API. El sistema no reemplaza el criterio comercial u operativo: lo alimenta con información mejor y más rápida.

## 3. Módulos Funcionales

### 3.1 Módulo de Descubrimiento de Cargadores

**Objetivo**
Identificar empresas que importan o exportan mercancía y que representan una oportunidad comercial para Gammacargo, incluyendo aquellas que aún no son clientes.

**Entradas**
- Criterios de búsqueda definidos por Comercial (sector, país, volumen estimado, tipo de carga).
- Fuentes públicas de comercio exterior y registros mercantiles.

**Salidas**
- Listado de empresas candidatas con datos de contacto y evidencia de actividad de comercio exterior.
- Ficha de empresa con nivel de confianza de cada dato.

**Capacidades principales**
- Búsqueda por sector, país de origen/destino y tipo de carga.
- Detección de señales de actividad reciente de importación/exportación.
- Priorización de candidatos según potencial estimado.

### 3.2 Módulo de Análisis de Competidores

**Objetivo**
Dar visibilidad sobre otras navieras, freight forwarders y agentes de carga: su cobertura, rutas y posicionamiento.

**Entradas**
- Nombres o dominios de competidores conocidos.
- Información pública corporativa y comercial de esos competidores.

**Salidas**
- Perfil comparativo de competidores.
- Alertas de cambios relevantes (nueva ruta, nueva alianza, expansión).

**Capacidades principales**
- Monitoreo continuo de competidores registrados.
- Comparación de cobertura geográfica y de servicios.
- Historial de cambios detectados en el tiempo.

### 3.3 Módulo de Enriquecimiento de Proveedores Logísticos

**Objetivo**
Apoyar a Operaciones y Compras en la identificación y evaluación de transportistas terrestres, agentes aduanales y bodegas/almacenes.

**Entradas**
- Zona geográfica y tipo de servicio requerido.
- Fuentes públicas sectoriales y registros de licencias/permisos cuando estén disponibles.

**Salidas**
- Directorio de proveedores potenciales con datos de contacto y evidencia operativa.
- Indicadores de confiabilidad de cada proveedor listado.

**Capacidades principales**
- Búsqueda de proveedores por zona y tipo de servicio.
- Verificación cruzada de información entre varias fuentes.
- Marcado de proveedores ya evaluados o descartados por Gammacargo.

### 3.4 Módulo de Inteligencia de Mercado y Tendencias

**Objetivo**
Detectar tendencias de comercio exterior y rutas comerciales emergentes que apoyen decisiones de expansión de la Dirección General.

**Entradas**
- Datos históricos y actuales acumulados por los demás módulos.
- Fuentes públicas de estadísticas de comercio exterior.

**Salidas**
- Reportes de tendencia por sector, ruta o país.
- Indicadores de crecimiento o contracción de mercados relevantes para Gammacargo.

**Capacidades principales**
- Agregación de datos históricos del sistema.
- Visualización de tendencias por periodo.
- Identificación de rutas o sectores en crecimiento.

### 3.5 Módulo de Gestión de Fuentes y Confianza (transversal)

**Objetivo**
Garantizar que cada dato entregado por Loges-BIAP sea trazable: de dónde proviene y qué tan confiable es. Es transversal a todos los módulos anteriores.

**Entradas**
- Todo dato generado por cualquier otro módulo del sistema.

**Salidas**
- Etiqueta de fuente y nivel de confianza visible en cada registro.
- Registro de fecha de última actualización por dato.

**Capacidades principales**
- Asignación automática de nivel de confianza según la fuente.
- Historial de cambios por dato.
- Marcado de datos obsoletos o pendientes de reverificación.

### 3.6 Motor de Agentes de IA (transversal)

**Objetivo**
Orquestar el descubrimiento, enriquecimiento, verificación y actualización continua de información en todos los módulos, sin intervención manual constante.

**Entradas**
- Reglas y criterios definidos por cada módulo funcional.
- Resultado de ejecuciones previas para priorizar qué actualizar primero.

**Salidas**
- Datos nuevos o actualizados listos para los módulos correspondientes.
- Registro de ejecución (qué se buscó, cuándo y con qué resultado).

**Capacidades principales**
- Planificación y priorización de tareas de descubrimiento.
- Verificación cruzada entre fuentes antes de publicar un dato.
- Actualización continua sin duplicar trabajo ya realizado.

### 3.7 Módulo de Integración (API)

**Objetivo**
Permitir que la información de Loges-BIAP fluya hacia el CRM y el ERP que Gammacargo ya utiliza, sin trabajo manual de traspaso.

**Entradas**
- Solicitudes desde los sistemas de Gammacargo (CRM/ERP).
- Configuración de qué datos y con qué frecuencia se sincronizan.

**Salidas**
- Datos estructurados entregados vía API a los sistemas de destino.
- Confirmación de sincronización exitosa o fallida.

**Capacidades principales**
- Exportación de empresas candidatas al CRM comercial.
- Sincronización de proveedores evaluados hacia el ERP.
- Notificación de nuevos hallazgos relevantes.

### 3.8 Panel de Inteligencia Comercial (Dashboards)

**Objetivo**
Dar visibilidad ejecutiva y operativa sobre lo que el sistema ha descubierto, sin necesidad de revisar datos crudos.

**Entradas**
- Datos ya procesados por los módulos anteriores.

**Salidas**
- Vistas por rol: comercial, operaciones, gerencia.
- Reportes exportables.

**Capacidades principales**
- Panel de nuevos cargadores detectados.
- Panel comparativo de competidores.
- Panel de tendencias de mercado.

### 3.9 Módulo de Administración y Permisos

**Objetivo**
Controlar quién dentro de Gammacargo accede a qué información, dado que parte de los datos son comercialmente sensibles.

**Entradas**
- Estructura de roles y usuarios de Gammacargo.

**Salidas**
- Accesos configurados por rol y por módulo.

**Capacidades principales**
- Gestión de usuarios y roles.
- Configuración de fuentes activas por módulo.
- Auditoría de accesos y cambios.

## 4. Flujo Funcional de Extremo a Extremo

El siguiente flujo resume cómo interactúan los módulos entre sí, desde la búsqueda inicial hasta la decisión de negocio.

| Paso | Descripción |
|---|---|
| 1 | El usuario (Comercial, Operaciones o Gerencia) define un criterio de búsqueda o el sistema ejecuta una actualización programada. |
| 2 | El Motor de Agentes de IA planifica y ejecuta el descubrimiento en las fuentes públicas correspondientes. |
| 3 | Los datos encontrados pasan por el Módulo de Gestión de Fuentes y Confianza, que asigna trazabilidad y nivel de confianza. |
| 4 | La información estructurada llega al módulo funcional correspondiente (Cargadores, Competidores, Proveedores o Mercado). |
| 5 | El usuario consulta la información en el Panel de Inteligencia Comercial o esta se sincroniza automáticamente vía API hacia el CRM/ERP. |
| 6 | El usuario toma la decisión comercial u operativa (contactar, evaluar, descartar). El sistema registra el resultado para refinar futuras búsquedas. |

## 5. Reglas de Negocio Funcionales Clave

- Ningún dato se presenta sin su fuente y nivel de confianza asociados.
- La información se actualiza de forma continua; no existen "cargas únicas" de datos que luego queden congeladas.
- El acceso a información comercialmente sensible (por ejemplo, detalle de competidores) se restringe por rol.
- Todo dato descartado o marcado como irrelevante por un usuario debe excluirse de futuras sugerencias similares, salvo revisión explícita.

## 6. Fuera de Alcance en esta Versión

Para mantener el enfoque, quedan explícitamente fuera de esta versión de Loges-BIAP:

- Negociación o cotización automática con cargadores o proveedores.
- Seguimiento de embarques en tránsito (tracking operativo de carga ya contratada).
- Facturación o gestión financiera — estas permanecen en el ERP de Gammacargo.
- Venta del producto a terceras empresas logísticas — queda como posible evolución futura, no como requisito de esta fase.

## 7. Relación con los Siguientes Documentos

El Documento 004 — Arquitectura Técnica deberá proponer cómo se construye cada uno de estos módulos (stack, servicios, proveedor de IA). El Documento 005 — Modelo de Datos deberá formalizar las entidades mencionadas aquí (empresa, proveedor, competidor, fuente, nivel de confianza). El Documento 009 — Arquitectura de Agentes de IA profundizará específicamente en el Motor de Agentes descrito en la sección 3.6.
