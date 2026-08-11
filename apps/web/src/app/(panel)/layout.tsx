'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NAVEGACION } from '@/lib/navegacion';
import { cerrarSesion, obtenerSesion, type Sesion } from '@/lib/session';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null>(null);

  useEffect(() => {
    const actual = obtenerSesion();
    if (!actual) {
      router.replace('/login');
      return;
    }
    setSesion(actual);
  }, [router]);

  if (!sesion) {
    return null;
  }

  const itemsVisibles = NAVEGACION.filter((item) =>
    item.areas.includes(sesion.usuario.area),
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav
        style={{
          width: 220,
          borderRight: '1px solid #ddd',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <strong>Loges-BIAP</strong>
        {itemsVisibles.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.etiqueta}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: '#666' }}>
          <div>{sesion.usuario.nombre}</div>
          <div>{sesion.usuario.area}</div>
          <button
            onClick={() => {
              cerrarSesion();
              router.replace('/login');
            }}
          >
            Cerrar sesion
          </button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: '1.5rem' }}>{children}</main>
    </div>
  );
}
