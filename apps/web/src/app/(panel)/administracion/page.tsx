'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { AreaUsuario } from '@loges-biap/shared-types';
import { Plus, Power, Check } from 'lucide-react';
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
import { IconButton } from '@/components/IconButton';

const AREAS: AreaUsuario[] = [
  'comercial',
  'gerencia_comercial',
  'operaciones_compras',
  'direccion_general',
  'administrador',
];

const ETIQUETA_ESTADO_EJECUCION: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completado: 'Completado',
  fallido: 'Fallido',
};

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
    <div className="pagina">
      <div className="encabezado-pagina">
        <div>
          <h1>Administracion</h1>
          <p>Usuarios, fuentes y monitor del Motor de Agentes (Documento 006, seccion 7).</p>
        </div>
      </div>

      {error && <p style={{ color: 'var(--color-peligro)' }}>{error}</p>}

      <div className="card">
        <h2>Usuarios</h2>

        <form onSubmit={onCrearUsuario} className="barra-herramientas" style={{ margin: '1rem 0' }}>
          <input name="nombre" placeholder="Nombre" required />
          <input name="email" type="email" placeholder="Correo" required />
          <input name="password" type="password" placeholder="Contrasena inicial" required minLength={8} />
          <select name="area" required defaultValue="">
            <option value="" disabled>Area</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <IconButton icono={Plus} etiqueta="Crear usuario" variante="primario" tipo="submit" />
        </form>

        <div className="contenedor-tabla">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Area</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="fila-empresa">
                      <span className="avatar">{u.nombre.slice(0, 2).toUpperCase()}</span>
                      <strong>{u.nombre}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.area} onChange={(e) => onCambiarArea(u.id, e.target.value as AreaUsuario)}>
                      {AREAS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="chip-estado">{u.activo ? 'Activo' : 'Inactivo'}</span>
                    <IconButton
                      icono={Power}
                      etiqueta={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                      variante={u.activo ? 'peligro' : 'primario'}
                      onClick={() => onToggleActivo(u)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Fuentes</h2>
        <p style={{ color: 'var(--texto-secundario)', marginTop: '0.2rem' }}>
          Ninguna fuente puede activarse sin aprobacion legal (Documento 012-B) — el backend lo rechaza aunque se intente desde aqui.
        </p>

        <form onSubmit={onCrearFuente} className="barra-herramientas" style={{ margin: '1rem 0' }}>
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
          <input name="pais" placeholder="Pais (ISO)" required style={{ width: 90 }} />
          <select name="nivelConfianzaBase" required defaultValue="">
            <option value="" disabled>Confianza base</option>
            <option value="ALTA">ALTA</option>
            <option value="MEDIA">MEDIA</option>
            <option value="BAJA">BAJA</option>
          </select>
          <IconButton icono={Plus} etiqueta="Registrar fuente candidata" variante="primario" tipo="submit" />
        </form>

        <div className="contenedor-tabla">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Pais</th>
                <th>Estado</th>
                <th>Aprobacion</th>
              </tr>
            </thead>
            <tbody>
              {fuentes.map((f) => (
                <tr key={f.id}>
                  <td>{f.nombre}</td>
                  <td>{f.pais}</td>
                  <td>
                    <span className="chip-estado">
                      {f.activa ? 'Activa' : f.terminosUsoVerificados ? 'Aprobada, inactiva' : 'Pendiente de aprobacion'}
                    </span>
                  </td>
                  <td>
                    {f.terminosUsoVerificados ? (
                      <span style={{ color: 'var(--texto-secundario)' }}>{f.aprobadoPor} &middot; {f.referenciaLegal}</span>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          onAprobarYActivar(f.id, new FormData(e.currentTarget));
                        }}
                        style={{ display: 'flex', gap: '0.4rem' }}
                      >
                        <input name="aprobadoPor" placeholder="Aprobado por" required size={14} />
                        <input name="referenciaLegal" placeholder="Referencia legal" required size={14} />
                        <IconButton icono={Check} etiqueta="Aprobar y activar" variante="primario" tipo="submit" />
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Monitor del Motor de Agentes</h2>
        <div className="contenedor-tabla" style={{ marginTop: '1rem' }}>
          <table>
            <thead>
              <tr>
                <th>Tipo de tarea</th>
                <th>Estado</th>
                <th>Resultado</th>
                <th>Inicio</th>
              </tr>
            </thead>
            <tbody>
              {ejecuciones.map((e) => (
                <tr key={e.id}>
                  <td>{e.tipoTarea}</td>
                  <td><span className="chip-estado">{ETIQUETA_ESTADO_EJECUCION[e.estado] ?? e.estado}</span></td>
                  <td style={{ color: 'var(--texto-secundario)' }}>{e.resultadoResumen ?? '—'}</td>
                  <td>{new Date(e.fechaInicio).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
