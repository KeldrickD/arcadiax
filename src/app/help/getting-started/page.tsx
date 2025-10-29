"use client";

export const dynamic = "force-dynamic";

export default function GettingStartedPage() {
  return (
    <main style={{ padding: 24 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <a href="#" onClick={(e)=>{ e.preventDefault(); if (history.length>1) history.back(); else window.location.href='/dashboard'; }} style={{ textDecoration:'none', color:'#00E0FF' }}>← Back</a>
        <a href="/dashboard" style={{ textDecoration:'none', marginLeft:8 }}>Dashboard</a>
        <a href="/experience" style={{ textDecoration:'none', marginLeft:8 }}>Experience</a>
      </div>
      <h1>Getting started</h1>
      <ol style={{ marginTop: 12 }}>
        <li>Ensure your Whop app passes an auth token to the iframe (we auto-detect).</li>
        <li>Go to Dashboard → Sessions to create and manage sessions.</li>
        <li>Open Experience to preview what members see and to share session links.</li>
        <li>Use Wallet to add credits for testing purchases.</li>
      </ol>
      <p style={{ marginTop: 12 }}>Need help? Email support@arcadiax.games.</p>
    </main>
  );
}


