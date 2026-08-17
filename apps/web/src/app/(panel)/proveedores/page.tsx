'use client';

import { useEffect, useState } from 'react';
import {
  crearInteraccion,
  listarEmpresas,
  obtenerFichaEmpresa,
  type EmpresaResumen,
  type FichaEmpresa,
} from '@/lib/api';

const ROLES_PROVEEDOR = ['proveedor_transportista', 'proveedor_aduanal', 'proveedor_bodega'];
const ETIQUETA_ROL: Record<string, string> = {
  proveedor_transportista: 'Transporte terrestre',
  proveedor_aduanal: 'Agente aduanal',
  proveedor_bodega: 'Bodega/Almacen',
};

// Documento 003, modulo 3.3 - Entrega 3, con conector simulado (Documento
// 014, seccion 6) mientras el Documento 012-B no apruebe una fuente real.
export default function ProveedoresPage() {
  const [tipoServicio, setTipoServicio] = useState('');
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([]);
  const [ficha, setFicha] = useState<FichaEmpresa | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buscar() {
    try {
      setError(null);
      const rolesABuscar = tipoServicio ? [tipoServicio] : ROLES_PROVEEDOR;
      const resultados = await Promise.all(rolesABuscar.map((rol) => listarEmpresas({ rol })));
      setEmpresas(resultados.flatMap((r) => r.datos));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar proveedores.');
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

  async function evaluar(tipoAccion: 'contactado' | 'evaluado' | 'descartado') {
    if (!ficha) return;
    try {
      await crearInteraccion(ficha.id, { tipoAccion });
      await abrirFicha(ficha.id);
      buscar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la evaluacion.');
    }
  }

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <h1>Proveedores Logisticos</h1>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <div style={{ marginBottom: '1rem' }}>
          <select value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)}>
            <option value="">Todos los tipos</option>
            {ROLES_PROVEEDOR.map((r) => (
              <option key={r} value={r}>{ETIQUETA_ROL[r]}</option>
            ))}
          </select>{' '}
          <button onClick={buscar}>Buscar</button>
        </div>

        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Empresa</th>
              <th align="left">Tipo</th>
              <th align="left">Pais</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} style={{ borderTop: '1px solid #eee', cursor: 'pointer' }} onClick={() => abrirFicha(e.id)}>
                <td>{e.nombreLegal}</td>
                <td>{ETIQUETA_ROL[e.roles[0]?.rol] ?? e.roles[0]?.rol}</td>
                <td>{e.pais}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ficha && (
        <div style={{ flex: 1, borderLeft: '1px solid #ddd', paddingLeft: '1.5rem' }}>
          <h2>{ficha.nombreLegal}</h2>
          {ficha.proveedorPerfil && (
            <>
              <p>
                {ETIQUETA_ROL[`proveedor_${ficha.proveedorPerfil.tipoServicio === 'transporte_terrestre' ? 'transportista' : ficha.proveedorPerfil.tipoServicio === 'agente_aduanal' ? 'aduanal' : 'bodega'}`]}
                {' '}&middot; {ficha.proveedorPerfil.zonaCobertura}
              </p>
              <p>
                Estado de evaluacion: <strong>{ficha.proveedorPerfil.estadoEvaluacion}</strong>
              </p>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
            <button onClick={() => evaluar('contactado')}>Contactar</button>
            <button onClick={() => evaluar('evaluado')}>Aprobar (marcar evaluado)</button>
            <button onClick={() => evaluar('descartado')}>Descartar</button>
          </div>

          {ficha.contactos.length > 0 && (
            <>
              <h3>Contactos</h3>
              <ul>
                {ficha.contactos.map((c) => (
                  <li key={c.id}>{c.nombre} {c.cargo && `- ${c.cargo}`} {c.email}</li>
                ))}
              </ul>
            </>
          )}

          <h3>Actividad reciente</h3>
          <ul>
            {ficha.interaccionesRecientes.map((i) => (
              <li key={i.id}>
                {i.tipoAccion} por {i.usuario.nombre} el {new Date(i.fecha).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
