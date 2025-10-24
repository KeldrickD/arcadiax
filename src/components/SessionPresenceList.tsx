"use client";

import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type SessionItem = { id: string; status: string; game?: { id: string; name: string; type: string } };

export function SessionPresenceList({ experienceId, sessions, initialCounts }: { experienceId: string; sessions: SessionItem[]; initialCounts?: Record<string, number> }) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts ?? {});
  const channelsRef = useRef<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    // Subscribe to presence for each session; do not track to avoid inflating counts
    for (const s of sessions) {
      const ch = supabase.channel(`presence_session_${s.id}`, { config: { presence: { key: `observer_${Math.random().toString(36).slice(2)}` } } });
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        let n = 0;
        for (const k in state) n += (state as any)[k].length;
        setCounts(prev => ({ ...prev, [s.id]: n }));
      });
      ch.subscribe();
      channelsRef.current.push(ch);
    }
    setLoading(false);
    return () => {
      for (const ch of channelsRef.current) supabase.removeChannel(ch);
      channelsRef.current = [];
    };
  }, [sessions]);

  if (loading) return <div style={{ opacity: 0.6, fontSize: 12 }}>Loading sessions…</div>;
  if (!sessions.length) return <div style={{ opacity: 0.6, fontSize: 12 }}>No sessions yet</div>;

  return (
    <ul>
      {sessions.map((s) => (
        <li key={s.id} title={`Status: ${s.status} — Live: ${counts[s.id] ?? 0}`}>
          <a href={`/experience/${experienceId}/session/${s.id}`}>{s.game?.name ?? 'Session'} — {s.status}</a>
          <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>Live: {counts[s.id] ?? 0}</span>
          {s.status !== 'lobby' && (<span style={{ marginLeft: 8, fontSize: 12, color: '#eab308' }}>Entry closed</span>)}
        </li>
      ))}
    </ul>
  );
}


