'use client';

import { useEffect, useState } from 'react';
import { listarEmpresas, obtenerFichaEmpresa, type EmpresaResumen, type FichaEmpresa } from '@/lib/api';

// Documento 003, modulo 3.2 - Entrega 3, con conector simulado (Documento
// 014, seccion 6) mientras el Documento 012-B no apruebe una fuente real.
export default function CompetidoresPage() {
  const [empresas, setEmpresas] = useState<EmpresaResumen[]>([]);
  const [ficha, setFicha] = useState<FichaEmpresa | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function abrirFicha(id: string) {
    try {
      setFicha(await obtenerFichaEmpresa(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la ficha.');
    }
  }

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <h1>Competidores</h1>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Empresa</th>
              <th align="left">Pais</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} style={{ borderTop: '1px solid #eee', cursor: 'pointer' }} onClick={() => abrirFicha(e.id)}>
                <td>{e.nombreLegal}</td>
                <td>{e.pais}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ficha && (
        <div style={{ flex: 1, borderLeft: '1px solid #ddd', paddingLeft: '1.5rem' }}>
          <h2>{ficha.nombreLegal}</h2>
          {ficha.competidorPerfil && (
            <>
              <p>{ficha.competidorPerfil.tipo} &middot; {ficha.competidorPerfil.coberturaGeografica}</p>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>
                Ultimo monitoreo: {ficha.competidorPerfil.fechaUltimoMonitoreo && new Date(ficha.competidorPerfil.fechaUltimoMonitoreo).toLocaleString()}
              </p>

              <h3>Alertas de cambios</h3>
              <ul>
                {ficha.competidorPerfil.cambios.map((c) => (
                  <li key={c.id}>
                    <strong>{c.tipoCambio}:</strong> {c.descripcion}{' '}
                    <span style={{ color: '#888' }}>({new Date(c.fechaDeteccion).toLocaleDateString()})</span>
                  </li>
                ))}
                {ficha.competidorPerfil.cambios.length === 0 && <li>Sin cambios detectados todavia.</li>}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
