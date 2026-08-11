# Documento 013 — Infraestructura y Despliegue

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.1
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento aterriza en ambientes, CI/CD y monitoreo concretos las decisiones ya tomadas en el Documento 004 (stack e infraestructura) y las restricciones de red confirmadas por el cliente: base de datos PostgreSQL en servidor propio de Gammacargo, accesible solo por VPN durante pruebas, con soporte interno existente.

## 1. Ambientes

| Ambiente | Base de datos | Backend/workers | Frontend | Acceso |
|---|---|---|---|---|
| **Desarrollo local** | Base dedicada de pruebas en el servidor de Gammacargo (esquema/BD separado de producción) | Corre en la máquina del desarrollador | Corre en la máquina del desarrollador | Requiere VPN activa hacia la red de Gammacargo (Documento 007, riesgo señalado — coordinar acceso con soporte antes de la Entrega 0). |
| **Pruebas / Staging** | Segunda base de datos dedicada en el mismo servidor (`loges_biap_staging`, distinta de `loges_biap_prod`) | Contenedor dentro de la red de Gammacargo o con VPN hacia ella | Deploy de previsualización (Vercel u equivalente) | Acceso VPN, igual que producción en esta fase. |
| **Producción** | Base de datos dedicada de producción (`loges_biap_prod`) en el servidor de Gammacargo | Contenedor dentro de la red de Gammacargo o con VPN hacia ella (Documento 004, sección 3) | Vercel (u otro hosting externo) | Según lo decidido en el Documento 004: empieza en VPN interna; puede exponerse hacia afuera más adelante sin cambio de código. |

Tres bases de datos separadas (no solo tres esquemas) para que una migración fallida en pruebas no pueda tocar datos de producción por error de configuración — a coordinar su creación con el equipo de soporte de Gammacargo (Documento 004, sección 3, reglas de convivencia).

## 2. Topología de Red

```
                         Internet
                             │
                    ┌────────┴────────┐
                    │  Frontend (Next.js) │  ← Vercel, público
                    └────────┬────────┘
                             │ HTTPS (solo a la API)
                             │
                    ┌────────┴────────┐
        VPN/red     │  Backend NestJS  │  ← dentro de la red de
        interna ────┤  + workers        │     Gammacargo (o VPN)
        Gammacargo  └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ PostgreSQL       │  ← servidor compartido de
                    │ (BD dedicada)    │     Gammacargo, solo red interna
                    └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │ Redis (colas)    │  ← gestionado externo o
                    └─────────────────┘     interno, según política de
                                             salida a internet (Doc. 004 §5)
```

El frontend nunca cruza hacia la red interna de Gammacargo — solo el backend lo hace, y solo el backend habla con la base de datos. Esto ya estaba definido en el Documento 004 y aquí se fija como regla de red explícita, no solo de diseño de aplicación.

## 3. CI/CD

Pipeline en GitHub Actions, con una distinción importante: **el paso de despliegue del backend necesita alcanzar la red interna de Gammacargo**, algo que un runner alojado por GitHub (en la nube pública de GitHub) no puede hacer directamente.

| Job | Dónde corre | Descripción |
|---|---|---|
| Lint + pruebas unitarias | Runner de GitHub (estándar) | No requiere red interna — corre contra una base de datos de pruebas efímera. |
| Build (frontend y backend) | Runner de GitHub (estándar) | Genera la imagen Docker del backend y el build de Next.js. |
| Deploy frontend | Runner de GitHub (estándar) | Publica a Vercel — no requiere red interna. |
| Deploy backend | **Runner autoalojado (self-hosted), instalado en una máquina dentro de la red de Gammacargo o con VPN activa** | Descarga la imagen ya construida y la despliega contra el backend interno. |

**Alternativa considerada para el deploy del backend:** en vez de un runner autoalojado, publicar la imagen a un registro de contenedores y que un proceso dentro de la red de Gammacargo la recoja de forma periódica (patrón *pull*, similar al webhook/pull de HubSpot del Documento 010). Se prefiere el runner autoalojado por ser el mecanismo estándar y documentado de GitHub Actions para este escenario, con menos piezas nuevas que mantener — pero la decisión final requiere coordinarse con el equipo de soporte de Gammacargo sobre qué máquina aloja ese runner.

## 4. Gestión de Secretos

| Secreto | Dónde vive en CI | Dónde vive en runtime |
|---|---|---|
| Credenciales de conexión a PostgreSQL | GitHub Actions Secrets (solo para pruebas efímeras) | Variable de entorno en la máquina/contenedor del backend, provista por el equipo de soporte de Gammacargo. |
| Token de aplicación privada de HubSpot (Documento 010, 4.5.1) | No aplica en CI | Variable de entorno del backend, nunca en el frontend ni en logs. |
| API key de Anthropic (Documento 004) | GitHub Actions Secrets (si se ejecutan pruebas que la usan) | Variable de entorno del backend. |
| Secreto de firma de JWT (Documento 011) | No aplica en CI | Variable de entorno del backend, rotable sin downtime si se implementa con doble clave (actual + anterior) durante la transición. |

Ningún secreto se versiona en el repositorio (`.env` en `.gitignore` desde la Entrega 0, Documento 007) ni se expone en logs de la aplicación.

## 5. Monitoreo y Alertas

Se distinguen dos niveles, coherente con las dos auditorías del Documento 011:

- **Monitoreo de negocio** (ya es parte del producto, no infraestructura aparte): el Monitor del Motor de Agentes y el registro de sincronizaciones fallidas del panel de Administración (Documento 006, sección 7) ya muestran fallos relevantes a un humano dentro de la aplicación.
- **Monitoreo de infraestructura** (nuevo en este documento): salud del backend (endpoint `/health`), conectividad a PostgreSQL, conectividad a Redis, y — de forma específica para este proyecto — **estado del túnel/VPN hacia la red de Gammacargo**, dado que es el punto de falla más particular de esta arquitectura (Documento 004, riesgo de sección 3).

**Alertas:** un fallo sostenido de conectividad (backend sin poder alcanzar la base de datos por más de N minutos) debe notificar a un canal que el equipo de soporte de Gammacargo monitoree — el canal específico (correo, Slack, u otro) queda pendiente de confirmar con ese equipo, ya que son ellos quienes actuarían primero ante una caída de VPN o del servidor compartido.

## 6. Backups y Continuidad

- **Base de datos:** los backups del servidor PostgreSQL ya son responsabilidad del equipo de soporte de Gammacargo (confirmado, Documento 004, sección 3). Pendiente de coordinar específicamente: frecuencia de backup de la base dedicada de Loges-BIAP y tiempo de retención, para que el Documento 014 pueda diseñar una prueba de restauración realista.
- **Código y configuración:** el repositorio Git es la fuente de verdad; no requiere backup adicional más allá de lo que GitHub ya provee.
- **Cola de trabajos (Redis):** es estado transitorio (tareas en curso), no la fuente de verdad — la fuente de verdad de qué se ejecutó es `ejecucion_agente` en PostgreSQL (Documento 005). Perder el contenido de Redis ante una falla implica reencolar tareas pendientes, no pérdida de datos de negocio.

## 7. Estrategia de Despliegue y Rollback

- Cada imagen del backend se etiqueta con el hash del commit — un rollback es desplegar la etiqueta anterior, no una operación especial.
- Las migraciones de base de datos (Documento 005) se aplican de forma explícita como paso propio del pipeline, separado del despliegue del código, para poder revisar antes de aplicar un cambio de esquema en producción.
- Dado el tamaño de equipo esperado, se prefiere un despliegue simple (reemplazo directo del contenedor) sobre un esquema blue-green — la complejidad de mantener dos versiones activas no se justifica todavía; puede revisarse si la disponibilidad requerida aumenta en el futuro.

## 8. Riesgos y Puntos Abiertos

- **El runner autoalojado (sección 3) requiere una máquina física o virtual dentro de la red de Gammacargo**, administrada con el mismo cuidado que cualquier otro sistema — a coordinar con el equipo de soporte antes de la Entrega 0 del Documento 007.
- **El canal de alertas de infraestructura (sección 5) no está definido** — depende de cómo el equipo de soporte de Gammacargo prefiere ser notificado.
- **La política de backup/retención específica para la base de datos de Loges-BIAP no está confirmada** — a definir junto con el equipo de soporte antes de que el Documento 014 diseñe pruebas de recuperación.

## 9. Relación con los Siguientes Documentos

El Documento 014 — Plan de Pruebas debe incluir pruebas específicas de caída de VPN/conectividad (sección 2) y de restauración de backup (sección 6). El Documento 015 — Manual del Desarrollador debe explicar paso a paso cómo un desarrollador nuevo configura su acceso VPN y su ambiente local (sección 1).

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) — en particular, requiere coordinar con el equipo de soporte de Gammacargo los puntos abiertos de la sección 8 — antes de continuar con el Documento 014, conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
