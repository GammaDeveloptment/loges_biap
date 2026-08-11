# Documento 008 — Presentación Comercial

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.2 (posiciona Loges-BIAP como módulo de la familia Loges, no como herramienta aislada; menciona HubSpot/Loges como integraciones confirmadas)
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento es el **guion de una presentación**, no la pieza de diseño final (slides, branding). Su público principal es interno: sirve para presentar Loges-BIAP a la Dirección General de Gammacargo y a cualquier área que deba aprobar el paso de la Fase 1 (documentación) a la Fase 2 (desarrollo). Cada bloque corresponde a una diapositiva o sección de una reunión, y cita el documento de origen de cada afirmación para que nada aquí sea una promesa que los Documentos 001-007 no respalden.

`CLAUDE.md` prevé que este documento eventualmente sirva también "para terceros" — es decir, como base de una presentación de venta si Gammacargo licencia Loges-BIAP a otras empresas logísticas. La sección 11 señala qué cambiaría en ese escenario; en esta versión, el contenido está pensado exclusivamente para audiencia interna de Gammacargo.

## 1. Diapositiva — Portada

**Loges-BIAP**
*Convierte el comercio exterior en inteligencia comercial.*
Una iniciativa de Grupo Gammacargo. (Documento 001)

## 2. Diapositiva — El Problema

- Encontrar nuevos cargadores (empresas que importan/exportan) hoy depende de investigación manual, dispersa y que se desactualiza rápido.
- No hay visibilidad sistemática de qué hacen los competidores (navieras, freight forwarders, agentes de carga) ni de sus movimientos recientes.
- Evaluar proveedores logísticos (transportistas, agentes aduanales, bodegas) toma tiempo de Operaciones/Compras sin un directorio confiable centralizado.
- La información, cuando existe, no dice de dónde viene ni qué tan confiable es — decisiones comerciales se toman sobre datos sin trazabilidad.

*(Base: Documento 001, secciones 3 y 4 — Propuesta de Valor.)*

## 3. Diapositiva — Qué es Loges-BIAP

> Loges-BIAP es una plataforma de inteligencia comercial y logística impulsada por agentes de Inteligencia Artificial que descubre, organiza, analiza y mantiene actualizada información pública relevante para el negocio de carga y comercio exterior, convirtiéndola en conocimiento útil para las decisiones de Gammacargo.

No hacemos scraping. No hacemos crawling. No hacemos IA como fin en sí mismo — ayudamos a decidir mejor. *(Documento 001, secciones 0 y 3.)*

**No es una herramienta nueva y aislada: es el siguiente módulo de Loges.** Gammacargo ya tiene un ecosistema Loges en operación — Loges-Aduanas, Loges-Carga — y Loges-BIAP se suma a esa misma familia, con el mismo patrón de nombre, como el módulo de inteligencia comercial. Esto es relevante para la audiencia interna: no se está pidiendo adoptar una plataforma externa desconocida, sino extender algo que Gammacargo ya reconoce como propio. *(Documento 001, sección 1.)*

## 4. Diapositiva — Cómo Funciona (flujo simplificado)

```
Fuentes públicas de comercio exterior
        ↓  (agentes de IA descubren y verifican)
Datos con fuente y nivel de confianza asignados
        ↓
Ficha de empresa (cargador, competidor o proveedor)
        ↓
Panel de inteligencia comercial  →  CRM / ERP de Gammacargo
        ↓
Decisión del equipo: contactar, evaluar o descartar
```

*(Base: Documento 003, sección 4 — Flujo Funcional de Extremo a Extremo.)*

## 5. Diapositiva — Lo que Cada Área Gana

| Área | Qué gana con Loges-BIAP |
|---|---|
| Comercial / Ventas | Cargadores candidatos nuevos, priorizados, sin buscarlos manualmente. |
| Gerencia Comercial | Visibilidad continua de competidores: rutas, alianzas, expansión. |
| Operaciones / Compras | Directorio de proveedores logísticos evaluables, con evidencia. |
| Dirección General | Tendencias de comercio exterior para decisiones de expansión. |

*(Base: Documento 001, sección 8; Documento 003, sección 1.)*

## 6. Diapositiva — Qué lo Hace Diferente

- **Transparencia real:** cada dato muestra su fuente y su nivel de confianza, siempre visible — no una lista sin respaldo. (Documento 006, sección 5.)
- **Información viva:** actualización continua, no una foto que caduca. (Documento 001, valor de Innovación/Escalabilidad.)
- **Una sola ficha por empresa:** un cargador candidato, un competidor y un proveedor pueden ser, con el tiempo, la misma empresa vista desde distintos roles — sin datos duplicados. (Documento 005.)
- **Integración nativa:** conecta con HubSpot (CRM) y con Loges (ERP), que Gammacargo ya usa, sin trabajo manual de traspaso. (Documento 003, módulo 3.7; Documento 010, secciones 4.5.1-4.5.2.)

## 7. Diapositiva — Cómo Está Construido (resumen ejecutivo)

- Aplicación web moderna, con paneles distintos para cada área (Comercial, Gerencia, Operaciones, Dirección).
- Motor de agentes de Inteligencia Artificial (Anthropic Claude) que hace el trabajo repetitivo de búsqueda y verificación.
- Base de datos **PostgreSQL en un servidor propio de Gammacargo** — la información comercial sensible no sale hacia terceros. (Documento 004, versión 0.2.)
- Fase de pruebas dentro de la red interna de Gammacargo (VPN), con posibilidad de exponerse más adelante si así se decide.

*(Nivel de detalle técnico completo en el Documento 004; este bloque es la versión para una audiencia no técnica.)*

## 8. Diapositiva — Roadmap y Qué Falta para Empezar

- La documentación completa (Documentos 001-015) debe aprobarse antes de escribir una sola línea de código de producto — así se evita construir sobre una base no validada. (`CLAUDE.md`, disciplina de Fase 1.)
- Ya están definidos: fundación, modelo de negocio, arquitectura funcional, arquitectura técnica, modelo de datos, UX/UI y el roadmap de desarrollo (Documentos 001-007).
- Faltan, antes de poder iniciar el primer módulo real (descubrimiento de cargadores): la Arquitectura de Agentes de IA (009) y, de forma crítica, el Cumplimiento Legal de Fuentes por país (012-B) — sin esto no hay certeza de qué fuentes de comercio exterior se pueden usar legalmente. (Documento 007, sección 3, Entrega 2.)

## 9. Diapositiva — Evolución Futura (no bloqueante)

Si en el futuro Gammacargo decide licenciar Loges-BIAP a otras empresas del sector logístico en Latinoamérica, la arquitectura ya está pensada para no requerir un rediseño (Documento 001, nota estratégica; Documento 005, sección 7 sobre multi-tenancy diferido). Esto **no es un requisito de esta fase** — es una opción que queda abierta.

## 10. Diapositiva — Próximo Paso

Solicitar la validación formal del cliente (Ronald Cespedes, Grupo Gammacargo) sobre los Documentos 001-007 ya entregados, y continuar la serie documental (008 en adelante) hasta completar el blueprint antes de iniciar la Fase 2.

## 11. Nota: Adaptación para una Audiencia Externa (futuro, no aplica a esta versión)

Si más adelante este documento se reutiliza para presentar Loges-BIAP a un tercero (venta o licenciamiento), como mínimo debe ajustarse:

- Retirar o generalizar cualquier referencia a infraestructura interna específica de Gammacargo (servidor propio, VPN) — un tercero necesitaría su propia instancia o un modelo de despliegue distinto.
- Agregar una sección de modelo comercial/precios, ausente aquí porque en esta fase Loges-BIAP no genera ingresos directos (Documento 002, sección 5).
- Reforzar el diferencial frente a otras herramientas de inteligencia comercial del mercado, análisis que no era necesario para una audiencia interna que ya conoce el problema de primera mano.

## 12. Relación con los Siguientes Documentos

Este documento se apoya en los Documentos 001-007 y no introduce decisiones nuevas — es una síntesis para comunicación, no una fuente de verdad técnica. El Documento 009 en adelante debe seguir completando el blueprint que este documento resume.

---

*Este documento requiere validación del cliente (Ronald Cespedes, Grupo Gammacargo) antes de continuar con el Documento 009, conforme a la disciplina de la Fase 1 establecida en `CLAUDE.md`.*
