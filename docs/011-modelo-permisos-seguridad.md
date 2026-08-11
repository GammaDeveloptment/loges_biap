# Documento 011 — Modelo de Permisos y Seguridad

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.1
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento formaliza el control de acceso que los Documentos 003 (módulo 3.9), 004 (RLS sobre PostgreSQL), 005 (`usuario`) y 010 (roles de token) ya dejaron anunciado. Define quién puede ver y modificar qué, y por qué — no como una lista arbitraria de permisos, sino derivada de las áreas de decisión ya establecidas en el Documento 001, sección 8.

## 1. Principios de Seguridad

- **Mínimo privilegio por función, no por confianza en la persona.** Un usuario ve lo que su área necesita para decidir (Documento 006, principio 1), nada más — no porque no se confíe en el resto del equipo, sino porque menos superficie de datos sensibles expuestos es menos riesgo si una cuenta se ve comprometida.
- **Separación entre sostenimiento del sistema y contenido de negocio.** El rol Administrador gestiona usuarios, fuentes y el Motor de Agentes, pero **no obtiene automáticamente acceso al contenido comercial sensible** (fichas detalladas, evaluaciones de proveedores, análisis de competidores) — administrar el sistema y decidir sobre el negocio son funciones distintas (sección 6).
- **Todo acceso relevante es auditable**, tanto a nivel de dato (`historial_cambio`, Documento 005) como a nivel de acceso a la sesión (`auditoria_acceso`, sección 7) — son dos auditorías distintas: una de qué cambió, otra de quién entró y a qué intentó acceder.
- **El nivel de confianza de un dato nunca es un control de acceso.** `nivel_confianza` (Documento 005) decide si un dato se resalta como incierto, no si un usuario puede verlo — son conceptos independientes y no deben confundirse en la implementación.

## 2. Roles / Áreas

### 2.1 Roles humanos (`usuario.area`, Documento 005)

| Área | Corresponde a (Documento 001, sección 8) |
|---|---|
| `comercial` | Comercial / Ventas |
| `gerencia_comercial` | Gerencia Comercial |
| `operaciones_compras` | Operaciones / Compras |
| `direccion_general` | Dirección General |
| `administrador` | Administrador de la plataforma (Documento 003, sección 1) |

### 2.2 Roles técnicos (tokens de sistema, Documento 010)

| Rol técnico | Uso |
|---|---|
| `integracion_crm` | Token usado por el adaptador de HubSpot (Documento 010, 4.5.1). Sin acceso a pantallas ni a otros endpoints. |
| `integracion_erp` | Reservado para cuando se confirme el ERP (Documento 007, riesgo pendiente). |

Ningún rol técnico puede autenticarse contra `/auth/login` (ese endpoint es solo para personas) — los tokens de integración se emiten y rotan por fuera de ese flujo (sección 8).

## 3. Matriz de Permisos por Recurso

| Recurso | `comercial` | `gerencia_comercial` | `operaciones_compras` | `direccion_general` | `administrador` |
|---|---|---|---|---|---|
| Empresas — rol `cargador_candidato` / `cliente_actual` | Lectura + escritura (interacciones) | Solo lectura | — | Solo lectura | — |
| Empresas — rol `competidor` + `competidor_cambio` | — | Lectura + escritura (interacciones) | — | Solo lectura | — |
| Empresas — rol `proveedor_*` + `proveedor_perfil` | — | — | Lectura + escritura (evaluación) | Solo lectura | — |
| Tendencias (`indicador_tendencia`) | — | Solo lectura | — | Solo lectura | — |
| Fuentes (`fuente`) | — | — | — | — | Lectura + escritura |
| Ejecuciones de agente | Disparo manual de `descubrimiento_cargador` | Disparo manual de `monitoreo_competidor` | Disparo manual de `enriquecimiento_proveedor` | Solo lectura | Lectura de todas (monitor) |
| Usuarios | — | — | — | — | Lectura + escritura |
| Sincronizaciones CRM/ERP | Solicitar (empresas propias) | Solicitar (empresas propias) | Solicitar (empresas propias) | Solo lectura | Solo lectura |

Notas de lectura de la tabla:

- "—" significa sin acceso, ni de lectura — no solo sin escritura. Ej.: Comercial no ve `competidor_perfil` ni `proveedor_perfil`, porque no es su decisión (Documento 001, sección 8) y son datos comercialmente sensibles de otra área.
- Dirección General tiene **lectura de todo lo de negocio**, coherente con el panel de resumen ejecutivo del Documento 006, sección 3, pero **ninguna escritura operativa** — no contacta, no evalúa, no descarta directamente (Documento 003, sección 2: "el sistema no reemplaza el criterio comercial u operativo").
- Administrador no tiene lectura de las tablas de contenido de negocio (empresas, contactos, registros de comercio exterior) — solo de las tablas de sostenimiento del sistema (sección 6).

## 4. Autenticación

- JWT emitido por `POST /api/v1/auth/login` (Documento 010), firmado por el backend, con el `area` del usuario embebida en el claim.
- Contraseñas con hash `bcrypt` (o equivalente), nunca en texto plano ni reversible.
- Expiración de token corta (ej. 8 horas, la jornada laboral) con *refresh token* de mayor duración; cerrar sesión invalida ambos.
- **Nota abierta:** este documento asume autenticación propia (usuario/contraseña gestionados por Loges-BIAP). Si Gammacargo ya tiene un directorio corporativo o SSO existente que prefiera reutilizar, esa integración se define como una extensión de este mecanismo en el Documento 013 (Infraestructura), no como una reescritura — a confirmar con el cliente antes de esa etapa.

## 5. Row Level Security (RLS) en PostgreSQL

Siguiendo la decisión del Documento 004 (sección 3), cada tabla de contenido de negocio implementa RLS basada en el `area` del usuario autenticado, que el backend fija como variable de sesión al abrir la conexión (ej. `SET app.current_user_area = 'comercial'`). Ejemplo representativo sobre `empresa_rol`:

```sql
CREATE POLICY empresa_rol_por_area ON empresa_rol
USING (
  current_setting('app.current_user_area') = 'direccion_general'
  OR (current_setting('app.current_user_area') = 'comercial'
      AND rol IN ('cargador_candidato', 'cliente_actual'))
  OR (current_setting('app.current_user_area') = 'gerencia_comercial'
      AND rol = 'competidor')
  OR (current_setting('app.current_user_area') = 'operaciones_compras'
      AND rol LIKE 'proveedor_%')
);
```

Este patrón se replica (con su propia condición) en `proveedor_perfil`, `competidor_perfil`, `competidor_cambio`, `contacto` y `registro_comercio_exterior` (todas unidas a `empresa`/`empresa_rol`). La ventaja de resolverlo en RLS y no solo en el backend: aunque una consulta tenga un error de lógica en el código de la aplicación, la base de datos igual no devuelve filas fuera del alcance del rol — es una segunda capa de defensa, no la única.

## 6. Datos Comercialmente Sensibles y Separación de Funciones

Se consideran comercialmente sensibles: el detalle de `competidor_perfil`/`competidor_cambio`, las evaluaciones de `proveedor_perfil`, y el contenido de `interaccion_usuario` (comentarios internos sobre por qué se contactó, evaluó o descartó una empresa).

El rol Administrador queda **explícitamente fuera** del acceso a estas tablas por defecto (sección 3). Si en un caso puntual Gammacargo necesita que una misma persona sea Administrador y además participe del negocio (ej. en un equipo pequeño), esa persona debe tener **dos asignaciones de área** (p. ej. `administrador` + `gerencia_comercial`), no un permiso ampliado del rol `administrador` en sí — así la razón de cada acceso queda explícita y auditable, en vez de que "administrador" se convierta silenciosamente en un superusuario de negocio.

## 7. Auditoría de Acceso

Tabla `auditoria_acceso`, distinta de `historial_cambio` (Documento 005, que audita cambios de datos, no accesos):

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| usuario_id | uuid (FK → usuario) | nullable si el intento de login falló antes de identificar un usuario válido. |
| accion | enum | `login_exitoso`, `login_fallido`, `acceso_denegado`. |
| recurso | text | nullable — qué endpoint/recurso se intentó acceder, relevante sobre todo para `acceso_denegado`. |
| ip_origen | text | |
| fecha | timestamptz | |

Un patrón repetido de `acceso_denegado` desde el mismo usuario es una señal a revisar (¿permiso mal configurado o intento indebido?) y debe ser visible en el panel de Administración (Documento 006, sección 7) junto al monitor del Motor de Agentes.

## 8. Gestión de Tokens de Integración

- Los tokens `integracion_crm`/`integracion_erp` (sección 2.2) se generan manualmente por un Administrador, con alcance restringido únicamente a los endpoints de `/sincronizaciones` y sus lecturas asociadas (Documento 010, sección 4.5) — nunca a `/empresas` de forma general ni a pantallas.
- Rotación recomendada cada 90 días o inmediatamente si se sospecha una fuga, sin necesidad de cambiar la lógica de integración (solo el valor del token).
- El token privado de la aplicación de HubSpot (Documento 010, 4.5.1) se gestiona del lado de Loges-BIAP como un secreto de backend, nunca expuesto al frontend ni a logs.

## 9. Fuera de Alcance en esta Versión

- Autenticación multifactor (2FA) obligatoria — puede añadirse sin rediseño sobre el mecanismo de la sección 4, se deja para una iteración posterior según urgencia de Gammacargo.
- Permisos granulares por campo dentro de una misma tabla (ej. que un rol vea el nombre de una empresa pero no su dirección) — la granularidad de esta versión es por tabla/rol vía RLS (sección 5), no por columna.
- Integración con un directorio corporativo/SSO existente — ver nota abierta de la sección 4.

## 10. Relación con los Siguientes Documentos

El Documento 012 no expone sus conectores a ningún rol humano (Documento 009, sección 9) — no le aplica esta matriz de permisos. El Documento 013 — Infraestructura y Despliegue debe definir cómo se gestionan los secretos (tokens de integración, credenciales de base de datos) en cada ambiente. El Documento 014 — Plan de Pruebas debe incluir casos de prueba específicos de que un rol **no** puede acceder a lo que esta matriz le niega, no solo que puede acceder a lo permitido.

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) antes de continuar con el Documento 012, conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
