"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from '@/lib/supabaseClient';

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
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ memberId: string; total: number }>>([]);
  const [enterResult, setEnterResult] = useState<string | null>(null);
  const [joined, setJoined] = useState<boolean>(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [entering, setEntering] = useState<boolean>(false);
  const [starting, setStarting] = useState<boolean>(false);
  const [closing, setClosing] = useState<boolean>(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [autoClosing, setAutoClosing] = useState<boolean>(false);
  const [answerLocked, setAnswerLocked] = useState<boolean>(false);
  const [correctAnswerId, setCorrectAnswerId] = useState<string | null>(null);
  const actionsChannelRef = useRef<any>(null);

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

  // Resolve a member (dev) and fetch wallet balance
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const u = new URLSearchParams(window.location.search);
        let mid = u.get('memberId');
        if (!mid) {
          const m = await fetch(`/api/members?accountId=${experienceId}`);
          const jm = await m.json();
          mid = jm.items?.[0]?.id ?? null;
        }
        if (!mid) return;
        if (!aborted) setMemberId(mid);
        const w = await fetch(`/api/wallet?memberId=${mid}`);
        const jw = await w.json();
        if (!aborted) setBalance(jw.balance ?? 0);

        // Check if already entered this session; if so, mark joined to enable actions
        try {
          const supabase = getSupabaseClient();
          const { data: entry } = await supabase
            .from('entries')
            .select('id')
            .eq('session_id', sessionId)
            .eq('member_id', mid)
            .maybeSingle();
          if (!aborted && entry) setJoined(true);
        } catch {}
      } catch {}
    })();
    return () => { aborted = true; };
  }, [experienceId]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const subscribeActions = (rid: string) => {
      if (actionsChannelRef.current) supabase.removeChannel(actionsChannelRef.current);
      actionsChannelRef.current = supabase
        .channel(`actions_${sessionId}_${rid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'actions', filter: `round_id=eq.${rid}` }, payload => {
          // Detect system settle message
          const p: any = (payload as any)?.new?.payload;
          if (p?.system === 'settled') {
            setCorrectAnswerId(p.answerId ?? null);
            setToast('Round settled'); setTimeout(()=>setToast(null), 2000);
          }
          setEvents(prev => [`action ${payload.eventType}`, ...prev].slice(0, 50));
          // refresh leaderboard on action changes
          void fetch(`/api/leaderboard?sessionId=${sessionId}`).then(r => r.json()).then(j => setLeaderboard(j.items ?? [])).catch(() => {});
        })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            setEvents(prev => [`actions channel ${status}`, ...prev].slice(0, 50));
          }
        });
    };

    // initial active round
    // prefer active round; fallback to most recent
    (async () => {
      const active = await supabase
        .from('game_rounds')
        .select('id, state, index')
        .eq('session_id', sessionId)
        .eq('state', 'active')
        .order('index', { ascending: false })
        .limit(1);
      let rid = active.data?.[0]?.id as string | undefined;
      if (!rid) {
        const latest = await supabase
          .from('game_rounds')
          .select('id, state, index')
          .eq('session_id', sessionId)
          .order('index', { ascending: false })
          .limit(1);
        rid = latest.data?.[0]?.id as string | undefined;
      }
      if (rid) {
        setRoundId(rid);
        subscribeActions(rid);
        // load round details
        const { data } = await supabase
          .from('game_rounds')
          .select('id, state, payload, started_at')
          .eq('id', rid)
          .maybeSingle();
        const p = (data as any)?.payload;
        if (p?.type === 'trivia') {
          setQuestion(p.question ?? null);
          setOptions(Array.isArray(p.options) ? p.options : []);
          // timer
          const dur = Number(p.durationSec ?? 0);
          const startMs = data?.started_at ? new Date(data.started_at as any).getTime() : Date.now();
          if (dur > 0) setTimeLeft(Math.max(0, Math.ceil((startMs + dur * 1000 - Date.now()) / 1000)));
        } else {
          setQuestion(null); setOptions([]); setTimeLeft(null);
        }
      } else {
        setEvents(prev => ['no round found', ...prev]);
      }
    })();

    const roundsChannel = supabase
      .channel(`rounds_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rounds', filter: `session_id=eq.${sessionId}` }, async payload => {
        setEvents(prev => [`round ${payload.eventType}`, ...prev].slice(0, 50));
        const { data } = await supabase
          .from('game_rounds')
          .select('id, state, index, payload, started_at')
          .eq('session_id', sessionId)
          .order('state', { ascending: false })
          .order('index', { ascending: false })
          .limit(1);
        const rid = data?.[0]?.id as string | undefined;
        if (rid && rid !== roundId) {
          setRoundId(rid);
          subscribeActions(rid);
          const p = (data?.[0] as any)?.payload;
          if (p?.type === 'trivia') {
            setQuestion(p.question ?? null);
            setOptions(Array.isArray(p.options) ? p.options : []);
            const dur = Number(p.durationSec ?? 0);
            const startMs = (data?.[0] as any)?.started_at ? new Date((data?.[0] as any)?.started_at).getTime() : Date.now();
            if (dur > 0) setTimeLeft(Math.max(0, Math.ceil((startMs + dur * 1000 - Date.now()) / 1000)));
            setAnswerLocked(false);
            setCorrectAnswerId(null);
          } else {
            setQuestion(null); setOptions([]); setTimeLeft(null);
          }
        }
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setEvents(prev => [`rounds channel ${status}`, ...prev].slice(0, 50));
        }
      });

    // initial leaderboard
    void fetch(`/api/leaderboard?sessionId=${sessionId}`).then(r => r.json()).then(j => setLeaderboard(j.items ?? [])).catch(() => {});

    return () => {
      if (actionsChannelRef.current) supabase.removeChannel(actionsChannelRef.current);
      supabase.removeChannel(roundsChannel);
    };
  }, [sessionId]);

  // countdown timer
  useEffect(() => {
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      if (!autoClosing) {
        setAutoClosing(true);
        // auto-close and settle, then optionally auto-start another template
        (async () => {
          try {
            await fetch(`/api/sessions/${sessionId}/rounds/close`, { method: 'POST' });
            setToast('Round auto-closed'); setTimeout(()=>setToast(null), 2000);
            // simple auto-next template (same question)
            await fetch(`/api/sessions/${sessionId}/rounds/start`, {
              method: 'POST', headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ question: '2+3?', options: [{id:'a',label:'4'},{id:'b',label:'5'}], answerId: 'b', durationSec: 15 })
            });
          } finally {
            setAutoClosing(false);
          }
        })();
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => (t == null ? t : Math.max(0, t - 1))), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, sessionId, autoClosing]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Session</h2>
      <p>experienceId: {experienceId}</p>
      <p>sessionId: {sessionId}</p>
      <div style={{ marginTop: 12, padding: 12, border: "1px solid #333", borderRadius: 8 }}>
        <h3>Round UI (placeholder)</h3>
        <p>Status: {session?.status ?? "loading..."}</p>
        <p>Game: {session?.game?.name ?? "-"} ({session?.game?.type ?? "-"})</p>
        <p>Entry cost: {session?.entry_cost ?? 0}</p>
        <p>Balance: {balance ?? '…'} credits</p>
        {question && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>{question}</div>
            {options.map(opt => (
              <label key={opt.id} style={{ display: 'block', marginTop: 6 }}>
                <input type="radio" name="answer" value={opt.id} checked={selectedAnswerId === opt.id} onChange={() => setSelectedAnswerId(opt.id)} />{' '}
                {opt.label}
              </label>
            ))}
            {timeLeft != null && (
              <div style={{ marginTop: 6, opacity: 0.8 }}>Time left: {timeLeft}s</div>
            )}
          </div>
        )}
        <button
          disabled={joined || entering}
          style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: joined ? "#888" : "#00E0FF", color: "#000", marginRight: 8, cursor: joined ? 'not-allowed' : 'pointer' }}
          onClick={async () => {
            if (joined || entering) return;
            setEntering(true);
            try {
              const r = await fetch(`/api/sessions/${sessionId}/enter`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ memberId: 'dev' }),
              });
              const j = await r.json();
              setEnterResult(JSON.stringify(j));
              if (j.ok) {
                setJoined(true);
                setToast('Joined! Entry accepted.');
                if (balance != null && (session?.entry_cost ?? 0) > 0) {
                  setBalance(Math.max(0, balance - (session?.entry_cost ?? 0)));
                } else if (memberId) {
                  // refresh balance from API
                  fetch(`/api/wallet?memberId=${memberId}`).then(r=>r.json()).then(jw=> setBalance(jw.balance ?? balance)).catch(()=>{});
                }
                setTimeout(() => setToast(null), 4000);
              } else if (j.error === 'INSUFFICIENT_CREDITS') {
                setToast('Not enough credits.');
                setTimeout(() => setToast(null), 4000);
              }
            } catch {
              setEnterResult('error');
            }
            setEntering(false);
          }}
        >
          {joined ? 'Entered' : entering ? 'Entering…' : 'Enter (deduct credits)'}
        </button>
        {joined && (
          <p style={{ marginTop: 8, color: '#16a34a' }}>Joined! You can now play.</p>
        )}
        {!joined && (
          <p style={{ marginTop: 8, color: '#eab308' }}>Enter first to enable actions.</p>
        )}
        {enterResult && (
          <p style={{ marginTop: 8, fontFamily: 'monospace' }}>Entry: {enterResult}</p>
        )}
        <div style={{ marginTop: 8 }}>
          <button
            style={{ marginRight: 8, padding: '6px 10px', borderRadius: 8, background: '#7C3AED', color: '#fff' }}
            disabled={starting}
            onClick={async () => {
              setStarting(true);
              try {
                await fetch(`/api/sessions/${sessionId}/rounds/start`, {
                  method: 'POST', headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ question: '2+2?', options: [{id:'a',label:'3'},{id:'b',label:'4'}], answerId: 'b', durationSec: 15 })
                });
                setToast('Round started'); setTimeout(()=>setToast(null), 2500);
              } finally { setStarting(false); }
            }}>Start Round</button>
          <button
            style={{ padding: '6px 10px', borderRadius: 8, background: '#ffbe0b', color: '#000' }}
            disabled={closing}
            onClick={async () => {
              setClosing(true);
              try {
                await fetch(`/api/sessions/${sessionId}/rounds/close`, { method: 'POST' });
                setToast('Round closed and settled'); setTimeout(()=>setToast(null), 2500);
              } finally { setClosing(false); }
            }}>Close & Settle</button>
        </div>
        <button
          disabled={!joined}
          style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#7C3AED", color: "#fff" }}
          onClick={async () => {
            if (!joined) {
              setToast('Enter the session first');
              setTimeout(() => setToast(null), 3000);
              return;
            }
            if (!selectedAnswerId) {
              setToast('Pick an answer first');
              setTimeout(() => setToast(null), 2000);
              return;
            }
            setEvents(prev => ["[client] action submitted", ...prev]);
            try {
            const r = await fetch(`/api/sessions/${sessionId}/action`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ memberId: 'demo-member', payload: { answerId: selectedAnswerId } }),
              });
              const j = await r.json();
              setActionResult(JSON.stringify(j));
            if (j.ok) setAnswerLocked(true);
            } catch (e) {
              setActionResult('error');
            }
          }}
        >
          Submit Action
        </button>
        {actionResult && (
          <p style={{ marginTop: 8, fontFamily: 'monospace' }}>Action: {actionResult}</p>
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <h3>Live Events (Supabase Realtime)</h3>
        <ul>
          {events.map((e, i) => (
            <li key={i} style={{ fontFamily: "monospace" }}>{e}</li>
          ))}
        </ul>
      </div>
      {correctAnswerId && (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #333', borderRadius: 8 }}>
          <div>Correct answer: {options.find(o => o.id === correctAnswerId)?.label ?? correctAnswerId}</div>
          {selectedAnswerId && (
            <div style={{ color: selectedAnswerId === correctAnswerId ? '#16a34a' : '#dc2626' }}>
              Your answer: {options.find(o => o.id === selectedAnswerId)?.label ?? selectedAnswerId} — {selectedAnswerId === correctAnswerId ? 'Correct' : 'Incorrect'}
            </div>
          )}
        </div>
      )}
      {toast && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, background: '#1A1B23', color: '#F8FAFC', padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <h3>Leaderboard</h3>
        <ol>
          {leaderboard.map(item => (
            <li key={item.memberId} style={{ fontFamily: 'monospace' }}>
              {item.memberId.slice(0, 8)}… — {item.total}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}


