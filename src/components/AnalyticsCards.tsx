"use client";

import { useEffect, useState } from 'react';

export function AnalyticsCards({ accountId }: { accountId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/analytics?accountId=${accountId}`);
    const j = await r.json(); setData(j); setLoading(false);
  })(); }, [accountId]);

  const Card = ({ title, value, suffix='' }: any) => (
    <div style={{ padding: 12, border: '1px solid #333', borderRadius: 12, background: '#0A0A0F' }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{loading ? '…' : `${value}${suffix}`}</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', marginTop: 16 }}>
      <Card title="Entries" value={data?.entriesTotal ?? 0} />
      <Card title="Credits sold" value={data?.creditsSold ?? 0} />
      <Card title="GMV (USD)" value={Number(data?.gmvUsd ?? 0).toFixed(2)} />
      <Card title="Rake (credits)" value={data?.rakeCredits ?? 0} />
      <Card title="DAU" value={data?.dau ?? 0} />
      <Card title="WAU" value={data?.wau ?? 0} />
      <Card title="ARPPU (USD)" value={Number(data?.arppu ?? 0).toFixed(2)} />
    </div>
  );
}


