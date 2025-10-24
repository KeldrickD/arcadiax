"use client";

import { useMemo, useState } from 'react';

export function ExportsPanel({ accountId }: { accountId: string }) {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [memberId, setMemberId] = useState<string>('');

  const qs = useMemo(() => {
    const p = new URLSearchParams({ accountId });
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return p.toString();
  }, [accountId, from, to]);

  const ledgerQs = useMemo(() => {
    const p = new URLSearchParams(qs);
    if (memberId) p.set('memberId', memberId);
    return p.toString();
  }, [qs, memberId]);

  return (
    <div style={{ padding: 12, border: '1px solid #333', borderRadius: 12, marginTop: 16 }}>
      <h3>Exports</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12 }}>From</span>
        <input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} style={{ padding: 6, border: '1px solid #333', borderRadius: 8 }} />
        <span style={{ fontSize: 12 }}>To</span>
        <input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} style={{ padding: 6, border: '1px solid #333', borderRadius: 8 }} />
        <span style={{ fontSize: 12 }}>memberId</span>
        <input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder="optional memberId" style={{ padding: 6, border: '1px solid #333', borderRadius: 8, minWidth: 260 }} />
        <a href={`/api/admin/sessions/export?${qs}`} style={{ padding: '6px 10px', borderRadius: 8, background: '#1A1B23', color: '#F8FAFC', textDecoration: 'none' }} title="Export sessions CSV">Sessions CSV</a>
        <a href={`/api/admin/ledger/export?${ledgerQs}`} style={{ padding: '6px 10px', borderRadius: 8, background: '#1A1B23', color: '#F8FAFC', textDecoration: 'none' }} title="Export ledger CSV (optionally filter by memberId)">Ledger CSV</a>
        <a href={`/api/admin/players/export?${qs}`} style={{ padding: '6px 10px', borderRadius: 8, background: '#1A1B23', color: '#F8FAFC', textDecoration: 'none' }} title="Export players CSV">Players CSV</a>
      </div>
    </div>
  );
}


