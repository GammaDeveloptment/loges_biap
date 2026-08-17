-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "nivel_confianza" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "tipo_fuente" AS ENUM ('registro_mercantil', 'registro_aduanero', 'camara_comercio', 'estadistica_comercio_exterior', 'sitio_publico_corporativo', 'otro');

-- CreateEnum
CREATE TYPE "rol_empresa" AS ENUM ('cargador_candidato', 'cliente_actual', 'competidor', 'proveedor_transportista', 'proveedor_aduanal', 'proveedor_bodega');

-- CreateEnum
CREATE TYPE "estado_empresa" AS ENUM ('activa', 'descartada', 'inactiva');

-- CreateEnum
CREATE TYPE "tipo_operacion_comercio_exterior" AS ENUM ('importacion', 'exportacion');

-- CreateEnum
CREATE TYPE "tipo_servicio_proveedor" AS ENUM ('transporte_terrestre', 'agente_aduanal', 'bodega_almacen');

-- CreateEnum
CREATE TYPE "estado_evaluacion_proveedor" AS ENUM ('nuevo', 'en_evaluacion', 'aprobado', 'descartado');

-- CreateEnum
CREATE TYPE "tipo_competidor" AS ENUM ('naviera', 'freight_forwarder', 'agente_carga');

-- CreateEnum
CREATE TYPE "tipo_cambio_competidor" AS ENUM ('nueva_ruta', 'nueva_alianza', 'expansion', 'otro');

-- CreateEnum
CREATE TYPE "tipo_agregacion_tendencia" AS ENUM ('sector', 'ruta', 'pais');

-- CreateEnum
CREATE TYPE "area_usuario" AS ENUM ('comercial', 'gerencia_comercial', 'operaciones_compras', 'direccion_general', 'administrador');

-- CreateEnum
CREATE TYPE "tipo_accion_interaccion" AS ENUM ('contactado', 'evaluado', 'descartado', 'marcado_relevante');

-- CreateEnum
CREATE TYPE "tipo_tarea_agente" AS ENUM ('descubrimiento_cargador', 'enriquecimiento_proveedor', 'monitoreo_competidor', 'actualizacion_tendencia');

-- CreateEnum
CREATE TYPE "estado_ejecucion_agente" AS ENUM ('pendiente', 'en_progreso', 'completado', 'fallido');

-- CreateEnum
CREATE TYPE "sistema_destino_sincronizacion" AS ENUM ('crm', 'erp');

-- CreateEnum
CREATE TYPE "estado_sincronizacion" AS ENUM ('pendiente', 'exitosa', 'fallida');

-- CreateEnum
CREATE TYPE "accion_auditoria" AS ENUM ('login_exitoso', 'login_fallido', 'acceso_denegado');

-- CreateTable
CREATE TABLE "fuente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "tipo_fuente" NOT NULL,
    "pais" TEXT NOT NULL,
    "url_base" TEXT,
    "nivel_confianza_base" "nivel_confianza" NOT NULL,
    "terminos_uso_verificados" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "aprobado_por" TEXT,
    "fecha_aprobacion_legal" TIMESTAMP(3),
    "referencia_legal" TEXT,
    "fecha_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa" (
    "id" TEXT NOT NULL,
    "nombre_legal" TEXT NOT NULL,
    "nombre_comercial" TEXT,
    "pais" TEXT NOT NULL,
    "identificador_fiscal" TEXT,
    "sector" TEXT,
    "sitio_web" TEXT,
    "estado" "estado_empresa" NOT NULL DEFAULT 'activa',
    "fuente_descubrimiento_id" TEXT,
    "nivel_confianza_general" "nivel_confianza",
    "fecha_descubrimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_verificacion" TIMESTAMP(3),

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa_rol" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "rol" "rol_empresa" NOT NULL,
    "fuente_id" TEXT,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "empresa_rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa_atributo" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "atributo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "fuente_id" TEXT NOT NULL,
    "nivel_confianza" "nivel_confianza" NOT NULL,
    "ejecucion_agente_id" TEXT,
    "fecha_verificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "empresa_atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacto" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "fuente_id" TEXT NOT NULL,
    "nivel_confianza" "nivel_confianza" NOT NULL,
    "fecha_verificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_comercio_exterior" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo_operacion" "tipo_operacion_comercio_exterior" NOT NULL,
    "producto_descripcion" TEXT NOT NULL,
    "partida_arancelaria" TEXT,
    "pais_origen" TEXT NOT NULL,
    "pais_destino" TEXT NOT NULL,
    "volumen_estimado" DECIMAL(65,30),
    "unidad_volumen" TEXT,
    "periodo_inicio" TIMESTAMP(3) NOT NULL,
    "periodo_fin" TIMESTAMP(3) NOT NULL,
    "fuente_id" TEXT NOT NULL,
    "nivel_confianza" "nivel_confianza" NOT NULL,
    "ejecucion_agente_id" TEXT,
    "fecha_deteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_comercio_exterior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedor_perfil" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo_servicio" "tipo_servicio_proveedor" NOT NULL,
    "zona_cobertura" TEXT,
    "estado_evaluacion" "estado_evaluacion_proveedor" NOT NULL DEFAULT 'nuevo',
    "evaluado_por_usuario_id" TEXT,
    "fecha_evaluacion" TIMESTAMP(3),

    CONSTRAINT "proveedor_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competidor_perfil" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo" "tipo_competidor" NOT NULL,
    "cobertura_geografica" TEXT,
    "fecha_ultimo_monitoreo" TIMESTAMP(3),

    CONSTRAINT "competidor_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competidor_cambio" (
    "id" TEXT NOT NULL,
    "competidor_perfil_id" TEXT NOT NULL,
    "tipo_cambio" "tipo_cambio_competidor" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fuente_id" TEXT NOT NULL,
    "fecha_deteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competidor_cambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicador_tendencia" (
    "id" TEXT NOT NULL,
    "tipo_agregacion" "tipo_agregacion_tendencia" NOT NULL,
    "clave" TEXT NOT NULL,
    "periodo_inicio" TIMESTAMP(3) NOT NULL,
    "periodo_fin" TIMESTAMP(3) NOT NULL,
    "valor_metrica" DECIMAL(65,30) NOT NULL,
    "variacion_pct" DECIMAL(65,30),
    "fecha_calculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ejecucion_agente_id" TEXT,

    CONSTRAINT "indicador_tendencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "area" "area_usuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaccion_usuario" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "tipo_accion" "tipo_accion_interaccion" NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaccion_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sincronizacion_externa" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "sistema_destino" "sistema_destino_sincronizacion" NOT NULL,
    "estado" "estado_sincronizacion" NOT NULL DEFAULT 'pendiente',
    "detalle_error" TEXT,
    "fecha_intento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sincronizacion_externa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_acceso" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "accion" "accion_auditoria" NOT NULL,
    "recurso" TEXT,
    "ip_origen" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_cambio" (
    "id" TEXT NOT NULL,
    "entidad_tipo" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "campo" TEXT,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT NOT NULL,
    "fuente_id" TEXT,
    "ejecucion_agente_id" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_cambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejecucion_agente" (
    "id" TEXT NOT NULL,
    "tipo_tarea" "tipo_tarea_agente" NOT NULL,
    "criterios" JSONB,
    "estado" "estado_ejecucion_agente" NOT NULL DEFAULT 'pendiente',
    "resultado_resumen" TEXT,
    "cola_job_id" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),

    CONSTRAINT "ejecucion_agente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "empresa_rol_empresa_id_rol_idx" ON "empresa_rol"("empresa_id", "rol");

-- CreateIndex
CREATE INDEX "empresa_atributo_empresa_id_atributo_vigente_idx" ON "empresa_atributo"("empresa_id", "atributo", "vigente");

-- CreateIndex
CREATE UNIQUE INDEX "proveedor_perfil_empresa_id_key" ON "proveedor_perfil"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "competidor_perfil_empresa_id_key" ON "competidor_perfil"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "interaccion_usuario_empresa_id_tipo_accion_idx" ON "interaccion_usuario"("empresa_id", "tipo_accion");

-- CreateIndex
CREATE INDEX "historial_cambio_entidad_tipo_entidad_id_idx" ON "historial_cambio"("entidad_tipo", "entidad_id");

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_fuente_descubrimiento_id_fkey" FOREIGN KEY ("fuente_descubrimiento_id") REFERENCES "fuente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_rol" ADD CONSTRAINT "empresa_rol_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_rol" ADD CONSTRAINT "empresa_rol_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_atributo" ADD CONSTRAINT "empresa_atributo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_atributo" ADD CONSTRAINT "empresa_atributo_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_atributo" ADD CONSTRAINT "empresa_atributo_ejecucion_agente_id_fkey" FOREIGN KEY ("ejecucion_agente_id") REFERENCES "ejecucion_agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacto" ADD CONSTRAINT "contacto_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacto" ADD CONSTRAINT "contacto_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_comercio_exterior" ADD CONSTRAINT "registro_comercio_exterior_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_comercio_exterior" ADD CONSTRAINT "registro_comercio_exterior_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_comercio_exterior" ADD CONSTRAINT "registro_comercio_exterior_ejecucion_agente_id_fkey" FOREIGN KEY ("ejecucion_agente_id") REFERENCES "ejecucion_agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedor_perfil" ADD CONSTRAINT "proveedor_perfil_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedor_perfil" ADD CONSTRAINT "proveedor_perfil_evaluado_por_usuario_id_fkey" FOREIGN KEY ("evaluado_por_usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competidor_perfil" ADD CONSTRAINT "competidor_perfil_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competidor_cambio" ADD CONSTRAINT "competidor_cambio_competidor_perfil_id_fkey" FOREIGN KEY ("competidor_perfil_id") REFERENCES "competidor_perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competidor_cambio" ADD CONSTRAINT "competidor_cambio_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_tendencia" ADD CONSTRAINT "indicador_tendencia_ejecucion_agente_id_fkey" FOREIGN KEY ("ejecucion_agente_id") REFERENCES "ejecucion_agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaccion_usuario" ADD CONSTRAINT "interaccion_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaccion_usuario" ADD CONSTRAINT "interaccion_usuario_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sincronizacion_externa" ADD CONSTRAINT "sincronizacion_externa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_acceso" ADD CONSTRAINT "auditoria_acceso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cambio" ADD CONSTRAINT "historial_cambio_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cambio" ADD CONSTRAINT "historial_cambio_ejecucion_agente_id_fkey" FOREIGN KEY ("ejecucion_agente_id") REFERENCES "ejecucion_agente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

