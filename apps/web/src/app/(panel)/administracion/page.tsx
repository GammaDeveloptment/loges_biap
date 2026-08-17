'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { AreaUsuario } from '@loges-biap/shared-types';
import {
  actualizarFuente,
  actualizarUsuario,
  crearFuente,
  crearUsuario,
  listarEjecucionesAgente,
  listarFuentes,
  listarUsuarios,
  type EjecucionAgente,
  type Fuente,
  type Usuario,
} from '@/lib/api';

const AREAS: AreaUsuario[] = [
  'comercial',
  'gerencia_comercial',
  'operaciones_compras',
  'direccion_general',
  'administrador',
];

// Documento 006, seccion 7: Usuarios, Fuentes y Monitor del Motor de
// Agentes - las piezas de Administracion que ya tienen datos reales
// (Entrega 1 completa el motor; el registro de fuentes es el paso previo
// a la aprobacion legal del Documento 012-B; usuarios ya tenia API desde
// la Entrega 0).
export default function AdministracionPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [ejecuciones, setEjecuciones] = useState<EjecucionAgente[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function recargar() {
    try {
      const [u, f, e] = await Promise.all([
        listarUsuarios(),
        listarFuentes(),
        listarEjecucionesAgente(),
      ]);
      setUsuarios(u);
      setFuentes(f);
      setEjecuciones(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos.');
    }
  }

  useEffect(() => {
    recargar();
  }, []);

  async function onCrearUsuario(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await crearUsuario({
        nombre: String(form.get('nombre')),
        email: String(form.get('email')),
        password: String(form.get('password')),
        area: form.get('area') as AreaUsuario,
      });
      e.currentTarget.reset();
      recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    }
  }

  async function onCambiarArea(usuarioId: string, area: AreaUsuario) {
    try {
      await actualizarUsuario(usuarioId, { area });
      recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el area.');
    }
  }

  async function onToggleActivo(usuario: Usuario) {
    try {
      await actualizarUsuario(usuario.id, { activo: !usuario.activo });
      recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    }
  }

  async function onCrearFuente(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await crearFuente({
        nombre: String(form.get('nombre')),
        tipo: form.get('tipo') as Fuente['tipo'],
        pais: String(form.get('pais')),
        nivelConfianzaBase: form.get('nivelConfianzaBase') as Fuente['nivelConfianzaBase'],
      });
      e.currentTarget.reset();
      recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la fuente.');
    }
  }

  async function onAprobarYActivar(fuenteId: string, form: FormData) {
    try {
      await actualizarFuente(fuenteId, {
        terminosUsoVerificados: true,
        aprobadoPor: String(form.get('aprobadoPor')),
        fechaAprobacionLegal: new Date().toISOString(),
        referenciaLegal: String(form.get('referenciaLegal')),
        activa: true,
      });
      recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar la fuente.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h1>Administracion</h1>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <section>
        <h2>Usuarios</h2>

        <form onSubmit={onCrearUsuario} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input name="nombre" placeholder="Nombre" required />
          <input name="email" type="email" placeholder="Correo" required />
          <input name="password" type="password" placeholder="Contrasena inicial" required minLength={8} />
          <select name="area" required defaultValue="">
            <option value="" disabled>Area</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button type="submit">Crear usuario</button>
        </form>

        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Nombre</th>
              <th align="left">Correo</th>
              <th align="left">Area</th>
              <th align="left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid #eee' }}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.area} onChange={(e) => onCambiarArea(u.id, e.target.value as AreaUsuario)}>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={() => onToggleActivo(u)}>
                    {u.activo ? '🟢 activo (desactivar)' : '⚪ inactivo (activar)'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Fuentes</h2>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>
          Ninguna fuente puede activarse sin aprobacion legal (Documento 012-B) -
          el backend lo rechaza aunque se intente desde aqui.
        </p>

        <form onSubmit={onCrearFuente} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input name="nombre" placeholder="Nombre de la fuente" required />
          <select name="tipo" required defaultValue="">
            <option value="" disabled>Tipo</option>
            <option value="registro_mercantil">Registro mercantil</option>
            <option value="registro_aduanero">Registro aduanero</option>
            <option value="camara_comercio">Camara de comercio</option>
            <option value="estadistica_comercio_exterior">Estadistica de comercio exterior</option>
            <option value="sitio_publico_corporativo">Sitio publico corporativo</option>
            <option value="otro">Otro</option>
          </select>
          <input name="pais" placeholder="Pais (ISO)" required style={{ width: 80 }} />
          <select name="nivelConfianzaBase" required defaultValue="">
            <option value="" disabled>Confianza base</option>
            <option value="ALTA">ALTA</option>
            <option value="MEDIA">MEDIA</option>
            <option value="BAJA">BAJA</option>
          </select>
          <button type="submit">Registrar fuente candidata</button>
        </form>

        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Nombre</th>
              <th align="left">Pais</th>
              <th align="left">Estado</th>
              <th align="left">Aprobacion</th>
            </tr>
          </thead>
          <tbody>
            {fuentes.map((f) => (
              <tr key={f.id} style={{ borderTop: '1px solid #eee' }}>
                <td>{f.nombre}</td>
                <td>{f.pais}</td>
                <td>
                  {f.activa ? '🟢 activa' : f.terminosUsoVerificados ? '🟡 aprobada, inactiva' : '⚪ pendiente de aprobacion'}
                </td>
                <td>
                  {f.terminosUsoVerificados ? (
                    <span>{f.aprobadoPor} &middot; {f.referenciaLegal}</span>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onAprobarYActivar(f.id, new FormData(e.currentTarget));
                      }}
                      style={{ display: 'flex', gap: '0.25rem' }}
                    >
                      <input name="aprobadoPor" placeholder="Aprobado por" required size={14} />
                      <input name="referenciaLegal" placeholder="Referencia legal" required size={14} />
                      <button type="submit">Aprobar y activar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Monitor del Motor de Agentes</h2>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th align="left">Tipo de tarea</th>
              <th align="left">Estado</th>
              <th align="left">Resultado</th>
              <th align="left">Inicio</th>
            </tr>
          </thead>
          <tbody>
            {ejecuciones.map((e) => (
              <tr key={e.id} style={{ borderTop: '1px solid #eee' }}>
                <td>{e.tipoTarea}</td>
                <td>{e.estado}</td>
                <td>{e.resultadoResumen ?? '—'}</td>
                <td>{new Date(e.fechaInicio).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
