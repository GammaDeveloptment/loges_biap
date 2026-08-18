# Documento 010 — Especificación de API

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.6 (Entrega 5 — primera pasada de consolidación real: corrige la convención de la sección 3 a camelCase, que es lo que el código realmente usa; documenta el mecanismo de errores tal como quedó implementado, no solo como ejemplo ilustrativo; marca Tendencias y Sincronización CRM/ERP explícitamente como diseñadas pero no implementadas — este documento había descrito ambas como si ya existieran)
**Fecha:** Julio 2026 (actualizado agosto 2026)

---

## 0. Contexto

Este documento define los contratos REST que expone el backend NestJS (Documento 004) sobre las entidades del Documento 005, para dos consumidores distintos:

1. El frontend Next.js (Documento 006) — paneles por rol.
2. El CRM y el ERP de Gammacargo (Documento 003, módulo 3.7) — exportación de cargadores candidatos y proveedores evaluados, y sincronización del estado "cliente actual".

**Confirmado con el cliente:** el CRM de Gammacargo es **HubSpot** y el ERP es **Loges**, un sistema propio de Gammacargo (curiosamente, muy probablemente el origen real del nombre "Loges-BIAP" — ver nota en Documento 001). Esto resuelve el pendiente de negocio que el Documento 007 (sección 5) había señalado como bloqueante de la Entrega 7. La sección 4.5 detalla ambos adaptadores: HubSpot para cargadores candidatos (4.5.1) y Loges para proveedores logísticos evaluados (4.5.2, por escritura directa a tabla, no API, dado que ambos sistemas comparten servidor).

## 1. Principios de Diseño

- **REST sobre HTTPS, versionado explícito** (`/api/v1/...`) — un cambio incompatible se publica como `/api/v2`, nunca se rompe un contrato en el mismo path.
- **Una sola API para frontend e integraciones.** No existe una "API interna" distinta de la "API de integración": el frontend consume los mismos endpoints que el CRM/ERP, con permisos distintos según el token (Documento 011). Esto evita mantener dos contratos para el mismo dato.
- **La trazabilidad de fuente y confianza es parte del contrato, no un detalle interno.** Todo campo que en el Documento 005 tiene su propio `fuente_id`/`nivel_confianza` se expone con esa metadata (sección 3) — un consumidor externo no puede recibir un dato de Loges-BIAP sin saber de dónde viene.
- **Idempotencia en toda operación que dispare una acción externa** (sincronizar con CRM/ERP, disparar una tarea de agente) — un reintento de red no debe duplicar el efecto.

## 2. Autenticación y Control de Acceso

- Autenticación por token (JWT), emitido por `POST /api/v1/auth/login`.
- Cada token lleva el `area` del usuario o, para integraciones CRM/ERP, un rol técnico dedicado (`integracion_crm`, `integracion_erp`) sin acceso a las pantallas de negocio.
- El detalle de qué `area`/rol puede leer o escribir cada recurso se formaliza en el Documento 011 — esta especificación asume que existe ese control, pero no lo detalla aquí para no duplicarlo.

## 3. Convención: "Dato Trazable"

Patrón usado en cualquier campo que en el Documento 005 tiene fuente y confianza propias (coherente con el componente de UI del Documento 006, sección 5):

```json
{
  "valor": "Av. Central 123, San José",
  "fuente": { "id": "f_001", "nombre": "Registro Mercantil CR", "tipo": "registro_mercantil" },
  "nivelConfianza": "ALTA",
  "fechaVerificacion": "2026-07-20T10:00:00Z"
}
```

**Corrección (Entrega 5):** el ejemplo original de esta sección estaba en `snake_case`, heredado directamente del modelo de datos del Documento 005. El código real — DTOs, respuestas JSON, y el propio Documento 005 aplicado a Prisma — usa `camelCase` de forma consistente en toda la API, sin una sola excepción. Se corrige el ejemplo para que sea el contrato real, no una aspiración nunca implementada.

Los campos estructurales que no requieren trazabilidad propia (ej. `id`, `estado`, timestamps del sistema) se devuelven como valores planos.

## 4. Catálogo de Endpoints

### 4.1 Empresas (recurso central — cargadores, competidores y proveedores son la misma entidad con distinto rol, Documento 005)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/empresas` | Lista filtrable: `rol`, `sector`, `pais`, `nivelConfianza`, `estado`, `cursor`, `limite`. Paginado por cursor (sección 6). |
| GET | `/api/v1/empresas/{id}` | Ficha completa: datos generales (con "dato trazable" en campos enriquecibles), roles vigentes, contactos, registros de comercio exterior, perfil de proveedor/competidor si aplica, interacciones recientes. |
| GET | `/api/v1/empresas/{id}/historial` | Historial de cambios (`historial_cambio`, Documento 005) de esa empresa. |
| POST | `/api/v1/empresas/{id}/interacciones` | Registra una interacción de usuario: `tipoAccion` (`contactado`, `evaluado`, `descartado`, `marcado_relevante`) + `comentario` opcional. Alimenta `interaccion_usuario`. |
| GET | `/api/v1/empresas/{id}/cambios` | Solo aplica a empresas con rol `competidor`: lista de `competidor_cambio`. |

No existen rutas separadas `/cargadores`, `/proveedores`, `/competidores`: son vistas filtradas del mismo recurso `/empresas`, para no romper el principio de "una sola ficha por empresa" (Documento 005, sección 1; Documento 006, sección 4.2).

**Corrección (Entrega 5) — `tipo_servicio` y `tipo` nunca se implementaron como filtros separados, y no hace falta que lo sean:**
- **Proveedores:** el "tipo de servicio" ya se expresa como distintos valores de `rol` (`proveedor_transportista`, `proveedor_aduanal`, `proveedor_bodega` — Documento 005), no como un filtro adicional sobre un rol genérico `proveedor`. El frontend filtra pidiendo el/los rol(es) que corresponda. `ProveedorPerfil.tipoServicio` sí existe como columna propia (con sus propios valores: `transporte_terrestre`, `agente_aduanal`, `bodega_almacen`) pero vive en la ficha, no como parámetro de la lista.
- **Competidores:** `CompetidorPerfil.tipo` (`TipoCompetidor`) sí existe en el modelo de datos pero **no está implementado como filtro de `GET /empresas`** — a diferencia de proveedores, todos los competidores comparten el mismo `rol = competidor`. Si en el futuro se necesita filtrar la lista por tipo de competidor, hace falta agregar `tipo` al DTO y al `where` de `EmpresasService.listar` — no asumir que ya existe.

### 4.2 Tendencias

**Estado (Entrega 5): diseñado, no implementado.** No existe controller, service, ni módulo para esto en `apps/api/src` — la pantalla `Tendencias` del panel web es un placeholder explícito (Documento 007, Entrega 6, bloqueada además por depender de datos reales de comercio exterior que hoy no existen por el bloqueo del Documento 012-B). El contrato de abajo queda como diseño de referencia para cuando se implemente, no como algo ya consumible.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/tendencias` | Filtrable por `tipoAgregacion` (`sector`, `ruta`, `pais`), `clave`, rango de `periodo`. Expone `indicador_tendencia`. |

### 4.3 Fuentes (administración)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/fuentes` | Lista de fuentes con `nivel_confianza_base`, país, estado. |
| POST | `/api/v1/fuentes` | Registra una fuente **candidata** (nombre, tipo, país, `nivel_confianza_base`). Nace siempre con `activa = false` y `terminos_uso_verificados = false` — el alta y la aprobación legal son pasos distintos (Documento 012-B). *(Agregado en la implementación de la Entrega 6 — no estaba en la versión original de este documento.)* |
| PATCH | `/api/v1/fuentes/{id}` | Activar/desactivar una fuente (`activa`) y registrar su aprobación legal (`terminos_uso_verificados`, `aprobado_por`, `fecha_aprobacion_legal`, `referencia_legal` — Documento 012-B, sección 6). **Regla dura:** el backend rechaza (`400`) cualquier intento de poner `activa = true` sin `terminos_uso_verificados = true` (Documento 012, sección 4), incluso si ambos campos vienen en la misma solicitud. No permite editar el histórico ya recolectado. |

### 4.4 Ejecuciones de Agente (monitor y disparo manual)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/ejecuciones-agente` | Filtrable por `estado`, `tipo_tarea`. Alimenta el Monitor del Documento 006, sección 7. |
| POST | `/api/v1/ejecuciones-agente` | Dispara una tarea manual (`tipo_tarea` + `criterios`) — reservado a los roles que el Documento 011 autorice (ej. Comercial puede pedir una búsqueda puntual, Documento 009, sección 4). |

### 4.5 Sincronización con CRM/ERP

**Estado (Entrega 5): diseñado, no implementado.** No existe ningún archivo relacionado a `sincronizacion`, `webhook`, HubSpot o Loges en `apps/api/src` todavía — esta sección completa (incluida 4.5.1 y 4.5.2) es el diseño de la Entrega 7 del Documento 007, que además tiene sus propios pendientes explícitos antes de poder construirse (confirmar plan de HubSpot contratado, acordar el esquema de la tabla de aterrizaje con quien mantiene Loges — hoy, el propio cliente). Se deja el detalle completo porque ya fue validado como diseño, no porque esté funcionando.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/sincronizaciones` | Solicita exportar una empresa hacia `sistema_destino` (`crm` para cargadores candidatos vía HubSpot, `erp` para proveedores logísticos evaluados vía Loges). Idempotente por `(empresa_id, sistema_destino, ventana_de_tiempo)` — una segunda solicitud idéntica en curso no crea un segundo intento. Devuelve el registro `sincronizacion_externa` en estado `pendiente`. |
| GET | `/api/v1/sincronizaciones` | Filtrable por `empresa_id`, `sistema_destino`, `estado`. Consulta de estado (`pendiente`, `exitosa`, `fallida`). |
| POST | `/api/v1/webhooks/crm/estado-cliente` | **Entrada** desde el CRM: notifica que una empresa pasó a ser cliente real, para actualizar `empresa_rol` a `cliente_actual` y excluirla de futuras sugerencias de descubrimiento. Implementación concreta para HubSpot en la sección 4.5.1. |

**Aclaración de alcance (confirmada con el cliente):** Loges-BIAP **no integra directo con el ERP de facturación/comercio exterior general** de Gammacargo para el flujo de cargadores — solo exporta a HubSpot, que ya tiene su propia integración existente hacia Loges (el ERP propio de Gammacargo) para ese flujo. Loges-BIAP sí integra **directamente** con Loges, pero únicamente para el flujo de **proveedores logísticos evaluados** (Documento 003, módulo 3.7), con el mecanismo de la sección 4.5.2 — no vía API sino por escritura directa a una tabla, dado que ambos sistemas comparten el mismo servidor PostgreSQL (Documento 004).

#### 4.5.1 Adaptador HubSpot (CRM confirmado)

Este adaptador vive detrás de `sistema_destino = "crm"` — el resto de la API (sección 4.1-4.4) no cambia si Gammacargo migra de CRM en el futuro; solo cambiaría esta sección y su implementación.

**Salida (Loges-BIAP → HubSpot), al ejecutar `POST /api/v1/sincronizaciones`:**

- Se usa la API de objetos CRM de HubSpot (`/crm/v3/objects/companies`) para crear o actualizar una **Company**.
- Para evitar duplicados, se crean en HubSpot dos propiedades personalizadas sobre el objeto Company:
  - `loges_biap_empresa_id` (texto, único) — el `empresa.id` de Loges-BIAP. Antes de crear, se busca por esta propiedad (`/crm/v3/objects/companies/search`); si existe, se actualiza en vez de duplicar.
  - `loges_biap_nivel_confianza` y `loges_biap_fuente` — para que el equipo comercial vea el chip de confianza (Documento 006, sección 5) sin salir de HubSpot, reforzando la propuesta de transparencia también en la herramienta que ya usan.
- Autenticación mediante un **token de aplicación privada de HubSpot** (Private App access token), no OAuth de usuario — es una integración sistema-a-sistema dentro de la propia cuenta de Gammacargo, no una app pública distribuida a terceros.
- Límite de tasa de HubSpot (según su plan contratado) se respeta desde el backend con una cola de salida — no se dispara un llamado directo por cada `POST /sincronizaciones`, sino que se encola igual que las tareas del Motor de Agentes (Documento 009), para no romper el límite si se exportan varias empresas a la vez.

**Entrada (HubSpot → Loges-BIAP), para `empresa_rol = cliente_actual`:**

- Se configura un **Workflow de HubSpot** (disponible desde el plan Professional en adelante) que se dispara cuando el *lifecycle stage* de la Company cambia a `customer`, y que llama por webhook a `POST /api/v1/webhooks/crm/estado-cliente` con el `loges_biap_empresa_id` correspondiente.
- Si el plan de HubSpot de Gammacargo no incluye Workflows con acción de webhook, la alternativa (ya prevista en el diseño original de esta sección) es un job programado que hace *pull* periódico vía `/crm/v3/objects/companies/search` filtrando por `lifecyclestage = customer` y comparando contra el estado ya conocido — a confirmar según el plan contratado.

**Pendiente para el Documento 013 (implementación):** confirmar plan de HubSpot contratado (para saber si hay Workflows con webhook disponibles) y crear las propiedades personalizadas (`loges_biap_empresa_id`, `loges_biap_nivel_confianza`, `loges_biap_fuente`) en el portal de HubSpot de Gammacargo antes de la Entrega 7 del Documento 007.

#### 4.5.2 Adaptador Loges (ERP confirmado — plataforma corporativa de Gammacargo)

Este adaptador vive detrás de `sistema_destino = "erp"`, y se usa **exclusivamente** para proveedores logísticos evaluados (`proveedor_perfil`, Documento 005) — los cargadores nunca pasan por aquí (van a HubSpot, sección 4.5.1).

**Mecanismo (confirmado con el cliente): base de datos de aterrizaje dedicada, no una tabla dentro del esquema operativo de un módulo Loges existente.** Loges es la plataforma corporativa madre de Gammacargo, de la cual Loges-BIAP es un módulo más (Documento 001, sección 1) junto a otros como Loges-Aduanas o Loges-Carga. En vez de que Loges-BIAP escriba directo en el esquema interno de, por ejemplo, Loges-Carga (que sería el módulo más relacionado con proveedores), se crea una **base de datos nueva, dedicada exclusivamente a recibir los datos que Loges-BIAP produce** — en el mismo servidor PostgreSQL compartido (Documento 004, sección 3). El o los módulos Loges que necesiten esta información la consumen desde esa base de aterrizaje según su propia lógica y calendario, igual que Loges-BIAP nunca decide cuándo HubSpot sincroniza hacia Loges (sección 4.5.1) — cada sistema controla cómo consume lo que otro le entrega.

Esto reduce el riesgo de acoplamiento frente a la alternativa de escribir en una tabla ya existente de un módulo operativo: Loges-BIAP y el equipo de Loges acuerdan el esquema de esta base de aterrizaje como un **contrato de integración explícito**, no como una intrusión en un esquema que Loges-BIAP no controla ni entiende del todo.

- El backend de Loges-BIAP mantiene una **segunda conexión de base de datos**, separada de la suya propia (`loges_biap_prod`), apuntando a esta base de aterrizaje — con un **usuario de PostgreSQL de alcance mínimo**: únicamente `INSERT`/`UPDATE` sobre las tablas de esa base, nunca acceso a las bases de datos operativas de Loges-Carga, Loges-Aduanas u otro módulo (mismo principio de mínimo privilegio del Documento 011).
- Al ejecutar `POST /api/v1/sincronizaciones` con `sistema_destino = "erp"`, el backend inserta o actualiza una fila en la tabla de proveedores de esa base de aterrizaje, incluyendo `loges_biap_empresa_id` para trazabilidad.
- El resultado (éxito o error de la escritura) se refleja igual que cualquier otra sincronización en `sincronizacion_externa` (Documento 005) — desde el punto de vista del resto del sistema, es indistinguible de una integración por API; la diferencia vive solo dentro del adaptador.
- **Pendiente de definir con el equipo de Loges:** qué módulo (¿Loges-Carga?) consume esta base de aterrizaje y con qué frecuencia — esto no es responsabilidad de Loges-BIAP, pero si nadie la consume, los datos quedan huérfanos ahí. Vale la pena que esa responsabilidad quede explícita del lado de Loges antes de la Entrega 7.

**⚠️ Riesgo residual y mitigación.** Aunque usar una base dedicada reduce el acoplamiento frente a escribir en un esquema operativo ajeno, sigue existiendo un contrato de esquema entre dos sistemas — si cambia sin coordinarse, la escritura falla o inserta datos incorrectos sin que una API lo valide en el momento. **Mitigación:** esta escritura se aísla completamente detrás de una sola clase/adaptador en el backend (mismo patrón usado para aislar Anthropic en el Documento 004, sección 4) — el resto de Loges-BIAP solo conoce `sincronizacion_externa` y `POST /sincronizaciones`, nunca el esquema de la base de aterrizaje directamente. Si en el futuro algún módulo Loges expone una API propia para esto, el cambio se hace en esa única clase.

**Pendiente para el Documento 013 (implementación):** crear la base de datos de aterrizaje, definir junto con el equipo de Loges el esquema exacto de su tabla de proveedores (columnas mínimas: identificador de Loges-BIAP, datos del proveedor, tipo de servicio, nivel de confianza, fecha), confirmar qué módulo Loges la consume, y las credenciales de la conexión de alcance mínimo.

### 4.6 Usuarios (base — detalle de permisos en Documento 011)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/usuarios` | Solo rol Administrador. |
| POST | `/api/v1/usuarios` | Alta de usuario. |
| PATCH | `/api/v1/usuarios/{id}` | Editar área/estado activo. |

## 5. Manejo de Errores

Formato de error consistente en toda la API:

```json
{
  "error": {
    "codigo": "EMPRESA_NO_ENCONTRADA",
    "mensaje": "No existe una empresa con el id solicitado.",
    "detalle": null
  }
}
```

Códigos HTTP estándar (400 solicitud inválida, 401/403 autenticación/permiso, 404 no encontrado, 409 conflicto de idempotencia, 422 validación de negocio, 5xx error del servidor). El `codigo` es estable y documentado por endpoint — un integrador de CRM/ERP puede programar contra el `codigo`, no contra el texto del `mensaje`.

**Implementado (Entrega 5) — `ErrorApiFilter`, filtro global registrado en `main.ts`:**

Antes de esta entrega, este formato existía solo en este documento; el backend devolvía el shape default de NestJS (`{message, error, statusCode}`), que el frontend (`apps/web/src/lib/api.ts`) ya esperaba leer como `{error:{codigo,...}}` — la consecuencia real, no solo teórica, era que **todo error específico (permiso denegado, empresa no encontrada, validación de campos) se mostraba en el frontend como "Ocurrio un error inesperado"**, un mensaje genérico que descartaba el mensaje real que el backend ya calculaba correctamente. Corregido con un filtro global (`apps/api/src/common/filters/error-api.filter.ts`).

Catálogo de `codigo` estable hoy (crece a medida que se agregan condiciones de negocio que lo necesiten — no es exhaustivo por diseño):

| Código | Cuándo |
|---|---|
| `EMPRESA_NO_ENCONTRADA` | `GET/POST /empresas/{id}...` con un id que no existe. |
| `EMPRESA_SIN_PERFIL_COMPETIDOR` | `GET /empresas/{id}/cambios` sobre una empresa sin `competidor_perfil`. |
| `FUENTE_NO_ENCONTRADA` | `PATCH /fuentes/{id}` con un id que no existe. |
| `FUENTE_TERMINOS_NO_VERIFICADOS` | Intento de `activa=true` sin `terminos_uso_verificados=true` (Documento 012, sección 4). |

Cualquier otra excepción cae a un `codigo` genérico derivado del status HTTP (`PERMISO_DENEGADO` 403, `NO_ENCONTRADO` 404, `SOLICITUD_INVALIDA` 400 — incluye los errores de `class-validator`, con el arreglo completo de mensajes en `detalle` —, `NO_AUTENTICADO` 401, `CONFLICTO` 409, `VALIDACION_NEGOCIO` 422) o a `ERROR_INTERNO` (500) para cualquier excepción no controlada — esta última nunca expone el mensaje interno real a un consumidor externo, solo se registra en el log del servidor.

## 6. Paginación y Filtrado

Todos los listados usan paginación por cursor (`?cursor=...&limite=50`), no por número de página, porque los datos cambian de forma continua (Documento 001) y la paginación por página numérica es inconsistente cuando la lista subyacente se actualiza entre una página y la siguiente.

**Implementado (Entrega 5) en `GET /empresas`:** `limite` es opcional y configurable (entero entre 1 y 100), no un valor fijo — antes de esta entrega estaba hardcodeado a 50 sin que el consumidor pudiera pedir menos o más. Pedir un `limite` fuera de ese rango devuelve `400 SOLICITUD_INVALIDA` en vez de recortarlo en silencio, para que el consumidor sepa que su solicitud no fue lo que pidió. Sin `limite`, el valor por defecto sigue siendo 50.

## 7. Versionado y Compatibilidad

- Un campo nuevo puede agregarse a una respuesta existente sin cambiar de versión (los consumidores deben ignorar campos desconocidos).
- Un campo que cambia de tipo o se elimina, o un endpoint que cambia su contrato de entrada, requiere una nueva versión (`/api/v2`) — nunca se modifica el contrato de una versión ya publicada, dado que el CRM/ERP de Gammacargo es un consumidor externo al ciclo de desarrollo de Loges-BIAP.

## 8. Relación con los Siguientes Documentos

**Nota menor (Entrega 5):** existe además `GET /api/v1/health` (sin autenticación, sin "dato trazable" — devuelve `{status:"ok"}`), que no es parte del catálogo de negocio de este documento sino un endpoint de infraestructura para monitoreo (Documento 013).

El Documento 011 — Modelo de Permisos formaliza qué rol/token puede acceder a cada endpoint de este catálogo. El Documento 012 no se expone directamente en esta API — los conectores de fuentes son internos al Motor de Agentes (Documento 009) y nunca un recurso público. El Documento 013 — Infraestructura y Despliegue debe definir límites de tasa (*rate limiting*) para las llamadas del CRM/ERP y monitoreo de los endpoints de sincronización. El Documento 015 — Manual del Desarrollador debe incluir ejemplos de uso de esta API para el equipo de integración.

---

*Nota de versión: el pie original de este documento pedía validación del cliente antes de pasar al Documento 011 — eso corresponde a la Fase 1 (blueprint), ya cerrada y aprobada el 2026-07-30. Las revisiones v0.4 en adelante son actualizaciones de Fase 2 (Entregas 6 y 5) para que el contrato documentado coincida con la implementación real, no borrador pendiente de esa aprobación inicial.*
