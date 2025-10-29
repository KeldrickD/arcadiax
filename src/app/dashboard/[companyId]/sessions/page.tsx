"use client";

import { useEffect, useState } from 'react';

export default function SessionsAdmin({ params }: { params: { companyId: string } }) {
  const { companyId } = params;
  const [canManage] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [table, setTable] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const r = await fetch(`/api/sessions?accountId=${companyId}`); const j = await r.json();
    setSessionId(j.items?.[0]?.id ?? '');
  })(); }, [companyId]);

  const load = async () => {
    if (!sessionId) return; setLoading(true);
    const r = await fetch(`/api/admin/rounds?sessionId=${sessionId}`); const j = await r.json();
    setData(j); setLoading(false);
  };

  useEffect(() => { load(); }, [sessionId]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Sessions Admin</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12 }}>Session</span>
        <input value={sessionId} onChange={e=>setSessionId(e.target.value)} placeholder="sessionId" style={{ padding: 6, border: '1px solid #333', borderRadius: 8, minWidth: 420 }} />
        <button onClick={load} style={{ padding: '6px 10px', borderRadius: 8, background: '#00E0FF' }}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
        <section style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
          <h3>Sessions table</h3>
          <SessionsTable companyId={companyId} />
        </section>
        {canManage && (
        <section style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
          <h3>Active Round</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data?.active ?? null, null, 2)}</pre>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={async ()=>{ await fetch(`/api/sessions/${sessionId}/rounds/close`, { method:'POST' }); setToast('Closed'); setTimeout(()=>setToast(null), 1500); load(); }} style={{ padding: '6px 10px', borderRadius: 8, background: '#ffbe0b' }}>Close & Settle</button>
            <button onClick={async ()=>{ await fetch('/api/creator/rounds/queue/batch', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ sessionId, count: 5, gapSec: 30 }) }); setToast('Queued best-of-5'); setTimeout(()=>setToast(null), 1500); load(); }} style={{ padding: '6px 10px', borderRadius: 8, background: '#7C3AED', color: '#fff' }}>Start schedule (best-of-5)</button>
          </div>
        </section>
        )}

        <section style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
          <h3>Queued Rounds</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data?.queue ?? [], null, 2)}</pre>
        </section>

        <section style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
          <h3>Completed Rounds</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data?.completed ?? [], null, 2)}</pre>
        </section>
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, background: '#1A1B23', color: '#F8FAFC', padding: '10px 14px', borderRadius: 8 }}>{toast}</div>
      )}
    </div>
  );
}

function SessionsTable({ companyId }: { companyId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const load = async () => {
    setLoading(true);
    const qs = new URLSearchParams({ accountId: companyId, page: String(page) });
    if (status) qs.set('status', status);
    if (type) qs.set('type', type);
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const r = await fetch(`/api/admin/sessions?${qs.toString()}`);
    const j = await r.json(); setRows(j.items ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [companyId]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={load} style={{ padding: '6px 10px', borderRadius: 8, background: '#00E0FF' }}>{loading ? 'Loading…' : 'Refresh'}</button>
        <a href={`/api/admin/sessions/export?accountId=${companyId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`} style={{ padding: '6px 10px', borderRadius: 8, background: '#1A1B23', color: '#F8FAFC', textDecoration: 'none' }}>Export CSV</a>
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{ padding: 6, border: '1px solid #333', borderRadius: 8 }}>
          <option value="">All statuses</option>
          <option value="lobby">lobby</option>
          <option value="live">live</option>
          <option value="closed">closed</option>
          <option value="settled">settled</option>
        </select>
        <select value={type} onChange={e=>setType(e.target.value)} style={{ padding: 6, border: '1px solid #333', borderRadius: 8 }}>
          <option value="">All types</option>
          <option value="trivia">trivia</option>
          <option value="prediction">prediction</option>
          <option value="raffle">raffle</option>
          <option value="spin">spin</option>
        </select>
        <input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} style={{ padding: 6, border: '1px solid #333', borderRadius: 8 }} />
        <input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} style={{ padding: 6, border: '1px solid #333', borderRadius: 8 }} />
        <button onClick={()=>{ setPage(1); load(); }} style={{ padding: '6px 10px', borderRadius: 8 }}>Apply</button>
      </div>
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #333' }}>Session</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #333' }}>Game</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #333' }}>Type</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #333' }}>Status</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #333' }}>Entry</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #333' }}>Joined</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #333' }}>Created</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #333' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ padding: 8, borderBottom: '1px solid #222' }}>{r.id.slice(0,8)}…</td>
                <td style={{ padding: 8, borderBottom: '1px solid #222' }}>{r.gameName}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #222' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 9999,
                    background: r.gameType === 'trivia' ? '#1f2937' : r.gameType === 'prediction' ? '#0f766e' : r.gameType === 'raffle' ? '#7c2d12' : '#3f3f46',
                    color: '#e5e7eb', fontSize: 12
                  }}>{r.gameType}</span>
                </td>
                <td style={{ padding: 8, borderBottom: '1px solid #222' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 9999,
                    background: r.status === 'lobby' ? '#1e293b' : r.status === 'live' ? '#14532d' : r.status === 'closed' ? '#78350f' : '#111827',
                    color: '#e5e7eb', fontSize: 12
                  }}>{r.status}</span>
                </td>
                <td style={{ padding: 8, borderBottom: '1px solid #222' }}>{r.entryCost}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #222' }}>{r.joined}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #222' }}>{new Date(r.createdAt).toLocaleString()}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #222' }}>
                  {r.status === 'lobby' && (
                    <button onClick={async ()=>{ await fetch(`/api/sessions/${r.id}/rounds/start`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ type:'trivia', question:'Quick start?', options:[{id:'a',label:'No'},{id:'b',label:'Yes'}], answerId:'b', durationSec: 15 }) }); setTimeout(load, 800); }} style={{ padding: '4px 8px', borderRadius: 6, background: '#7C3AED', color:'#fff' }}>Start</button>
                  )}
                  {r.status === 'live' && (
                    <button onClick={async ()=>{ await fetch(`/api/sessions/${r.id}/rounds/close`, { method:'POST' }); setTimeout(load, 800); }} style={{ padding: '4px 8px', borderRadius: 6, background: '#ffbe0b' }}>Close</button>
                  )}
                  {(r.status === 'lobby' || r.status === 'live') && (
                    <button onClick={async ()=>{ if (!confirm('Cancel this session? If live, entrants will be refunded.')) return; await fetch(`/api/sessions/${r.id}/cancel`, { method:'POST' }); setTimeout(load, 800); }} style={{ marginLeft: 6, padding: '4px 8px', borderRadius: 6, background: '#dc2626', color:'#fff' }}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, display:'flex', gap:8 }}>
        <button disabled={page<=1} onClick={()=>{ setPage(p=>Math.max(1, p-1)); load(); }} style={{ padding:'6px 10px', borderRadius:8 }}>Prev</button>
        <button onClick={()=>{ setPage(p=>p+1); load(); }} style={{ padding:'6px 10px', borderRadius:8 }}>Next</button>
      </div>
    </div>
  );
}


