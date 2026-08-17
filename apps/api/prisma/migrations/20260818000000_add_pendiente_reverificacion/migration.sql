-- Documento 009, seccion 5: marca un atributo cuyo valor vigente proviene
-- de resolver una discrepancia entre dos fuentes, en vez de asumirlo
-- resuelto sin dejar rastro.
ALTER TABLE "empresa_atributo" ADD COLUMN "pendiente_reverificacion" BOOLEAN NOT NULL DEFAULT false;
