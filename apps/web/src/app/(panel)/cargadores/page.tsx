'use client';

import { useEffect, useState } from 'react';
import {
  crearInteraccion,
  listarEmpresas,
  obtenerFichaEmpresa,
  type EmpresaResumen,
  type FichaEmpresa,
} from '@/lib/api';
import { ChipConfianza } from '@/components/ChipConfianza';

// Documento 006, secciones 4.1 (busqueda) y 4.2 (ficha de empresa) - Entrega
// 2, con datos del conector simulado (Documento 014, seccion 6) mientras
// ninguna fuente real tenga aprobacion del Documento 012-B.
export default function CargadoresPage() {
  const [sector, setSector] = useState('');
  const [pais, setPais] = useState('');
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([]);
  const [ficha, setFicha] = useState<FichaEmpresa | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ marginBottom: '1rem' }}>Cargadores</h1>
        {error && <p style={{ color: 'var(--color-peligro)', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input placeholder="Sector" value={sector} onChange={(e) => setSector(e.target.value)} />
          <input placeholder="Pais (ISO)" value={pais} onChange={(e) => setPais(e.target.value)} style={{ width: 80 }} />
          <button className="primario" onClick={buscar}>Buscar</button>
        </div>

        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Empresa</th>
              <th align="left">Sector</th>
              <th align="left">Pais</th>
              <th align="left">Confianza</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => abrirFicha(e.id)}>
                <td>{e.nombreLegal}</td>
                <td>{e.sector}</td>
                <td>{e.pais}</td>
                <td><ChipConfianza nivel={e.nivelConfianzaGeneral ?? 'MEDIA'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ficha && (
        <div className="card" style={{ flex: 1, alignSelf: 'flex-start' }}>
          <h2>{ficha.nombreLegal}</h2>
          <p style={{ color: 'var(--texto-secundario)', margin: '0.4rem 0 1rem' }}>
            {ficha.sector} &middot; {ficha.pais} &middot; <ChipConfianza nivel={ficha.nivelConfianzaGeneral ?? 'MEDIA'} />
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
            <button className="primario" onClick={() => marcar('contactado')}>Marcar como contactado</button>
            <button onClick={() => marcar('descartado')}>Descartar</button>
          </div>

          {Object.entries(ficha.atributos).length > 0 && (
            <>
              <h3>Datos adicionales</h3>
              <ul>
                {Object.entries(ficha.atributos).map(([clave, dato]) => (
                  <li key={clave}>
                    <strong>{clave}:</strong> {dato.valor}{' '}
                    <ChipConfianza
                      nivel={dato.nivelConfianza}
                      titulo={`Fuente: ${dato.fuente.nombre} · Verificado: ${new Date(dato.fechaVerificacion).toLocaleString()}`}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 style={{ marginTop: '1rem' }}>Comercio exterior</h3>
          <ul>
            {ficha.registrosComercioExterior.map((r) => (
              <li key={r.id}>
                {r.tipoOperacion}: {r.productoDescripcion} ({r.paisOrigen} → {r.paisDestino}){' '}
                <ChipConfianza nivel={r.nivelConfianza} /> <em>({r.fuente.nombre})</em>
              </li>
            ))}
          </ul>

          {ficha.contactos.length > 0 && (
            <>
              <h3 style={{ marginTop: '1rem' }}>Contactos</h3>
              <ul>
                {ficha.contactos.map((c) => (
                  <li key={c.id}>{c.nombre} {c.cargo && `- ${c.cargo}`} {c.email}</li>
                ))}
              </ul>
            </>
          )}

          <h3 style={{ marginTop: '1rem' }}>Actividad reciente</h3>
          <ul>
            {ficha.interaccionesRecientes.map((i) => (
              <li key={i.id}>
                {i.tipoAccion} por {i.usuario.nombre} el {new Date(i.fecha).toLocaleString()}
                {i.comentario && ` — ${i.comentario}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
