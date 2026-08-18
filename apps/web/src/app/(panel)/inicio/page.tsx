'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { obtenerSesion, type Sesion } from '@/lib/session';
import {
  listarEjecucionesAgente,
  listarEmpresas,
  listarFuentes,
  type EjecucionAgente,
  type EmpresaResumen,
  type Fuente,
} from '@/lib/api';
import { ChipConfianza } from '@/components/ChipConfianza';

// Documento 007, Entrega 5 (criterio de salida: "cada rol de negocio tiene
// su panel de inicio funcional"). Antes de esto era un mensaje estatico por
// area (Documento 006, seccion 3) sin datos reales.
//
// No existe un endpoint de conteo total (Documento 010 no lo define) - los
// numeros de esta pantalla son sobre la pagina traida (`limite`), no un
// conteo exacto de toda la tabla. Correcto para el volumen actual del
// proyecto (datos sinteticos); si el volumen real crece, esto necesitaria
// un endpoint de agregacion dedicado en vez de inflar `limite`.
const LIMITE_RESUMEN = 100;
const MAX_RECIENTES = 5;

function TarjetaResumen({ numero, subtitulo }: { numero: number | string; subtitulo: string }) {
  return (
    <div className="card tarjeta-resumen">
      <div className="numero">{numero}</div>
      <div className="subtitulo">{subtitulo}</div>
    </div>
  );
}

function ListaReciente({
  empresas,
  verTodosHref,
}: {
  empresas: EmpresaResumen[];
  verTodosHref: string;
}) {
  if (empresas.length === 0) {
    return <p className="vacio">Todavia no hay nada aqui.</p>;
  }
  return (
    <>
      <div className="lista-simple">
        {empresas.slice(0, MAX_RECIENTES).map((e) => (
          <div className="item" key={e.id}>
            <span>{e.nombreLegal}</span>
            <span className="meta">
              {e.pais} {e.sector ? `· ${e.sector}` : ''}
              {e.nivelConfianzaGeneral && <ChipConfianza nivel={e.nivelConfianzaGeneral} />}
            </span>
          </div>
        ))}
      </div>
      <Link href={verTodosHref} className="btn" style={{ marginTop: '1rem', display: 'inline-block' }}>
        Ver todos
      </Link>
    </>
  );
}

function PanelComercial() {
  const [empresas, setEmpresas] = useState<EmpresaResumen[] | null>(null);

  useEffect(() => {
    listarEmpresas({ rol: 'cargador_candidato', limite: LIMITE_RESUMEN }).then((r) => setEmpresas(r.datos));
  }, []);

  if (!empresas) return null;

  return (
    <>
      <div className="grilla-resumen">
        <TarjetaResumen numero={empresas.length} subtitulo="Cargadores candidatos descubiertos" />
      </div>
      <div className="card">
        <h2>Descubiertos recientemente</h2>
        <div style={{ marginTop: '0.8rem' }}>
          <ListaReciente empresas={empresas} verTodosHref="/cargadores" />
        </div>
      </div>
    </>
  );
}

function PanelGerenciaComercial() {
  const [empresas, setEmpresas] = useState<EmpresaResumen[] | null>(null);

  useEffect(() => {
    listarEmpresas({ rol: 'competidor', limite: LIMITE_RESUMEN }).then((r) => setEmpresas(r.datos));
  }, []);

  if (!empresas) return null;

  const monitoreadosUltimos30Dias = empresas.filter((e) => {
    const fecha = e.competidorPerfil?.fechaUltimoMonitoreo;
    if (!fecha) return false;
    return Date.now() - new Date(fecha).getTime() < 30 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <>
      <div className="grilla-resumen">
        <TarjetaResumen numero={empresas.length} subtitulo="Competidores monitoreados" />
        <TarjetaResumen numero={monitoreadosUltimos30Dias} subtitulo="Con monitoreo en los ultimos 30 dias" />
      </div>
      <div className="card">
        <h2>Competidores</h2>
        <div style={{ marginTop: '0.8rem' }}>
          <ListaReciente empresas={empresas} verTodosHref="/competidores" />
        </div>
      </div>
    </>
  );
}

const ROLES_PROVEEDOR = ['proveedor_transportista', 'proveedor_aduanal', 'proveedor_bodega'] as const;

function PanelOperacionesCompras() {
  const [empresas, setEmpresas] = useState<EmpresaResumen[] | null>(null);

  useEffect(() => {
    Promise.all(ROLES_PROVEEDOR.map((rol) => listarEmpresas({ rol, limite: LIMITE_RESUMEN }))).then(
      (resultados) => {
        const todas = resultados.flatMap((r) => r.datos);
        todas.sort((a, b) => new Date(b.fechaDescubrimiento).getTime() - new Date(a.fechaDescubrimiento).getTime());
        setEmpresas(todas);
      },
    );
  }, []);

  if (!empresas) return null;

  const pendientes = empresas.filter((e) => {
    const estado = e.proveedorPerfil?.estadoEvaluacion;
    return estado === 'nuevo' || estado === 'en_evaluacion';
  }).length;

  return (
    <>
      <div className="grilla-resumen">
        <TarjetaResumen numero={empresas.length} subtitulo="Proveedores logisticos registrados" />
        <TarjetaResumen numero={pendientes} subtitulo="Pendientes de evaluacion" />
      </div>
      <div className="card">
        <h2>Proveedores</h2>
        <div style={{ marginTop: '0.8rem' }}>
          <ListaReciente empresas={empresas} verTodosHref="/proveedores" />
        </div>
      </div>
    </>
  );
}

function PanelDireccionGeneral() {
  const [empresas, setEmpresas] = useState<EmpresaResumen[] | null>(null);
  const [fuentes, setFuentes] = useState<Fuente[] | null>(null);

  useEffect(() => {
    listarEmpresas({ limite: LIMITE_RESUMEN }).then((r) => setEmpresas(r.datos));
    listarFuentes().then(setFuentes);
  }, []);

  if (!empresas || !fuentes) return null;

  const contarPorRol = (roles: readonly string[]) =>
    empresas.filter((e) => e.roles.some((r) => roles.includes(r.rol))).length;

  return (
    <>
      <div className="grilla-resumen">
        <TarjetaResumen numero={contarPorRol(['cargador_candidato'])} subtitulo="Cargadores candidatos" />
        <TarjetaResumen numero={contarPorRol(['competidor'])} subtitulo="Competidores monitoreados" />
        <TarjetaResumen numero={contarPorRol(ROLES_PROVEEDOR)} subtitulo="Proveedores logisticos" />
        <TarjetaResumen numero={fuentes.filter((f) => f.activa).length} subtitulo={`Fuentes activas de ${fuentes.length}`} />
      </div>
      <div className="card">
        <h2>Tendencias de Mercado</h2>
        <p className="vacio" style={{ marginTop: '0.6rem' }}>
          Modulo de Inteligencia de Mercado (Documento 003, 3.4) — bloqueado hasta que el Documento 012-B apruebe
          una fuente real de comercio exterior (Entrega 6, Documento 007). No se muestran datos sinteticos aqui
          para no aparentar una capacidad que todavia no existe.
        </p>
      </div>
    </>
  );
}

function PanelAdministrador() {
  const [fuentes, setFuentes] = useState<Fuente[] | null>(null);
  const [ejecuciones, setEjecuciones] = useState<EjecucionAgente[] | null>(null);

  useEffect(() => {
    listarFuentes().then(setFuentes);
    listarEjecucionesAgente().then(setEjecuciones);
  }, []);

  if (!fuentes || !ejecuciones) return null;

  const fallidasRecientes = ejecuciones.filter((e) => e.estado === 'fallido').length;

  return (
    <>
      <div className="grilla-resumen">
        <TarjetaResumen numero={fuentes.filter((f) => f.activa).length} subtitulo={`Fuentes activas de ${fuentes.length}`} />
        <TarjetaResumen numero={ejecuciones.length} subtitulo="Ejecuciones de agente registradas" />
        <TarjetaResumen numero={fallidasRecientes} subtitulo="Ejecuciones fallidas" />
      </div>
      <div className="card">
        <h2>Ultimas ejecuciones del Motor de Agentes</h2>
        {ejecuciones.length === 0 ? (
          <p className="vacio" style={{ marginTop: '0.6rem' }}>Todavia no hay ejecuciones registradas.</p>
        ) : (
          <div className="lista-simple" style={{ marginTop: '0.8rem' }}>
            {ejecuciones.slice(0, MAX_RECIENTES).map((e) => (
              <div className="item" key={e.id}>
                <span>{e.tipoTarea}</span>
                <span className="meta">
                  {e.estado} · {new Date(e.fechaInicio).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
        <Link href="/administracion" className="btn" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Ver Administracion
        </Link>
      </div>
    </>
  );
}

const PANEL_POR_AREA: Record<string, () => React.JSX.Element | null> = {
  comercial: PanelComercial,
  gerencia_comercial: PanelGerenciaComercial,
  operaciones_compras: PanelOperacionesCompras,
  direccion_general: PanelDireccionGeneral,
  administrador: PanelAdministrador,
};

export default function InicioPage() {
  const [sesion, setSesion] = useState<Sesion | null>(null);

  useEffect(() => {
    setSesion(obtenerSesion());
  }, []);

  if (!sesion) return null;

  const Panel = PANEL_POR_AREA[sesion.usuario.area];

  return (
    <div className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Hola, {sesion.usuario.nombre}</h1>
        </div>
      </div>
      {Panel && <Panel />}
    </div>
  );
}
