"use client";

import { useEffect, useState } from 'react';

export default function IapConfirm() {
  const [status, setStatus] = useState<'pending'|'confirmed'|'error'>('pending');
  const [message, setMessage] = useState<string>('Processing purchase...');

  useEffect(() => {
    const u = new URLSearchParams(window.location.search);
    const txn = u.get('txn');
    const event = u.get('event') || 'purchase.succeeded';
    if (!txn) { setStatus('error'); setMessage('Missing transaction id'); return; }
    (async () => {
      try {
        const r = await fetch(`/api/iap/webhook?event=${encodeURIComponent(event)}&txn=${encodeURIComponent(txn)}`);
        const j = await r.json();
        if (!r.ok || j.error) throw new Error(j.error || 'Webhook failed');
        setStatus('confirmed'); setMessage('Purchase confirmed. You can close this tab.');
      } catch (e: any) {
        setStatus('error'); setMessage(e?.message ?? 'Error confirming');
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Checkout</h2>
      <p>{message}</p>
    </div>
  );
}


