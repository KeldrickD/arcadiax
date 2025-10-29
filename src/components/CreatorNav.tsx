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
  ];
  return (
    <nav style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
      {items.map(it => (
        <Link key={it.href} href={it.href} style={{
          color: pathname?.startsWith(it.href) ? '#00E0FF' : 'rgba(255,255,255,0.9)',
          textDecoration: 'none',
          fontWeight: pathname?.startsWith(it.href) ? 700 : 500,
        }}>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}


