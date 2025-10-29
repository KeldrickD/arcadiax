"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CreatorNav({ accountId }: { accountId: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/dashboard/${accountId}`, label: 'Overview' },
    { href: `/dashboard/${accountId}/sessions`, label: 'Sessions' },
    { href: `/experience/${accountId}`, label: 'Experience' },
    { href: `/experience/${accountId}/wallet`, label: 'Wallet' },
    { href: `/help/getting-started`, label: 'Help' },
  ];
  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {items.map(it => (
          <Link key={it.href} href={it.href} style={{
            color: pathname?.startsWith(it.href) ? '#00E0FF' : 'rgba(255,255,255,0.9)',
            textDecoration: 'none',
            fontWeight: pathname?.startsWith(it.href) ? 700 : 500,
          }}>
            {it.label}
          </Link>
        ))}
      </div>
      <a href="#create-game" style={{ textDecoration:'none', color:'#0A0A0F', background:'linear-gradient(90deg,#7C3AED,#00E0FF)', padding:'6px 10px', borderRadius:8, fontWeight:700 }}>+ New Game</a>
    </nav>
  );
}


