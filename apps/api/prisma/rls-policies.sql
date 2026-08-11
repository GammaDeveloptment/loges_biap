-- Politicas de Row Level Security (Documento 011, seccion 5) y bloqueo de
-- edicion de historial_cambio (Documento 014, matriz de la seccion 3, fila
-- "historial_cambio es append-only").
--
-- CONTENIDO PENDIENTE DE APLICAR: este archivo se escribio sin conexion a un
-- PostgreSQL real (Documento 014, seccion 6: ni siquiera en desarrollo se usa
-- una fuente/servidor no verificado; aqui ademas no hay ningun servidor
-- Postgres alcanzable desde este entorno). Debe incorporarse como una
-- migracion de Prisma una vez exista conexion real:
--
--   npx prisma migrate dev --name init                     (primera migracion, genera las tablas)
--   npx prisma migrate dev --name add_rls_policies --create-only
--   (pegar este contenido en la migracion generada, en vez de escribirlo a mano)
--   npx prisma migrate dev

-- La conexion del backend se autentica con un rol de aplicacion (no un
-- superusuario) que respeta RLS. El area del usuario autenticado se fija por
-- solicitud desde el backend (Documento 011, seccion 5):
--   SET app.current_user_area = 'comercial';

ALTER TABLE empresa_rol ENABLE ROW LEVEL SECURITY;
CREATE POLICY empresa_rol_por_area ON empresa_rol
USING (
  current_setting('app.current_user_area', true) = 'direccion_general'
  OR (current_setting('app.current_user_area', true) = 'comercial'
      AND rol IN ('cargador_candidato', 'cliente_actual'))
  OR (current_setting('app.current_user_area', true) = 'gerencia_comercial'
      AND rol = 'competidor')
  OR (current_setting('app.current_user_area', true) = 'operaciones_compras'
      AND rol LIKE 'proveedor_%')
);

ALTER TABLE proveedor_perfil ENABLE ROW LEVEL SECURITY;
CREATE POLICY proveedor_perfil_por_area ON proveedor_perfil
USING (
  current_setting('app.current_user_area', true) IN ('operaciones_compras', 'direccion_general')
);

ALTER TABLE competidor_perfil ENABLE ROW LEVEL SECURITY;
CREATE POLICY competidor_perfil_por_area ON competidor_perfil
USING (
  current_setting('app.current_user_area', true) IN ('gerencia_comercial', 'direccion_general')
);

ALTER TABLE competidor_cambio ENABLE ROW LEVEL SECURITY;
CREATE POLICY competidor_cambio_por_area ON competidor_cambio
USING (
  current_setting('app.current_user_area', true) IN ('gerencia_comercial', 'direccion_general')
);

-- contacto y registro_comercio_exterior heredan la visibilidad del rol de la
-- empresa a la que pertenecen (Documento 011, seccion 5).
ALTER TABLE contacto ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacto_por_rol_empresa ON contacto
USING (
  current_setting('app.current_user_area', true) = 'direccion_general'
  OR EXISTS (
    SELECT 1 FROM empresa_rol er
    WHERE er.empresa_id = contacto.empresa_id
      AND er.vigente
      AND (
        (current_setting('app.current_user_area', true) = 'comercial'
          AND er.rol IN ('cargador_candidato', 'cliente_actual'))
        OR (current_setting('app.current_user_area', true) = 'gerencia_comercial'
          AND er.rol = 'competidor')
        OR (current_setting('app.current_user_area', true) = 'operaciones_compras'
          AND er.rol LIKE 'proveedor_%')
      )
  )
);

ALTER TABLE registro_comercio_exterior ENABLE ROW LEVEL SECURITY;
CREATE POLICY registro_comercio_por_rol_empresa ON registro_comercio_exterior
USING (
  current_setting('app.current_user_area', true) IN ('comercial', 'direccion_general')
);

-- historial_cambio es append-only (Documento 005, seccion 5): ningun rol de
-- aplicacion puede UPDATE ni DELETE, sin importar su area. Solo INSERT/SELECT.
ALTER TABLE historial_cambio ENABLE ROW LEVEL SECURITY;
CREATE POLICY historial_cambio_solo_lectura ON historial_cambio
FOR SELECT USING (true);
CREATE POLICY historial_cambio_solo_insercion ON historial_cambio
FOR INSERT WITH CHECK (true);
-- Sin politica de UPDATE/DELETE => quedan denegados por defecto una vez RLS
-- esta activo en la tabla.

-- REVOKE explicito como segunda capa, independiente de RLS (Documento 014,
-- fila "historial_cambio es append-only": debe fallar a nivel de base de
-- datos, no solo por convencion de la aplicacion):
-- REVOKE UPDATE, DELETE ON historial_cambio FROM <rol_de_aplicacion>;
