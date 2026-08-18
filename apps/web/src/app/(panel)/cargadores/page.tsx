'use client';

import { useEffect, useState } from 'react';
import { Search, PhoneCall, X, Sparkles } from 'lucide-react';
import {
  crearInteraccion,
  dispararEjecucion,
  esperarEjecucion,
  listarEmpresas,
  obtenerFichaEmpresa,
  type EmpresaResumen,
  type FichaEmpresa,
} from '@/lib/api';
import { ChipConfianza } from '@/components/ChipConfianza';
import { IconButton } from '@/components/IconButton';

// Documento 006, secciones 4.1 (busqueda) y 4.2 (ficha de empresa) - Entrega
// 2, con datos del conector simulado (Documento 014, seccion 6) mientras
// ninguna fuente real tenga aprobacion del Documento 012-B.
export default function CargadoresPage() {
  const [sector, setSector] = useState('');
  const [pais, setPais] = useState('');
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([]);
  const [ficha, setFicha] = useState<FichaEmpresa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buscandoNuevos, setBuscandoNuevos] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function buscarCandidatosNuevos() {
    setBuscandoNuevos(true);
    setMensaje(null);
    setError(null);
    try {
      const ejecucion = await dispararEjecucion('descubrimiento_cargador', {
        sector: sector || undefined,
        pais: pais || undefined,
      });
      const resultado = await esperarEjecucion(ejecucion.id);
      if (!resultado) {
        setError('La busqueda esta tardando mas de lo esperado - revisa el Monitor de Agentes en Administracion.');
      } else if (resultado.estado === 'fallido') {
        setError(resultado.resultadoResumen ?? 'La busqueda fallo.');
      } else {
        setMensaje(resultado.resultadoResumen);
      }
      await buscar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo disparar la busqueda.');
    } finally {
      setBuscandoNuevos(false);
    }
  }

  async function buscar() {
    try {
      setError(null);
      const resultado = await listarEmpresas({ rol: 'cargador_candidato', sector, pais });
      setEmpresas(resultado.datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar cargadores.');
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function abrirFicha(id: string) {
    try {
      setFicha(await obtenerFichaEmpresa(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la ficha.');
    }
  }

  async function marcar(tipoAccion: 'contactado' | 'descartado') {
    if (!ficha) return;
    try {
      await crearInteraccion(ficha.id, { tipoAccion });
      await abrirFicha(ficha.id);
      buscar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la accion.');
    }
  }

  return (
    <div className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Clientes Potenciales</h1>
          <p>Empresas candidatas (cargadores) detectadas por el Motor de Agentes (Documento 003, modulo 3.1).</p>
        </div>
      </div>

      {error && <p style={{ color: 'var(--color-peligro)' }}>{error}</p>}
      {mensaje && <p style={{ color: 'var(--texto-secundario)' }}>{mensaje}</p>}

      <div className="diseno-lista-detalle">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-4)' }}>
          <div className="barra-herramientas">
            <input placeholder="Sector" value={sector} onChange={(e) => setSector(e.target.value)} />
            <input placeholder="Pais (ISO)" value={pais} onChange={(e) => setPais(e.target.value)} style={{ width: 90 }} />
            <IconButton icono={Search} etiqueta="Buscar en lo ya descubierto" onClick={buscar} />
            <IconButton
              icono={Sparkles}
              etiqueta={buscandoNuevos ? 'Buscando candidatos nuevos (puede tardar unos segundos, usa IA real)...' : 'Buscar candidatos nuevos con el Motor de Agentes'}
              variante="primario"
              onClick={buscarCandidatosNuevos}
              disabled={buscandoNuevos}
            />
          </div>

          <div className="contenedor-tabla">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Sector</th>
                  <th>Pais</th>
                  <th>Confianza</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((e) => (
                  <tr
                    key={e.id}
                    data-clicable
                    className={ficha?.id === e.id ? 'fila-seleccionada' : ''}
                    onClick={() => abrirFicha(e.id)}
                  >
                    <td>
                      <div className="fila-empresa">
                        <span className="avatar">{e.nombreLegal.slice(0, 2).toUpperCase()}</span>
                        <strong>{e.nombreLegal}</strong>
                      </div>
                    </td>
                    <td>{e.sector}</td>
                    <td>{e.pais}</td>
                    <td><ChipConfianza nivel={e.nivelConfianzaGeneral ?? 'MEDIA'} /></td>
                  </tr>
                ))}
                {empresas.length === 0 && (
                  <tr><td colSpan={4} className="vacio">Sin resultados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {ficha && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>{ficha.nombreLegal}</h2>
                <p style={{ color: 'var(--texto-secundario)', marginTop: '0.2rem' }}>
                  {ficha.sector} &middot; {ficha.pais}
                </p>
              </div>
              <ChipConfianza nivel={ficha.nivelConfianzaGeneral ?? 'MEDIA'} />
            </div>

            <div className="grupo-acciones" style={{ margin: '1.1rem 0' }}>
              <IconButton icono={PhoneCall} etiqueta="Marcar como contactado" variante="primario" onClick={() => marcar('contactado')} />
              <IconButton icono={X} etiqueta="Descartar" variante="peligro" onClick={() => marcar('descartado')} />
            </div>

            {Object.entries(ficha.atributos).length > 0 && (
              <div className="card-seccion">
                <h3>Datos adicionales</h3>
                <div className="lista-simple" style={{ marginTop: '0.6rem' }}>
                  {Object.entries(ficha.atributos).map(([clave, dato]) => (
                    <div className="item" key={clave}>
                      <span><strong style={{ textTransform: 'capitalize' }}>{clave}:</strong> {dato.valor}</span>
                      <span className="meta">
                        <ChipConfianza
                          nivel={dato.nivelConfianza}
                          titulo={`Fuente: ${dato.fuente.nombre} · Verificado: ${new Date(dato.fechaVerificacion).toLocaleString()}`}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ficha.registrosComercioExterior.length > 0 && (
              <div className="card-seccion">
                <h3>Comercio exterior</h3>
                <div className="lista-simple" style={{ marginTop: '0.6rem' }}>
                  {ficha.registrosComercioExterior.map((r) => (
                    <div className="item" key={r.id}>
                      <span>{r.tipoOperacion}: {r.productoDescripcion} ({r.paisOrigen} → {r.paisDestino})</span>
                      <span className="meta"><ChipConfianza nivel={r.nivelConfianza} /> {r.fuente.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ficha.contactos.length > 0 && (
              <div className="card-seccion">
                <h3>Contactos</h3>
                <div className="lista-simple" style={{ marginTop: '0.6rem' }}>
                  {ficha.contactos.map((c) => (
                    <div className="item" key={c.id}>
                      <span>{c.nombre} {c.cargo && `- ${c.cargo}`}</span>
                      <span className="meta">{c.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-seccion">
              <h3>Actividad reciente</h3>
              <div className="lista-simple" style={{ marginTop: '0.6rem' }}>
                {ficha.interaccionesRecientes.map((i) => (
                  <div className="item" key={i.id}>
                    <span>{i.tipoAccion} por {i.usuario.nombre}</span>
                    <span className="meta">{new Date(i.fecha).toLocaleString()}{i.comentario && ` — ${i.comentario}`}</span>
                  </div>
                ))}
                {ficha.interaccionesRecientes.length === 0 && <p className="vacio">Sin actividad todavia.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
