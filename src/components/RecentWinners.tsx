"use client";

import { useEffect, useState } from 'react';

export function RecentWinners({ accountId }: { accountId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    setLoading(true);
    const r = await fetch(`/api/winners/recent?accountId=${accountId}`);
    const j = await r.json(); setItems(j.items ?? []); setLoading(false);
  })(); }, [accountId]);

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Recent winners</h3>
      {loading ? <div style={{ opacity: 0.6, fontSize: 12 }}>Loading winners…</div> : (
        <ul style={{ display: 'grid', gap: 8 }}>
          {items.map((w, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }} title={`+${w.amount} credits`}>
              <img src={w.avatar || '/vercel.svg'} alt="avatar" width={20} height={20} style={{ borderRadius: 9999, opacity: 0.8 }} />
              <span style={{ fontWeight: 600 }}>{w.name}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>+{w.amount} credits</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


