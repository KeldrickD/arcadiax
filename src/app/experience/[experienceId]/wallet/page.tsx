"use client";

import { useEffect, useState } from 'react';

export default function WalletPage({ params }: { params: { experienceId: string } }) {
  const { experienceId } = params;
  const [balance, setBalance] = useState<number>(0);
  const [ledger, setLedger] = useState<any[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [topupBusy, setTopupBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // Dev: fetch first member for this account via wallet API using memberId from server created dev member
    // For demo simplicity, call a helper endpoint to discover a memberId (fallback to query param if provided)
    (async () => {
      const memberId = new URLSearchParams(window.location.search).get('memberId');
      let mid = memberId ?? '';
      if (!mid) {
        // naive fetch of any member in this account (dev only)
        const r = await fetch(`/api/members?accountId=${experienceId}`);
        const j = await r.json();
        mid = j.items?.[0]?.id ?? '';
      }
      if (!mid) return;
      setMemberId(mid);
      const w = await fetch(`/api/wallet?memberId=${mid}`);
      const jw = await w.json();
      setBalance(jw.balance ?? 0);
      setLedger(jw.ledger ?? []);
    })();
  }, [experienceId]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Wallet</h2>
      <p>Account: {experienceId}</p>
      <div style={{ marginTop: 12, padding: 12, border: '1px solid #333', borderRadius: 8 }}>
        <p style={{ fontWeight: 600 }}>Balance: {balance} credits</p>
        <a href="#" onClick={async (e) => {
          e.preventDefault();
          if (!memberId || topupBusy) return;
          setTopupBusy(true);
          try {
            const r = await fetch('/api/wallet/topup', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ memberId, credits: 50, usd: 5 }),
            });
            const j = await r.json().catch(()=>({}));
            if (!r.ok || !j.ok) throw new Error(j.error || 'Top-up failed');
            setBalance(balance + 50);
            setToast('Credits added: +50');
            setTimeout(()=>setToast(null), 3000);
            // refresh ledger
            const w = await fetch(`/api/wallet?memberId=${memberId}`);
            const jw = await w.json();
            setLedger(jw.ledger ?? []);
          } catch (err: any) {
            setToast(err?.message ?? 'Top-up error');
            setTimeout(()=>setToast(null), 3000);
          } finally {
            setTopupBusy(false);
          }
        }} style={{ display: 'inline-block', marginTop: 8, background: '#7C3AED', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>{topupBusy ? 'Adding…' : 'Buy credits (+50)'}</a>
      </div>
      <div style={{ marginTop: 16 }}>
        <h3>Recent activity</h3>
        <ul>
          {ledger.map(item => (
            <li key={item.id} style={{ fontFamily: 'monospace' }}>
              {new Date(item.created_at).toLocaleString()} — {item.type} — {item.amount}
            </li>
          ))}
        </ul>
      </div>
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, background: '#1A1B23', color: '#F8FAFC', padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>{toast}</div>
      )}
    </div>
  );
}


