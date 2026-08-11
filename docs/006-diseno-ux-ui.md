# Documento 006 — Diseño UX/UI

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.1
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento continúa el Documento 003 — Arquitectura Funcional (qué hace el sistema) y el Documento 005 — Modelo de Datos (qué se guarda). Aquí se define la experiencia: qué pantallas existen, qué ve cada actor de Gammacargo (Documento 003, sección 1) y cómo se traduce en interfaz la regla de "ningún dato sin fuente y confianza".

No se define aquí el detalle visual pixel a pixel (paleta final, componentes de un design system específico) — eso es trabajo de implementación de la Fase 2. Este documento fija estructura de pantallas, jerarquía de información y los patrones de interacción que sí condicionan el modelo de datos y la API (Documentos 005 y 010).

## 1. Principios de Diseño

Derivados directamente de los valores del Documento 001:

- **Transparencia visible, no enterrada.** La fuente y el nivel de confianza de un dato no viven en un detalle que hay que ir a buscar — son parte del componente visual principal (ver sección 5), porque es el valor diferencial del producto, no un detalle técnico.
- **Calidad sobre volumen.** Ninguna pantalla de resultados es una lista plana sin priorizar. Todo listado (cargadores candidatos, proveedores, competidores) se muestra ordenado por relevancia/confianza, con filtros que reducen antes que exploran.
- **Información viva, no una foto fija.** Toda pantalla de detalle muestra "última verificación" y permite ver el historial de cambios (Documento 005, `historial_cambio`) — nunca se presenta un dato como si fuera definitivo y estático.
- **La decisión del usuario queda registrada, no solo aplicada.** Contactar, evaluar o descartar una empresa es una acción explícita y visible en la interfaz (no un simple "ocultar"), coherente con `interaccion_usuario` del Documento 005.
- **Cada rol ve lo que necesita decidir, no todo el sistema.** La pantalla de inicio cambia según el actor (sección 3) — no hay una sola vista genérica para todos.

## 2. Arquitectura de Información y Navegación

Navegación principal (barra lateral), con visibilidad de cada ítem controlada por rol (detalle de permisos en el Documento 011):

```
┌─────────────────────────────┐
│ Loges-BIAP                   │
├─────────────────────────────┤
│ ▸ Inicio (panel por rol)     │
│ ▸ Cargadores                 │  ← Módulo 3.1
│ ▸ Competidores                │  ← Módulo 3.2
│ ▸ Proveedores Logísticos      │  ← Módulo 3.3
│ ▸ Tendencias de Mercado       │  ← Módulo 3.4
│ ─────────────────────────    │
│ ▸ Administración              │  ← Módulo 3.9 (solo rol Administrador)
└─────────────────────────────┘
```

La Gestión de Fuentes y Confianza (3.5) y el Motor de Agentes (3.6) no tienen un ítem de navegación propio para los roles de negocio — son transversales y se manifiestan dentro de cada pantalla (sección 5) y en el panel de Administración (sección 7) respectivamente.

## 3. Vista de Inicio por Rol

| Rol | Qué ve al entrar |
|---|---|
| Comercial / Ventas | Cargadores candidatos nuevos desde su última sesión, ordenados por potencial estimado; accesos directos a "Buscar cargadores". |
| Gerencia Comercial | Alertas recientes de competidores (nueva ruta, alianza, expansión) + resumen comparativo de cobertura. |
| Operaciones / Compras | Proveedores pendientes de evaluación por zona/tipo de servicio. |
| Dirección General | Panel de tendencias (rutas y sectores en crecimiento) + resumen ejecutivo cruzando los tres módulos anteriores. |
| Administrador | Estado del Motor de Agentes (ejecuciones recientes, fallos) + fuentes activas/inactivas. |

## 4. Pantallas Clave por Módulo

### 4.1 Búsqueda y Listado de Cargadores (Módulo 3.1)

```
┌───────────────────────────────────────────────────────────┐
│ Cargadores                                    [+ Nueva búsqueda] │
├───────────────────────────────────────────────────────────┤
│ Filtros: [Sector ▾] [País ▾] [Tipo de carga ▾] [Confianza ▾] │
├───────────────────────────────────────────────────────────┤
│ ● Empresa ABC S.A.        Textiles · CR→US   Confianza: ALTA │
│   Detectada hace 3 días · 2 fuentes corroboran               │
│ ● Importadora XYZ         Electrónica · CR→MX Confianza: MEDIA│
│   Detectada hace 1 semana                                     │
│ ...                                                            │
└───────────────────────────────────────────────────────────┘
```

Cada fila lleva el chip de confianza (sección 5) y un indicador de "cuántas fuentes corroboran este hallazgo". Un clic abre la ficha de empresa.

### 4.2 Ficha de Empresa (compartida por los cuatro módulos de negocio)

Es la pantalla de detalle que reutilizan Cargadores, Competidores y Proveedores — porque, por diseño (Documento 005), son la misma entidad `empresa` con distintos roles.

```
┌───────────────────────────────────────────────────────────┐
│ Empresa ABC S.A.                        [Contactar] [Descartar] │
│ Roles: Cargador candidato                                     │
├───────────────────────────────────────────────────────────┤
│ Datos generales           │ Historial de comercio exterior     │
│  Sector: Textiles          │  • Exportación textiles CR→US       │
│  País: Costa Rica          │    (fuente: Aduanas CR, ALTA)        │
│  Dirección: ... (MEDIA)    │  • ...                               │
├───────────────────────────────────────────────────────────┤
│ Contactos                 │ Actividad reciente                  │
│  Juan Pérez, Gerente ...   │  Contactado por María (Comercial)    │
│                            │  el 12/07/2026                        │
└───────────────────────────────────────────────────────────┘
```

Las acciones "Contactar" / "Evaluar" / "Descartar" (según el módulo) escriben directamente en `interaccion_usuario` y quedan visibles en "Actividad reciente" para cualquier otro usuario que abra la misma ficha — evita que dos comerciales contacten a la misma empresa sin saberlo.

### 4.3 Competidores (Módulo 3.2)

Vista comparativa (tabla o tarjetas) de competidores monitoreados, con una columna/sección de "Cambios recientes" que lista las filas de `competidor_cambio` más nuevas primero. Cada competidor abre a la misma Ficha de Empresa (4.2), con una sección adicional de cobertura geográfica y rutas.

### 4.4 Proveedores Logísticos (Módulo 3.3)

Directorio filtrable por zona y tipo de servicio (transporte terrestre, agente aduanal, bodega), con estado de evaluación visible como etiqueta (`nuevo`, `en evaluación`, `aprobado`, `descartado`). La ficha de un proveedor añade un panel de "Evaluación" donde Operaciones/Compras registra su decisión — mismo patrón de acción-registrada que en Cargadores.

### 4.5 Tendencias de Mercado (Módulo 3.4)

Dashboard con gráficas por sector/ruta/país (variación en el tiempo), pensado para Dirección General. No permite edición — es puramente de lectura, alimentado por `indicador_tendencia` (Documento 005).

## 5. Patrón Transversal: Componente de Fuente y Confianza

Este es el componente de interfaz más importante del sistema, porque materializa la propuesta de valor de "Transparencia" (Documento 001). Aparece junto a cualquier dato individual, no solo en el resumen de la empresa:

```
[Dirección: Av. Central 123, San José]  🟢 ALTA
                                          ↳ al pasar el mouse/tap:
                                            Fuente: Registro Mercantil CR
                                            Verificado: hace 2 días
                                            Corroborado por: 1 fuente adicional
```

- 🟢 ALTA / 🟡 MEDIA / ⚪ BAJA como código de color consistente en toda la aplicación.
- El detalle (fuente, fecha, corroboración) se muestra en un tooltip/popover para no saturar la vista principal — pero siempre está a un clic o tap de distancia, nunca en una pantalla aparte.
- Un dato marcado como no verificado recientemente (ver `fecha_ultima_verificacion`, Documento 005) se muestra con un indicador adicional de "pendiente de reverificación".

## 6. Patrón Transversal: Ciclo de Vida Visible de una Empresa

Para que "descartar" no se sienta como borrar información, toda ficha de empresa muestra su estado como una línea de progreso simple:

```
Nuevo → Contactado → Evaluado → (Cliente / Descartado)
```

Este estado se deriva de las filas de `interaccion_usuario` más recientes (Documento 005) y es la misma idea tanto para un cargador candidato como para un proveedor logístico, cambiando solo las etiquetas del último paso.

## 7. Pantallas de Administración (Módulo 3.9, rol Administrador)

- **Usuarios y roles:** alta/baja de usuarios, asignación de área (Documento 011 define el detalle de permisos por área).
- **Fuentes activas:** listado de `fuente` con su `nivel_confianza_base`, país y estado (activa/inactiva) — activar o desactivar una fuente sin perder el histórico ya recolectado.
- **Monitor del Motor de Agentes:** listado de `ejecucion_agente` (Documento 005) con estado, duración y resultado — para detectar fallas de descubrimiento sin tener que revisar logs técnicos directamente.
- **Sincronización CRM/ERP:** estado de las últimas sincronizaciones (`sincronizacion_externa`), con reintento manual si una falló.

## 8. Estilo Visual y Accesibilidad (lineamientos, no especificación final)

- **Desktop-first.** Los cuatro roles de negocio trabajan principalmente desde escritorio en horario laboral; no se prioriza una versión móvil nativa en esta fase (ver Documento 003, fuera de alcance).
- **Contraste y color no exclusivo.** El código de color de confianza (sección 5) siempre va acompañado de texto (`ALTA`/`MEDIA`/`BAJA`), nunca solo color, para accesibilidad y para usuarios con daltonismo.
- **Densidad de información alta pero jerarquizada.** Dado que los usuarios son equipos comerciales/operativos revisando muchos registros por sesión, se prioriza la tabla/lista compacta sobre tarjetas grandes, reservando las tarjetas para el panel de inicio.

## 9. Fuera de Alcance en esta Versión

- Aplicación móvil nativa.
- Constructor de dashboards personalizables por el usuario (los dashboards de la sección 4.5 y 3 son fijos en esta fase).
- Modo oscuro (puede evaluarse en una iteración posterior, no bloquea el desarrollo inicial).
- Onboarding interactivo tipo tutorial — se resuelve con capacitación directa del equipo de producto (Documento 002, sección 4), no con producto.

## 10. Relación con los Siguientes Documentos

El Documento 007 — Roadmap de Desarrollo debe secuenciar qué pantallas de este documento se construyen en qué módulo/entrega. El Documento 010 — Especificación de API debe exponer los contratos que alimentan cada pantalla aquí descrita (en particular la Ficha de Empresa, que agrega datos de varias tablas del Documento 005). El Documento 011 — Modelo de Permisos define qué rol ve qué ítem de navegación (sección 2) y qué acciones puede ejecutar (contactar/evaluar/descartar, administración).

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) antes de continuar con el Documento 007, conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
