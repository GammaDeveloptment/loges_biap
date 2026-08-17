'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { NAVEGACION } from '@/lib/navegacion';
import { cerrarSesion, obtenerSesion, type Sesion } from '@/lib/session';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav
        style={{
          width: 240,
          background: 'var(--loges-azul-marino)',
          color: '#e8ecf3',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
      >
        <div style={{ marginBottom: '1.5rem', paddingLeft: '0.25rem' }}>
          <Image src="/loges-claro.png" alt="Loges" width={120} height={40} style={{ height: 28, width: 'auto' }} priority />
        </div>

        {itemsVisibles.map((item) => {
          const activo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '0.55rem 0.75rem',
                borderRadius: 8,
                background: activo ? 'var(--loges-verde-menta)' : 'transparent',
                color: activo ? '#04261a' : '#e8ecf3',
                fontWeight: activo ? 600 : 400,
              }}
            >
              {item.etiqueta}
            </Link>
          );
        })}

        <div style={{ marginTop: 'auto', fontSize: '0.85rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontWeight: 600 }}>{sesion.usuario.nombre}</div>
          <div style={{ color: '#9aa5b8', marginBottom: '0.6rem' }}>{sesion.usuario.area}</div>
          <button
            onClick={() => {
              cerrarSesion();
              router.replace('/login');
            }}
            style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.3)', color: '#e8ecf3', width: '100%' }}
          >
            Cerrar sesion
          </button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: '2rem', background: 'var(--background)' }}>{children}</main>
    </div>
  );
}
