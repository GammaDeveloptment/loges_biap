'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { login, ApiError } from '@/lib/api';
import { guardarSesion } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const sesion = await login({ email, password });
      guardarSesion(sesion);
      router.push('/inicio');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesion.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--loges-azul-marino)',
      }}
    >
      <div className="card" style={{ width: 380, padding: '2.5rem' }}>
        <Image src="/loges.png" alt="Loges" width={140} height={47} style={{ height: 36, width: 'auto', marginBottom: '1.25rem' }} priority />
        <p style={{ color: 'var(--texto-secundario)', marginBottom: '1.5rem' }}>
          Inteligencia Comercial y Logistica &mdash; Grupo Gammacargo
        </p>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.9rem' }}>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.9rem' }}>
            Contrasena
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
          {error && <p style={{ color: 'var(--color-peligro)' }}>{error}</p>}
          <button type="submit" className="primario" disabled={cargando} style={{ marginTop: '0.5rem' }}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}
