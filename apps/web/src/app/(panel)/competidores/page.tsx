'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  dispararEjecucion,
  esperarEjecucion,
  listarEmpresas,
  obtenerFichaEmpresa,
  type EmpresaResumen,
  type FichaEmpresa,
} from '@/lib/api';
import { IconButton } from '@/components/IconButton';

// Documento 003, modulo 3.2 - Entrega 3, con conector simulado (Documento
// 014, seccion 6) mientras el Documento 012-B no apruebe una fuente real.
export default function CompetidoresPage() {
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([]);
  const [ficha, setFicha] = useState<FichaEmpresa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buscandoNuevos, setBuscandoNuevos] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function buscar() {
    try {
      setError(null);
      const resultado = await listarEmpresas({ rol: 'competidor' });
      setEmpresas(resultado.datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar competidores.');
    }
  }

  useEffect(() => {
    buscar();
  }, []);

  async function monitorearCompetidores() {
    setBuscandoNuevos(true);
    setMensaje(null);
    setError(null);
    try {
      const ejecucion = await dispararEjecucion('monitoreo_competidor', {});
      const resultado = await esperarEjecucion(ejecucion.id);
      if (!resultado) {
        setError('El monitoreo esta tardando mas de lo esperado - revisa el Monitor de Agentes en Administracion.');
      } else if (resultado.estado === 'fallido') {
        setError(resultado.resultadoResumen ?? 'El monitoreo fallo.');
      } else {
        setMensaje(resultado.resultadoResumen);
      }
      await buscar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo disparar el monitoreo.');
    } finally {
      setBuscandoNuevos(false);
    }
  }

  async function abrirFicha(id: string) {
    try {
      setFicha(await obtenerFichaEmpresa(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la ficha.');
    }
  }

  return (
    <div className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Competidores</h1>
          <p>Navieras, freight forwarders y agentes de carga monitoreados (Documento 003, modulo 3.2).</p>
        </div>
      </div>

      {error && <p style={{ color: 'var(--color-peligro)' }}>{error}</p>}
      {mensaje && <p style={{ color: 'var(--texto-secundario)' }}>{mensaje}</p>}

      <div className="barra-herramientas">
        <IconButton
          icono={Sparkles}
          etiqueta={buscandoNuevos ? 'Monitoreando competidores...' : 'Monitorear competidores con el Motor de Agentes'}
          variante="primario"
          onClick={monitorearCompetidores}
          disabled={buscandoNuevos}
        />
      </div>

      <div className="diseno-lista-detalle">
        <div className="contenedor-tabla">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Pais</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e) => (
                <tr key={e.id} data-clicable className={ficha?.id === e.id ? 'fila-seleccionada' : ''} onClick={() => abrirFicha(e.id)}>
                  <td>
                    <div className="fila-empresa">
                      <span className="avatar">{e.nombreLegal.slice(0, 2).toUpperCase()}</span>
                      <strong>{e.nombreLegal}</strong>
                    </div>
                  </td>
                  <td>{e.pais}</td>
                </tr>
              ))}
              {empresas.length === 0 && <tr><td colSpan={2} className="vacio">Sin competidores monitoreados todavia.</td></tr>}
            </tbody>
          </table>
        </div>

        {ficha && (
          <div className="card">
            <h2>{ficha.nombreLegal}</h2>
            {ficha.competidorPerfil && (
              <>
                <p style={{ color: 'var(--texto-secundario)', marginTop: '0.2rem' }}>
                  {ficha.competidorPerfil.tipo} &middot; {ficha.competidorPerfil.coberturaGeografica}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--texto-terciario)', marginTop: '0.3rem' }}>
                  Ultimo monitoreo: {ficha.competidorPerfil.fechaUltimoMonitoreo && new Date(ficha.competidorPerfil.fechaUltimoMonitoreo).toLocaleString()}
                </p>

                <div className="card-seccion">
                  <h3>Alertas de cambios</h3>
                  <div className="lista-simple" style={{ marginTop: '0.6rem' }}>
                    {ficha.competidorPerfil.cambios.map((c) => (
                      <div className="item" key={c.id}>
                        <span><span className="chip-estado">{c.tipoCambio}</span> {c.descripcion}</span>
                        <span className="meta">{new Date(c.fechaDeteccion).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {ficha.competidorPerfil.cambios.length === 0 && <p className="vacio">Sin cambios detectados todavia.</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
