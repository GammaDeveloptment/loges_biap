# Documento 002 — Modelo de Negocio (Business Model Canvas)

**Proyecto:** Loges-BIAP — Inteligencia Comercial y Logística, Grupo Gammacargo
**Versión:** 0.2 (adaptación logística de la versión original de BIAP)
**Fecha:** Julio 2026

---

## 0. Contexto

Este documento continúa el Documento 001 — Fundación de la Empresa. Si el Documento 001 respondió qué es Loges-BIAP y por qué existe, este documento responde cómo Loges-BIAP genera y captura valor para Grupo Gammacargo: quién lo usa, qué le entrega, cómo se lo entrega, cómo se relaciona con cada usuario y de dónde provienen su valor y sus costos.

El modelo se organiza según el Business Model Canvas (Osterwalder), pero con un ajuste de fondo respecto a la versión genérica de BIAP: **Loges-BIAP no es, en esta fase, un producto que se vende a clientes externos**. Es una herramienta de inteligencia comercial de uso **interno** para Grupo Gammacargo (ver Documento 001, sección 8). Por lo tanto:

- Los "segmentos de clientes" de la versión genérica (Marketing, Finanzas, RRHH, Consultoras, Gobiernos, Universidades, Cámaras de Comercio, Empresas de Software) **no aplican** — Loges-BIAP no vende a esos segmentos.
- Los segmentos reales son las áreas internas de Gammacargo que toman decisiones comerciales u operativas de comercio exterior, tal como quedaron definidas en el Documento 001 y traducidas a módulos en el Documento 003.
- El "licenciamiento a otras empresas logísticas" mencionado en el Documento 001 (visión) y en el Documento 002 original de BIAP (SaaS, licencias institucionales) se conserva, pero como **evolución futura no bloqueante**, no como fuente de ingresos de esta fase.

Se mantiene la regla de negocio: no vendemos por sector, apoyamos una decisión concreta.

## 1. Segmentos de "Clientes" (usuarios de la decisión que resuelve Loges-BIAP)

### 1.1 Usuarios internos directos de Gammacargo (uso primario de esta fase)

Coinciden exactamente con los actores funcionales del Documento 003:

- **Comercial / Ventas** — prospección de nuevos cargadores.
- **Gerencia Comercial** — análisis de competidores y posicionamiento.
- **Operaciones / Compras** — evaluación de proveedores logísticos.
- **Dirección General** — detección de tendencias y rutas comerciales emergentes.
- **Administrador de la plataforma** — gestión de usuarios, permisos y fuentes (no es un usuario de negocio, pero sí un rol de sostenimiento del sistema).

### 1.2 Sistemas internos consumidores (vía API)

- CRM comercial de Gammacargo — recibe cargadores candidatos.
- ERP de Gammacargo — recibe proveedores logísticos evaluados.

Esto reemplaza al segmento genérico "empresas de software" de la versión original de BIAP: en Loges-BIAP no hay terceros integrando la API todavía, son los propios sistemas de Gammacargo.

### 1.3 (Futuro, no bloqueante) Licenciamiento institucional

Si Gammacargo decide en el futuro licenciar Loges-BIAP a otras empresas del sector logístico en Latinoamérica, este segmento se activaría bajo el mismo modelo modular de BIAP (SaaS, API, licencias institucionales). No es un requisito de diseño de esta fase, pero **la arquitectura debe permanecer desacoplada** para no bloquear esta opción (ver Documento 001, nota estratégica).

## 2. Propuesta de Valor

La propuesta de valor de Loges-BIAP se apoya directamente en la gran idea del Documento 001: Loges-BIAP no busca cargadores, Loges-BIAP construye conocimiento comercial y logístico. Esto se traduce en cinco promesas concretas para los equipos de Gammacargo:

- **Ahorro de tiempo:** lo que hoy toma días de investigación manual de cargadores, competidores o proveedores, Loges-BIAP lo entrega en minutos.
- **Confianza en la fuente:** cada dato de un cargador, competidor o proveedor logístico incluye de dónde proviene y qué tan confiable es, no una lista sin trazabilidad.
- **Información viva:** los datos de comercio exterior y logística se actualizan de forma continua, no son una fotografía que caduca.
- **Integración nativa:** la información llega al CRM y al ERP que Gammacargo ya usa, vía API, sin fricción operativa ni doble captura.
- **Conocimiento, no ruido:** Loges-BIAP entrega candidatos comerciales y proveedores realmente relevantes, no volúmenes de empresas sin depurar.

## 3. Canales

A diferencia de BIAP genérico, Loges-BIAP no necesita canales de adquisición de clientes externos en esta fase. Los canales son de **distribución interna** dentro de Gammacargo, más un canal futuro reservado para licenciamiento:

- **Plataforma web interna** — panel de inteligencia comercial (Documento 003, módulo 3.8) para Comercial, Operaciones y Gerencia.
- **API de integración interna** — hacia el CRM comercial y el ERP de Gammacargo (Documento 003, módulo 3.7).
- **Onboarding y capacitación interna** — para que cada área adopte el módulo que le corresponde (cargadores, competidores, proveedores, tendencias).
- **(Futuro) Portal/API de licenciamiento y venta consultiva directa** — únicamente si Gammacargo decide ofrecer Loges-BIAP a otras empresas logísticas.

## 4. Relación con los Usuarios

- **Soporte interno de producto** — el equipo que mantiene Loges-BIAP da soporte directo a Comercial, Operaciones, Gerencia y Dirección General, no hay "autoservicio" en el sentido de un cliente externo desconocido.
- **Transparencia como relación de confianza** — mostrar el origen y nivel de confianza de cada dato es lo que sostiene la adopción interna en el tiempo (valor de Transparencia, Documento 001).
- **Gobernanza de acceso** — la relación con cada usuario interno está mediada por el Módulo de Administración y Permisos (Documento 003, 3.9), dado que parte de la información es comercialmente sensible.
- **(Futuro) Cuentas dedicadas (Customer Success)** — si se activa el licenciamiento institucional a terceros, aplicaría el modelo de cuentas dedicadas de BIAP genérico.

## 5. Modelo de Captura de Valor (reemplaza "Fuentes de Ingresos")

En esta fase, Loges-BIAP **no genera ingresos directos** — es un costo de producto que Gammacargo capitaliza como ventaja comercial y operativa interna. El valor se captura de forma indirecta:

- **Incremento de la tasa de conversión comercial** — más y mejores cargadores candidatos detectados por unidad de tiempo del equipo de ventas.
- **Reducción del costo de evaluación de proveedores** — menos horas de Operaciones/Compras investigando transportistas, agentes aduanales y bodegas manualmente.
- **Ventaja de anticipación** — detección temprana de tendencias y rutas emergentes que informan decisiones de expansión de la Dirección General.
- **Reducción de riesgo comercial** — mejor análisis de competidores para decisiones de posicionamiento y pricing.

**(Futuro, no bloqueante) Fuentes de ingreso directo si se licencia a terceros**, heredadas del modelo original de BIAP:

- Suscripción SaaS por niveles.
- Consumo de API por créditos o consultas.
- Licencias institucionales anuales.
- Proyectos de enriquecimiento a medida.

Este punto debe revisarse a fondo si Gammacargo decide activar la vía de licenciamiento; no condiciona el diseño de la Fase 1 actual.

## 6. Recursos Clave

- Motor de agentes de Inteligencia Artificial — el activo tecnológico central de Loges-BIAP (Documento 003, módulo 3.6).
- Infraestructura de descubrimiento y actualización continua de información pública de comercio exterior y logística.
- Base de datos empresarial y logística propia, estructurada y con trazabilidad de fuentes (Documento 005).
- Marca Loges-BIAP dentro de Gammacargo — activo de largo plazo (Documento 001).
- Equipo técnico especializado en IA, datos e ingeniería de agentes.
- Marco de cumplimiento legal sobre fuentes públicas de comercio exterior y protección de datos por país (Documento 012-B).
- Relación de integración con el CRM y ERP que Gammacargo ya opera.

## 7. Actividades Clave

- Desarrollo y mantenimiento de los agentes de IA que descubren, estructuran y enriquecen cargadores, competidores y proveedores logísticos.
- Actualización continua y control de calidad de los datos ya recolectados.
- Desarrollo y mantenimiento de la API de integración con el CRM y el ERP de Gammacargo.
- Gestión del cumplimiento normativo y de los términos de uso de cada fuente pública de comercio exterior utilizada, por país.
- Soporte, capacitación y adopción interna por cada área usuaria (Comercial, Operaciones, Gerencia, Dirección General).

## 8. Asociaciones Clave

- Proveedores de infraestructura cloud y de modelos de Inteligencia Artificial.
- Fuentes de datos públicas de comercio exterior: registros aduaneros, registros mercantiles, cámaras de comercio, entidades gubernamentales por país.
- Proveedores del CRM y del ERP que Gammacargo ya utiliza, para la integración vía API.
- Asesoría legal especializada en normativa aduanera, de comercio exterior y de protección de datos, por país (dado el alcance latinoamericano de la visión del proyecto).

## 9. Estructura de Costos

- Infraestructura cloud y cómputo de IA — el componente variable más relevante, ligado al volumen de fuentes de comercio exterior procesadas.
- Desarrollo y mantenimiento de producto — equipo técnico y de agentes.
- Cumplimiento legal y gestión de riesgo de fuentes por país — recurrente y no negociable (valor de Ética, Documento 001).
- Soporte y adopción interna en Gammacargo.
- **(Futuro)** Adquisición de clientes y venta consultiva, únicamente si se activa el licenciamiento a terceros.

## 10. Resumen visual — Business Model Canvas (Loges-BIAP / Gammacargo)

| Asociaciones Clave | Actividades Clave | Propuesta de Valor |
|---|---|---|
| Fuentes públicas de comercio exterior por país, cloud/IA, proveedores del CRM/ERP de Gammacargo, asesoría legal por país. | Desarrollo de agentes IA, descubrimiento continuo de cargadores/competidores/proveedores, control de calidad, API de integración, cumplimiento normativo. | Convertir información pública de comercio exterior en conocimiento comercial y logístico confiable, trazable y siempre actualizado para Gammacargo. |

| Recursos Clave | | Relación con los Usuarios |
|---|---|---|
| Motor de agentes de IA, base de datos empresarial/logística propia, marca Loges-BIAP, equipo técnico especializado. | | Soporte interno de producto, transparencia de fuentes, gobernanza de acceso por rol, (futuro) cuentas dedicadas si hay licenciamiento. |

| Canales | | Segmentos ("Clientes") |
|---|---|---|
| Plataforma web interna, API de integración con CRM/ERP, onboarding interno, (futuro) portal de licenciamiento. | | Comercial/Ventas, Gerencia Comercial, Operaciones/Compras, Dirección General, sistemas CRM/ERP internos, (futuro) otras empresas logísticas licenciatarias. |

| Estructura de Costos | Modelo de Captura de Valor |
|---|---|
| Infraestructura cloud/IA, desarrollo de producto, cumplimiento legal por país, soporte interno, (futuro) adquisición de clientes. | Conversión comercial, ahorro de tiempo de evaluación de proveedores, anticipación de tendencias, reducción de riesgo competitivo; (futuro) SaaS/API/licencias si se licencia a terceros. |

## 11. Nota de cierre

Este modelo de negocio debe leerse junto con la regla establecida en el Documento 001: cada nueva funcionalidad debe responder a la pregunta "¿esto ayuda a Gammacargo (o a su cliente) a tomar una mejor decisión?". A diferencia de la versión genérica de BIAP, aquí no existe una línea de ingresos que valide por sí sola una funcionalidad — el criterio de validación es la mejora de la decisión comercial u operativa interna, reservando el licenciamiento a terceros como evolución futura. Este documento es la base, junto con el Documento 003 — Arquitectura Funcional, para el Documento 004 — Arquitectura Técnica.
