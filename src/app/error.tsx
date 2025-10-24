'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div style={{ minHeight: '60svh', display: 'grid', placeItems: 'center', color: '#fff', background: '#0A0A0F', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: 'rgba(255,255,255,0.75)' }}>Please try again. If the issue persists, contact support.</p>
        <button onClick={() => reset()} style={{ marginTop: 16, color: '#0A0A0F', background: 'linear-gradient(90deg,#7C3AED,#00E0FF)', padding: '10px 14px', borderRadius: 10, fontWeight: 700 }}>Try again</button>
      </div>
    </div>
  );
}


