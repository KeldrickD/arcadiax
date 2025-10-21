"use client";

import { useEffect, useRef, useState } from "react";

type Props = { params: { experienceId: string; sessionId: string } };

type SessionInfo = {
  id: string;
  status: string;
  entry_cost: number;
  game?: { id: string; name: string; type: string };
};

export default function SessionPage({ params }: Props) {
  // Next 15 warns about direct params; for client components it's okay to read props directly.
  const { experienceId, sessionId } = params;
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const evtRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      const r = await fetch(`/api/sessions?accountId=${experienceId}`, { cache: "no-store" });
      const j = await r.json();
      const s = (j.items as SessionInfo[] | undefined)?.find(x => x.id === sessionId) ?? null;
      if (!aborted) setSession(s);
    };
    load();
    return () => void (aborted = true);
  }, [experienceId, sessionId]);

  useEffect(() => {
    evtRef.current = new EventSource(`/api/ws/session?sessionId=${sessionId}`);
    evtRef.current.onmessage = (ev) => setEvents(prev => [ev.data as string, ...prev].slice(0, 50));
    return () => evtRef.current?.close();
  }, [sessionId]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Session</h2>
      <p>experienceId: {experienceId}</p>
      <p>sessionId: {sessionId}</p>
      <div style={{ marginTop: 12, padding: 12, border: "1px solid #333", borderRadius: 8 }}>
        <h3>Round UI (placeholder)</h3>
        <p>Status: {session?.status ?? "loading..."}</p>
        <p>Game: {session?.game?.name ?? "-"} ({session?.game?.type ?? "-"})</p>
        <button
          style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#7C3AED", color: "#fff" }}
          onClick={() => setEvents(prev => ["[client] action submitted", ...prev])}
        >
          Submit Action
        </button>
      </div>
      <div style={{ marginTop: 16 }}>
        <h3>Live Events</h3>
        <ul>
          {events.map((e, i) => (
            <li key={i} style={{ fontFamily: "monospace" }}>{e}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}


