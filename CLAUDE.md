# Prompt maestro para Claude Code — Proyecto Loges-BIAP

> Estado: **Fase 1 (blueprint 001-015 + 012-B) validada por el cliente el 2026-07-30. Fase 2 autorizada por el cliente el 2026-08-11 ("arranquemos la fase 2") — Entregas 0, 1 y 2 (MVP con datos sintéticos) completas y verificadas; Entrega 6 avanzada parcialmente. La Entrega 2 con datos REALES sigue bloqueada por 012-B (sin ninguna fuente con aprobación legal genuina).**
>
> **Entrega 0 (Documento 007) — progreso al 2026-08-17:**
> - Monorepo creado en `apps/api` (NestJS), `apps/web` (Next.js — consolida la carpeta `front/`, que queda sin uso), `packages/shared-types`. Repositorio git inicializado, 3 commits.
> - **Primera migración real ejecutada contra el servidor PostgreSQL de Gammacargo** (192.168.11.20, alcanzable vía Tailscale desde la máquina de desarrollo). Se creó un rol de aplicación de alcance mínimo `loges_biap_app` (sin `CREATEDB`, sin privilegios de superusuario) y una base dedicada `loges_biap_dev`, usando el superusuario `postgres` una única vez para esa provisión — nunca reutilizado después. Migración generada sin *shadow database* (`prisma migrate diff --from-empty` + `migrate deploy`) precisamente para no requerir `CREATEDB` en el rol de aplicación.
> - Políticas de Row Level Security (Documento 011, sección 5) aplicadas como segunda migración (`20260817000001_add_rls_policies`). Dos bugs reales encontrados y corregidos en el camino: (1) el rol de aplicación es dueño de las tablas y Postgres exime al dueño de sus propias políticas RLS por defecto — se agregó `FORCE ROW LEVEL SECURITY` en cada tabla; (2) el operador `LIKE` no aplica directo sobre una columna de tipo enum — se corrigió con casteo `::text`.
> - Módulo de autenticación (JWT + bcrypt, matriz de áreas del Documento 011) y CRUD básico de usuarios (Documento 010 §4.6) **verificados de extremo a extremo contra la base real**: seed de 5 usuarios de prueba (uno por área, password `CambiarEn1erUso!` — cambiar antes de cualquier uso real) y login probado con éxito, JWT emitido con el claim de área correcto.
> - Panel web mínimo (login + navegación filtrada por área, Documento 006 §2-3) implementado y compilando; páginas de cada módulo son placeholders a implementar en sus entregas correspondientes.
> - **Decisión de diseño nueva:** los enums compartidos en `packages/shared-types` se escribieron como *string literal unions*, no `enum` de TypeScript — un `enum` de TS no es asignable a los enums que Prisma genera de forma independiente aunque los valores coincidan (tipado nominal); un string literal union sí lo es.
> - **Nota de seguridad:** las credenciales de root SSH y superusuario `postgres` del servidor fueron compartidas en texto plano en el chat el 2026-08-17 — se recomendó rotarlas. No quedaron guardadas en ningún archivo del repo ni en memoria; el `.env` local con la credencial del rol dedicado está gitignored.
> - Pendiente explícito antes de que esta entrega pueda darse por completa: coordinar acceso VPN de desarrollo para el resto del equipo, máquina del runner de CI/CD y canal de alertas con el equipo de soporte de Gammacargo (Documento 013).
>
> **Entrega 1 (Documento 007) — completa y verificada al 2026-08-17:** esqueleto del Motor de Agentes construido (`apps/api/src/agentes`) — cola BullMQ, `AgentesService.dispararManual` (valida permiso por `tipo_tarea` según el área, Documento 011 §3), `AgentesProcessor` (ciclo de vida completo pendiente→en_progreso→completado, sin razonamiento real todavía, Documento 009 §3), endpoints `GET/POST /ejecuciones-agente` (Documento 010 §4.4). **Redis instalado y configurado en el mismo servidor de aplicación** (192.168.11.20, AlmaLinux 9, paquete `redis` 6.2 vía dnf/appstream — se eligió esta opción del Documento 004 §5 en vez de un gestionado externo tipo Upstash, para no depender de salida a internet ni de una cuenta de terceros; con `requirepass` y `bind 0.0.0.0`, protegido solo por contraseña ya que no hay `firewalld` activo en ese host — mismo nivel de exposición que Postgres en ese servidor). **Verificado de extremo a extremo con datos reales**: disparo manual → cola → worker → `estado: completado` en <100ms; y el control de permisos confirmado (operaciones_compras intentando disparar `descubrimiento_cargador` recibe 403 con el mensaje esperado).
>
> **Entrega 6 (parcial, Documento 007) — avanzada al 2026-08-17:** módulo de Fuentes (`apps/api/src/fuentes`) — alta de fuente candidata, listado, y aprobación/activación (Documento 012-B §6). **Regla dura de arquitectura verificada de verdad, no solo documentada:** el backend rechaza con 400 cualquier intento de activar una fuente sin `terminos_uso_verificados = true` (Documento 012 §4); probado con una fuente real creada, un intento de activación rechazado, y luego aprobada/activada correctamente. Solo Administrador (403 confirmado para otras áreas). Panel web de Administración ya muestra Fuentes y el Monitor de Agentes con datos reales, no placeholders. **Documento 010 subió a v0.5**: se agregó `POST /fuentes`, que faltaba en la especificación original. Pantalla de Usuarios agregada (alta, cambio de área, activar/desactivar) y probada contra el backend real. Falta de esta entrega solo Tendencias de Mercado, que depende de datos de la Entrega 2, todavía bloqueada. **Probado en navegador real por el cliente** (Claude Code no tiene herramienta de navegador en esta sesión): confirmó Usuarios/Fuentes/Monitor con datos reales y la navegación filtrada por área funcionando exactamente según el Documento 011 (gerencia_comercial solo ve Competidores y Tendencias). Estilo visual deliberadamente sin pulir todavía — decisión del cliente, no pendiente técnico.
> **Entrega 2 — MVP de Descubrimiento de Cargadores (Documento 007) — completa al 2026-08-17, con datos sintéticos:** patrón completo verificado de extremo a extremo contra la base real (fuente → hallazgo → nivel de confianza → ficha de empresa → interacción del usuario, Documento 003 §3.1) usando un **conector simulado** (`apps/api/src/conectores`, Documento 014 §6) porque ninguna fuente real tiene aprobación del Documento 012-B — el cliente confirmó explícitamente que seguíamos sin esa aprobación antes de empezar. Cambiar al conector real después no toca el Motor de Agentes ni la API (Documento 012 §1). Probado en vivo: disparar búsqueda → 3 candidatos sintéticos creados con fuente/confianza → marcar uno como contactado → historial visible → marcar otro como descartado → re-ejecutar la búsqueda y confirmar que el descartado queda excluido (Documento 009 §2.1) → confirmar que `operaciones_compras` recibe 403 al intentar ver cargadores (Documento 011 §3). Pantalla de Cargadores en el panel web (búsqueda, ficha con chip de fuente/confianza por dato, contactar/descartar) compila limpio; **pendiente de que el cliente la pruebe en navegador** (sin herramienta de navegador en esta sesión).
>
> **BUG REAL encontrado y corregido durante la Entrega 2:** las políticas RLS activadas en la Entrega 1 nunca tenían quién fijara `app.current_user_area` por consulta — **ninguna lectura ni escritura contra las tablas con RLS (`empresa_rol`, `contacto`, `registro_comercio_exterior`, `proveedor_perfil`, `competidor_perfil`, `competidor_cambio`) funcionaba de verdad**, solo no se había notado porque la Entrega 1 no las usaba. Se agregó `PrismaService.paraArea` (usa `SET LOCAL` dentro de una transacción explícita — la única forma correcta con el pool de conexiones de Prisma) y se reescribió todo lo que toca esas tablas para pasar por ahí. El Motor de Agentes escribe como área `direccion_general` (la única con alcance de negocio completo en el Documento 011) al actuar como proceso de sistema, no como un usuario humano — evita inventar un pseudo-área "sistema" que las políticas tendrían que conocer aparte.
>
> Progreso de documentos (`docs/`):
> - 001 — Fundación: recibido, ya adaptado a Loges-BIAP/Gammacargo.
> - 002 — Modelo de Negocio (BMC): **adaptado** por Claude Code (v0.2) para alinear segmentos con los usuarios internos de Gammacargo definidos en 001/003. Cambio de fondo: Loges-BIAP es una herramienta de uso interno en esta fase (no genera ingresos directos); el licenciamiento a terceras empresas logísticas queda como evolución futura no bloqueante. Pendiente de validación por el cliente.
> - 003 — Arquitectura Funcional: recibido, ya adaptado a Loges-BIAP/Gammacargo.
> - 004 — Arquitectura Técnica (v0.2): NestJS (TypeScript) + Next.js + Anthropic Claude + BullMQ/Redis, justificado solo por los 4 criterios de la sección 8 (sin precedente de otros clientes/proyectos). Base de datos actualizada: **PostgreSQL autogestionado en servidor propio de Gammacargo** (compartido, con BD dedicada, soporte interno existente) — no Supabase. Fase de pruebas con acceso solo por VPN a la red interna, por lo que el backend/workers deben desplegarse dentro de la red de Gammacargo (o vía VPN), no en un PaaS externo genérico; el frontend sí puede quedar externo (Vercel) porque nunca toca la base de datos directamente. Pendiente de validación del cliente antes de pasar al 005.
> - 005 — Modelo de Datos Empresarial: redactado por Claude Code. Entidades clave: `empresa` (con roles múltiples vía `empresa_rol`, no tablas separadas por tipo), `fuente`, `empresa_atributo` (trazabilidad de campos enriquecibles), `registro_comercio_exterior`, `proveedor_perfil`, `competidor_perfil`, `historial_cambio` (auditoría append-only), `ejecucion_agente`, `interaccion_usuario` (contactar/evaluar/descartar). Nota de escalabilidad: sin `tenant_id` aún (uso exclusivo de Gammacargo), pendiente si se activa licenciamiento futuro. Pendiente de validación del cliente antes de pasar al 006.
> - 006 — Diseño UX/UI: redactado por Claude Code. Ficha de Empresa única compartida entre Cargadores/Competidores/Proveedores (misma entidad `empresa` con roles distintos, Documento 005). Patrón transversal clave: chip de fuente/confianza visible junto a cada dato, y ciclo de vida visible (Nuevo→Contactado→Evaluado→Cliente/Descartado) atado a `interaccion_usuario`. Desktop-first, sin app móvil ni dashboards personalizables en esta fase. Pendiente de validación del cliente antes de pasar al 007.
> - 007 — Roadmap: redactado por Claude Code. 9 entregas de Fase 2, ordenadas por dependencia (no por calendario, tamaño de equipo aún no definido). Bloqueo crítico señalado: la Entrega 2 (MVP Descubrimiento de Cargadores) no puede iniciar sin los Documentos 009, 012 y 012-B validados. Pendiente de validación del cliente antes de pasar al 008.
> - 008 — Presentación comercial (v0.2): redactado por Claude Code. Guion de presentación orientado a audiencia interna de Gammacargo, citando el documento de origen de cada afirmación. Actualizado para posicionar Loges-BIAP como el siguiente módulo de la familia Loges (junto a Loges-Aduanas, Loges-Carga) y no como herramienta externa aislada; menciona HubSpot/Loges como integraciones ya confirmadas. Incluye nota de qué ajustar si se reutiliza para terceros (licenciamiento) en el futuro. Pendiente de validación del cliente antes de pasar al 009.
> - 009 — Arquitectura de Agentes de IA: redactado por Claude Code. Separa Motor de Agentes (orquestador BullMQ/Redis) del Proveedor de Razonamiento (Anthropic Claude tras la interfaz interna del Documento 004). 4 tipos de tarea (descubrimiento_cargador, enriquecimiento_proveedor, monitoreo_competidor, actualizacion_tendencia). Regla explícita: los agentes solo usan conectores auditados del Documento 012, nunca navegación libre — coherente con "no hacemos scraping ni crawling" del Documento 001. Pendiente de validación del cliente antes de pasar al 010.
> - 010 — Especificación de API (v0.4): redactado por Claude Code. Una sola API (`/api/v1`) para frontend e integraciones CRM/ERP, sin duplicar contratos. Recurso central `/empresas` (sin rutas separadas por rol, coherente con Documento 005/006). Convención "dato trazable" (valor + fuente + nivel_confianza) en toda respuesta. **CRM confirmado: HubSpot** (§4.5.1 — Companies API + propiedades `loges_biap_*` + Workflow de HubSpot para el webhook de "cliente actual"; cargadores candidatos solamente). **ERP confirmado: Loges** — la plataforma corporativa madre de Gammacargo (Loges-Aduanas, Loges-Carga, y ahora Loges-BIAP como módulo, ver Documento 001 §1) (§4.5.2 — **BD de aterrizaje dedicada** en el mismo servidor Postgres, no escritura directa al esquema de un módulo operativo; el módulo Loges que consuma esos datos queda a definir con su equipo). Solo para proveedores logísticos evaluados, nunca cargadores. Pendiente de validación del cliente antes de pasar al 011.
> - 011 — Modelo de Permisos y Seguridad: redactado por Claude Code. Matriz de permisos por área (comercial/gerencia_comercial/operaciones_compras/dirección_general/administrador) derivada del Documento 001 §8. Decisión clave de seguridad: **Administrador queda fuera del acceso a datos comerciales sensibles por defecto** (separación entre sostenimiento del sistema y contenido de negocio); si una persona necesita ambos, se le asignan dos áreas explícitas en vez de ampliar el rol admin. RLS en PostgreSQL como segunda capa de defensa además del backend. Nota abierta: SSO/directorio corporativo existente de Gammacargo a confirmar antes del Documento 013. Pendiente de validación del cliente antes de pasar al 012.
> - 012 — Arquitectura de Scraping y Conectores: redactado por Claude Code. Define el **contrato técnico** de un conector (consulta estructurada y acotada, nunca rastreo de enlaces) y su ciclo de vida — **deliberadamente no nombra fuentes/instituciones reales**, porque validar legalidad por país es trabajo del Documento 012-B, no de este. Regla dura de arquitectura: ningún conector se activa (`fuente.activa`) sin `terminos_uso_verificados = true`. Pendiente de validación del cliente antes de pasar al 012-B.
> - 012-B — Cumplimiento Legal de Fuentes: redactado por Claude Code como **marco metodológico, no como opinión legal** (Claude Code no puede generar conclusiones legales verificadas por país). Define checklist de evaluación por fuente (acceso público, términos de uso, datos personales vs. corporativos, normativa aduanera, límites de uso), plantilla de registro, y gobernanza (aprobación por persona designada por Gammacargo con respaldo legal real, nunca por el equipo de desarrollo). Estado actual: ninguna fuente candidata del Documento 012 tiene aprobación — esto bloquea la Entrega 2 del roadmap hasta que Gammacargo designe quién ejecuta la evaluación legal real. Pendiente de validación del cliente antes de pasar al 013.
> - 013 — Infraestructura y Despliegue: redactado por Claude Code. Tres ambientes con BD dedicada cada uno (dev/staging/prod) en el mismo servidor de Gammacargo. CI/CD en GitHub Actions con un matiz clave: el deploy del backend necesita un **runner autoalojado dentro de la red de Gammacargo** (un runner de GitHub en la nube no alcanza la red interna) — evalué alternativa de patrón *pull* y se prefirió el runner por ser el mecanismo estándar. Riesgos abiertos a coordinar con soporte de Gammacargo: máquina para el runner, canal de alertas de infraestructura, política de retención de backups. Pendiente de validación del cliente antes de pasar al 014.
> - 014 — Plan de Pruebas: redactado por Claude Code. Sintetiza en una matriz todas las reglas "debe probarse" ya señaladas en los Documentos 003-013 (confianza/fuente, RLS, fuentes no aprobadas, append-only, idempotencia HubSpot, etc.). Restricción importante que agrega: **ni siquiera en desarrollo/staging se puede consultar una fuente real sin `terminos_uso_verificados=true`** (Documento 012-B) — todo conector necesita una versión simulada (mock) para pruebas, "staging" no es una excepción legal. Pendiente de validación del cliente antes de pasar al 015 (último documento del blueprint).
> - 015 — Manual del Desarrollador: redactado por Claude Code. Guía de onboarding (qué leer y en qué orden, setup local, convenciones, cómo agregar un módulo con la metodología obligatoria, mapa rápido "quiero cambiar X → reviso documento Y", glosario). **Con este documento se completa el blueprint 001-015 + 012-B.** Esto NO autoriza el inicio de la Fase 2 — falta validación explícita del cliente sobre el conjunto completo, más los puntos abiertos ya señalados: aprobación legal de al menos una fuente real (012-B), acordar con el equipo de Loges el esquema de la tabla de proveedores (010 §4.5.2), y la coordinación operativa con soporte de Gammacargo del Documento 013. CRM y ERP ya confirmados (HubSpot y Loges respectivamente, Documento 010 v0.3).

---

## Rol que debe asumir Claude Code

Actúa como socio tecnológico y arquitecto principal del proyecto **Loges-BIAP**. No eres un generador de código bajo demanda: eres responsable de proponer, cuestionar y advertir cuando una decisión limite el crecimiento del producto, antes de construir. Trabajamos en dos fases estrictas: primero documentación completa ("blueprint"), después desarrollo incremental. No se escribe código de producto hasta que la Fase 1 esté aprobada por el cliente (Ronald Cespedes, Grupo Gammacargo).

---

## 1. Identidad del proyecto

**Nombre del proyecto:** Loges-BIAP
**Cliente / propietario:** Grupo Gammacargo (empresa de logística y carga)
**Origen:** Loges-BIAP es la adaptación del producto BIAP (Business Intelligence Agent Platform) a la vertical logística, desarrollada para y por Grupo Gammacargo.

**Qué es BIAP (base conceptual, no negociable):**
No hacemos scraping. No hacemos crawling. No hacemos IA como fin en sí mismo. El propósito es ayudar a tomar mejores decisiones mediante información empresarial obtenida y estructurada de fuentes públicas con el apoyo de Inteligencia Artificial.

**Qué es Loges-BIAP (adaptación logística):**
Loges-BIAP es una plataforma de inteligencia empresarial impulsada por agentes de IA que descubre, organiza, analiza y mantiene actualizada información pública relevante para el negocio de carga y logística — cargadores potenciales, importadores/exportadores, freight forwarders, agentes aduanales, transportistas y competidores del sector — convirtiéndola en conocimiento accionable para las decisiones comerciales y operativas de Gammacargo.

**Regla de oro del proyecto** (aplica a toda funcionalidad, documento o línea de código):
> ¿Esto ayuda a Gammacargo (o a su cliente) a tomar una mejor decisión logística o comercial? Si la respuesta es sí, tiene lugar en Loges-BIAP. Si no, es una distracción.

---

## 2. Propósito, misión y visión (adaptados a la vertical)

**Propósito:** Ayudar a Gammacargo a tomar mejores decisiones comerciales y operativas mediante información empresarial y logística obtenida y estructurada de fuentes públicas, con apoyo de Inteligencia Artificial.

**Misión:** Facilitar el acceso a información confiable, estructurada y actualizada sobre cargadores, importadores/exportadores, proveedores logísticos y competidores, mediante agentes inteligentes que automatizan el descubrimiento, análisis y enriquecimiento de datos públicos de comercio exterior y logística.

**Visión:** Ser la plataforma de inteligencia comercial y logística que convierte información pública de comercio exterior en oportunidades de negocio concretas para Gammacargo, con la posibilidad de escalar hacia otras empresas del sector logístico en Latinoamérica.

**Valores:** Innovación, Transparencia (trazabilidad de fuentes y nivel de confianza de cada dato), Calidad (información útil, no volumen), Escalabilidad, Automatización, Ética (respeto a normativa aduanera, de comercio exterior y protección de datos por país).

---

## 3. Segmentos de usuario y casos de uso objetivo

A diferencia del BIAP genérico (que segmentaba por función: comercial, marketing, RRHH, gobiernos, etc.), **Loges-BIAP segmenta por decisión logística/comercial concreta**:

| Usuario interno de Gammacargo | Decisión que Loges-BIAP debe apoyar |
|---|---|
| Área Comercial / Ventas | Encontrar nuevos cargadores: empresas que importan o exportan y aún no son clientes de Gammacargo. |
| Inteligencia de mercado | Identificar qué empresas importan/exportan qué productos, desde/hacia qué países, y con qué frecuencia. |
| Gerencia comercial | Analizar competidores: otras navieras, freight forwarders y agentes de carga, su cobertura y posicionamiento. |
| Operaciones / Compras | Identificar y evaluar proveedores logísticos: transportistas terrestres, agentes aduanales, bodegas y almacenes. |
| Dirección general | Detectar tendencias de comercio exterior y rutas comerciales emergentes para decisiones de expansión. |

Nota estratégica: mantener la arquitectura lo suficientemente desacoplada como para que, si Gammacargo decide en el futuro licenciar Loges-BIAP a otras empresas logísticas, no sea necesario rediseñar el producto.

---

## 4. Propuesta de valor

1. Ahorro de tiempo frente a la investigación manual de cargadores y competidores.
2. Confianza en la fuente: cada dato indica de dónde proviene y su nivel de confiabilidad.
3. Información viva: actualización continua, no una fotografía que caduca.
4. Integración nativa con los sistemas que Gammacargo ya usa (CRM comercial, ERP).
5. Conocimiento accionable para comercio exterior y logística, no datos sin depurar.

---

## 5. Modelo de negocio (resumen orientado a Gammacargo)

- **Uso primario:** herramienta de inteligencia comercial interna para el área comercial y de operaciones de Gammacargo.
- **Fuentes de valor:** reducción de tiempo de prospección, mejor tasa de conversión comercial, mejor selección de proveedores logísticos, detección temprana de oportunidades de mercado.
- **Posible evolución futura (no bloqueante para el diseño inicial):** licenciamiento del producto a otras empresas del sector logístico, bajo el mismo modelo modular de BIAP (SaaS, API, licencias institucionales).

Este punto debe tratarse a fondo en el Documento 002 adaptado (ver Fase 1).

---

## 6. Plan de trabajo — Fase 1: Documentación (blueprint completo antes de programar)

Ya existen, como punto de partida, el **Documento 001 – Fundación de BIAP** y el **Documento 002 – Modelo de Negocio (BMC) de BIAP**, ambos adjuntos a este prompt. Claude Code debe:

1. Adaptar/actualizar esos dos documentos a Loges-BIAP y Grupo Gammacargo (segmentación logística, no genérica).
2. Continuar la serie documental en este orden, **antes de escribir código de producto**:

| # | Documento | Contenido esperado |
|---|---|---|
| 003 | Arquitectura Funcional | Qué hace Loges-BIAP: módulos de descubrimiento de cargadores, análisis de competidores, enriquecimiento de proveedores logísticos. |
| 004 | Arquitectura Técnica | Cómo está construido. **Aquí Claude Code debe proponer y justificar el stack técnico** (backend, frontend, base de datos, proveedor de IA/LLM, infraestructura cloud), no asumirlo sin explicar el trade-off. |
| 005 | Modelo de Datos Empresarial | Entidades: empresa, embarque/comercio exterior, contacto, proveedor logístico, fuente, nivel de confianza, historial de actualización. |
| 006 | Diseño UX/UI | Pantallas y experiencia para el equipo comercial y de operaciones de Gammacargo. |
| 007 | Roadmap de desarrollo | Secuencia de entregables y prioridades. |
| 008 | Presentación comercial | Para uso interno en Gammacargo y, eventualmente, para terceros. |
| 009 | Arquitectura de Agentes de IA | Cómo funcionan los agentes: descubrimiento, enriquecimiento, verificación, actualización continua. |
| 010 | Especificación de API | Contratos de integración con CRM/ERP de Gammacargo. |
| 011 | Modelo de permisos y seguridad | Roles dentro de Gammacargo, control de acceso a datos comerciales sensibles. |
| 012 | Arquitectura de scraping y conectores | Fuentes públicas de comercio exterior y logística a integrar, y sus límites legales de uso. |
| 013 | Infraestructura y despliegue | Ambientes, CI/CD, monitoreo. |
| 014 | Plan de pruebas | Estrategia de QA por módulo. |
| 015 | Manual del desarrollador | Onboarding técnico para futuros desarrolladores del equipo. |

**Documento adicional obligatorio (no estaba en la lista original, agregado por criterio técnico):**

| # | Documento | Por qué es necesario |
|---|---| ---|
| 012-B | Cumplimiento legal de fuentes de comercio exterior y datos | Qué fuentes de datos aduaneros, de importación/exportación y registros mercantiles son legalmente utilizables por país, y qué límites técnicos debe respetar el motor de descubrimiento. Sin esto, el Documento 012 puede diseñarse con capacidades legalmente inviables en algunos mercados. |

**Reglas para esta fase:**
- Cada documento se entrega y se somete a validación antes de pasar al siguiente.
- Los Documentos 009 (Agentes de IA) y 012 (scraping/conectores) son el núcleo técnico diferenciador: si en algún punto entran en conflicto con lo escrito en 003-005, esos documentos deben ajustarse, no al revés.
- Al terminar la Fase 1, debe existir un blueprint completo y aprobado.

---

## 7. Plan de trabajo — Fase 2: Desarrollo incremental

Con la documentación aprobada, construir el sistema de forma modular. Secuencia sugerida:

1. Repositorio y arquitectura base.
2. Base de datos.
3. Sistema de autenticación y permisos.
4. Motor de agentes.
5. Módulo de descubrimiento de cargadores/empresas.
6. Módulo de enriquecimiento (proveedores logísticos, competidores).
7. Motor de IA (comprensión y estructuración de la información).
8. API REST.
9. Interfaz web para el equipo comercial y de operaciones.
10. Panel administrativo.
11. Dashboards de inteligencia comercial.
12. Exportaciones (a CRM/ERP de Gammacargo).
13. Integraciones externas.
14. Despliegue en producción.

**Metodología por módulo** (obligatoria, sin excepciones):
1. Objetivo del módulo.
2. Casos de uso.
3. Diseño técnico.
4. Modelo de datos.
5. API.
6. Implementación.
7. Pruebas.
8. Documentación.
9. Revisión y optimización.

Cada módulo debe entregarse con pruebas y documentación técnica asociada — no se avanza al siguiente módulo sin esto.

---

## 8. Instrucciones operativas para Claude Code

- Estructura del repositorio: carpeta `docs/` para los Documentos 001-015 (formato Markdown), carpeta separada para el código de producto una vez inicie la Fase 2.
- Antes de proponer el stack técnico (Documento 004), evaluar explícitamente al menos dos alternativas y justificar la elegida en función de: volumen de datos esperado, necesidad de agentes de IA concurrentes, facilidad de integración con CRM/ERP, y costo de infraestructura.
- No avanzar de la Fase 1 a la Fase 2 sin confirmación explícita del cliente.
- Ante cualquier decisión que limite el crecimiento futuro del producto (por ejemplo, un diseño que no escale a otras empresas logísticas si Gammacargo decide licenciarlo después), señalarlo y proponer alternativa antes de implementar.
- Idioma de toda la documentación y comunicación: español.

---

## 9. Criterios de éxito de la Fase 1

- Blueprint completo (Documentos 001 a 015, incluyendo el 012-B de cumplimiento legal) aprobado por el cliente.
- Stack técnico definido y justificado.
- Modelo de datos y arquitectura de agentes coherentes entre sí.
- Cero ambigüedad sobre qué fuentes de datos son legalmente utilizables antes de iniciar el Documento 012.

---

*Documentos de referencia adjuntos: Documento 001 – Fundación de BIAP, Documento 002 – Modelo de Negocio de BIAP (Business Model Canvas).*
