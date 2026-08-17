'use client';

import { useEffect, useState } from 'react';
import { PhoneCall, Check, X } from 'lucide-react';
import {
  crearInteraccion,
  listarEmpresas,
  obtenerFichaEmpresa,
  type EmpresaResumen,
  type FichaEmpresa,
} from '@/lib/api';
import { IconButton } from '@/components/IconButton';

const ROLES_PROVEEDOR = ['proveedor_transportista', 'proveedor_aduanal', 'proveedor_bodega'];
const ETIQUETA_ROL: Record<string, string> = {
  proveedor_transportista: 'Transporte terrestre',
  proveedor_aduanal: 'Agente aduanal',
  proveedor_bodega: 'Bodega/Almacen',
};
const ETIQUETA_ESTADO: Record<string, string> = {
  nuevo: 'Nuevo',
  en_evaluacion: 'En evaluacion',
  aprobado: 'Aprobado',
  descartado: 'Descartado',
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
  }, [tipoServicio]);

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
    <div className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Proveedores Logisticos</h1>
          <p>Transportistas, agentes aduanales y bodegas (Documento 003, modulo 3.3).</p>
        </div>
      </div>

      {error && <p style={{ color: 'var(--color-peligro)' }}>{error}</p>}

      <div className="diseno-lista-detalle">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--espacio-4)' }}>
          <div className="barra-herramientas">
            <select value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)}>
              <option value="">Todos los tipos</option>
              {ROLES_PROVEEDOR.map((r) => (
                <option key={r} value={r}>{ETIQUETA_ROL[r]}</option>
              ))}
            </select>
          </div>

          <div className="contenedor-tabla">
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Tipo</th>
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
                    <td>{ETIQUETA_ROL[e.roles[0]?.rol] ?? e.roles[0]?.rol}</td>
                    <td>{e.pais}</td>
                  </tr>
                ))}
                {empresas.length === 0 && <tr><td colSpan={3} className="vacio">Sin resultados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {ficha && (
          <div className="card">
            <h2>{ficha.nombreLegal}</h2>
            {ficha.proveedorPerfil && (
              <>
                <p style={{ color: 'var(--texto-secundario)', marginTop: '0.2rem' }}>
                  {ETIQUETA_ROL[`proveedor_${ficha.proveedorPerfil.tipoServicio === 'transporte_terrestre' ? 'transportista' : ficha.proveedorPerfil.tipoServicio === 'agente_aduanal' ? 'aduanal' : 'bodega'}`]}
                  {' '}&middot; {ficha.proveedorPerfil.zonaCobertura}
                </p>
                <span className="chip-estado" style={{ marginTop: '0.6rem' }}>
                  {ETIQUETA_ESTADO[ficha.proveedorPerfil.estadoEvaluacion] ?? ficha.proveedorPerfil.estadoEvaluacion}
                </span>
              </>
            )}

            <div className="grupo-acciones" style={{ margin: '1.1rem 0' }}>
              <IconButton icono={PhoneCall} etiqueta="Contactar" onClick={() => evaluar('contactado')} />
              <IconButton icono={Check} etiqueta="Aprobar (marcar evaluado)" variante="primario" onClick={() => evaluar('evaluado')} />
              <IconButton icono={X} etiqueta="Descartar" variante="peligro" onClick={() => evaluar('descartado')} />
            </div>

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
                    <span className="meta">{new Date(i.fecha).toLocaleString()}</span>
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
