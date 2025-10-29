"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Game = { id: string; name: string; type: string };

export function CreateGameForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [name, setName] = useState('New Game');
  const [type, setType] = useState<'trivia' | 'raffle' | 'spin' | 'prediction'>('trivia');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch('/api/creator/games', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId, type, name }),
      });
      const raw = await r.text();
      let j: any = {}; try { j = JSON.parse(raw); } catch { j = { error: raw }; }
      if (!r.ok || !j.ok) throw new Error(j.error || 'Failed to create');
      setMsg('Game created');
      router.refresh();
    } catch (err: any) {
      setMsg(`Error: ${err?.message ?? 'unknown'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card" style={{ display: 'grid', gap: 8, padding: 12 }}>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Name</span>
        <input value={name} onChange={e => setName(e.target.value)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
      </label>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Type</span>
        <select value={type} onChange={e => setType(e.target.value as any)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }}>
          <option value="trivia">Trivia</option>
          <option value="raffle">Raffle</option>
          <option value="spin">Spin</option>
          <option value="prediction">Prediction</option>
        </select>
      </label>
      <button disabled={busy} type="submit" style={{ background: '#7C3AED', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>
        {busy ? 'Creating…' : 'Create Game'}
      </button>
      {msg && <div style={{ fontSize: 12 }}>{msg}</div>}
    </form>
  );
}

export function ScheduleSessionForm({ games }: { games: Game[] }) {
  const router = useRouter();
  const [gameId, setGameId] = useState(games[0]?.id ?? '');
  const [entryCost, setEntryCost] = useState<number>(10);
  const [scheduleAt, setScheduleAt] = useState<string>('');
  const [prizeType, setPrizeType] = useState<'credits' | 'role' | 'cash' | 'xp'>('credits');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch('/api/creator/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gameId, entryCost, scheduleAt: scheduleAt || undefined, prizeType }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'Failed to schedule');
      setMsg('Session scheduled');
      router.refresh();
    } catch (err: any) {
      setMsg(`Error: ${err?.message ?? 'unknown'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Game</span>
        <select value={gameId} onChange={e => setGameId(e.target.value)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }}>
          {games.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.type})</option>
          ))}
        </select>
      </label>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Entry cost</span>
        <input type="number" min={0} value={entryCost} onChange={e => setEntryCost(parseInt(e.target.value || '0', 10))} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
      </label>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Start time</span>
        <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
      </label>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Prize type</span>
        <select value={prizeType} onChange={e => setPrizeType(e.target.value as any)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }}>
          <option value="credits">Credits</option>
          <option value="role">Role</option>
          <option value="cash">Cash</option>
          <option value="xp">XP</option>
        </select>
      </label>
      <button disabled={busy} type="submit" style={{ background: '#00E0FF', color: '#000', padding: '8px 12px', borderRadius: 8 }}>
        {busy ? 'Scheduling…' : 'Schedule Session'}
      </button>
      {msg && <div style={{ fontSize: 12 }}>{msg}</div>}
    </form>
  );
}

export function StartTriviaRoundForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState('2+2?');
  const [options, setOptions] = useState([{ id: 'a', label: '3' }, { id: 'b', label: '4' }]);
  const [answerId, setAnswerId] = useState('b');
  const [duration, setDuration] = useState(15);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/sessions/${sessionId}/rounds/start`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, options, answerId, durationSec: duration })
      });
      if (!r.ok) throw new Error('Failed to start round');
      setMsg('Round started'); router.refresh();
    } catch (err: any) { setMsg(`Error: ${err?.message ?? 'unknown'}`); }
    setBusy(false);
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Question</span>
        <input value={question} onChange={e=>setQuestion(e.target.value)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
      </label>
      <div>
        <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Options</span>
        {options.map((opt, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <input value={opt.label} onChange={e => {
              const next = [...options]; next[idx] = { ...next[idx], label: e.target.value }; setOptions(next);
            }} style={{ padding: 6, border: '1px solid #333', borderRadius: 8, flex: 1 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="radio" name="ans" checked={answerId === opt.id} onChange={()=>setAnswerId(opt.id)} /> Correct
            </label>
          </div>
        ))}
      </div>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Duration (s)</span>
        <input type="number" min={5} value={duration} onChange={e => setDuration(parseInt(e.target.value || '15', 10))} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
      </label>
      <button disabled={busy} type="submit" style={{ background: '#7C3AED', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>
        {busy ? 'Starting…' : 'Start Trivia Round'}
      </button>
      {msg && <div style={{ fontSize: 12 }}>{msg}</div>}
    </form>
  );
}

export function QueueRoundForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [type, setType] = useState<'trivia'|'prediction'|'raffle'>('trivia');
  const [question, setQuestion] = useState('2+2?');
  const [options, setOptions] = useState([{ id: 'a', label: '3' }, { id: 'b', label: '4' }]);
  const [answerId, setAnswerId] = useState('b');
  const [prompt, setPrompt] = useState('Predict BTC close');
  const [winners, setWinners] = useState(1);
  const [duration, setDuration] = useState(20);
  const [startsAt, setStartsAt] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const payload: any = { type, durationSec: duration };
      if (type === 'trivia') { payload.question = question; payload.options = options; payload.answer = { answerId }; }
      if (type === 'prediction') { payload.prompt = prompt; payload.answer = {}; }
      if (type === 'raffle') { payload.prompt = prompt; payload.answer = {}; payload.winners = winners; }
      const r = await fetch('/api/creator/rounds/queue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, startsAt, ...payload }) });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Queue failed');
      setMsg('Round queued'); router.refresh();
    } catch (err: any) { setMsg(`Error: ${err?.message ?? 'unknown'}`); }
    setBusy(false);
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Type</span>
        <select value={type} onChange={e=>setType(e.target.value as any)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }}>
          <option value="trivia">Trivia</option>
          <option value="prediction">Prediction</option>
          <option value="raffle">Raffle</option>
        </select>
      </label>
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Starts at</span>
        <input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
      </label>
      {type==='trivia' && (
        <>
          <label>
            <span style={{ display: 'block', fontSize: 12 }}>Question</span>
            <input value={question} onChange={e=>setQuestion(e.target.value)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
          </label>
          <div>
            <span style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Options</span>
            {options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input value={opt.label} onChange={e => { const next=[...options]; next[idx]={...next[idx], label:e.target.value}; setOptions(next); }} style={{ padding: 6, border: '1px solid #333', borderRadius: 8, flex: 1 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="radio" name="ansq" checked={answerId === opt.id} onChange={()=>setAnswerId(opt.id)} /> Correct
                </label>
              </div>
            ))}
          </div>
        </>
      )}
      {type!=='trivia' && (
        <label>
          <span style={{ display: 'block', fontSize: 12 }}>Prompt</span>
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
        </label>
      )}
      {type==='raffle' && (
        <label>
          <span style={{ display: 'block', fontSize: 12 }}>Winners</span>
          <input type="number" min={1} value={winners} onChange={e=>setWinners(parseInt(e.target.value || '1',10))} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
        </label>
      )}
      <label>
        <span style={{ display: 'block', fontSize: 12 }}>Duration (s)</span>
        <input type="number" min={5} value={duration} onChange={e => setDuration(parseInt(e.target.value || '20', 10))} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
      </label>
      <button disabled={busy} type="submit" style={{ background: '#00E0FF', color: '#000', padding: '8px 12px', borderRadius: 8 }}>
        {busy ? 'Queueing…' : 'Queue Round'}
      </button>
      {msg && <div style={{ fontSize: 12 }}>{msg}</div>}
    </form>
  );
}

export function CreatorSettingsForm({ accountId }: { accountId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [allowRaffles, setAllowRaffles] = useState(true);
  const [allowPredictions, setAllowPredictions] = useState(true);
  const [quietStartHour, setQuietStartHour] = useState(22);
  const [quietEndHour, setQuietEndHour] = useState(8);
  const [pushDailyCap, setPushDailyCap] = useState(3);
  const [feedDailyCap, setFeedDailyCap] = useState(5);

  useState(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/creator/settings?accountId=${accountId}`, { cache: 'no-store' });
        const j = await r.json();
        if (j?.settings) {
          setAllowRaffles(!!j.settings.allowRaffles);
          setAllowPredictions(!!j.settings.allowPredictions);
          setQuietStartHour(Number(j.settings.quietStartHour ?? 22));
          setQuietEndHour(Number(j.settings.quietEndHour ?? 8));
          setPushDailyCap(Number(j.settings.pushDailyCap ?? 3));
          setFeedDailyCap(Number(j.settings.feedDailyCap ?? 5));
        }
      } catch {}
      setLoading(false);
    })();
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      const r = await fetch('/api/creator/settings', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accountId, allowRaffles, allowPredictions, quietStartHour, quietEndHour, pushDailyCap, feedDailyCap }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || 'Save failed');
      setMsg('Settings saved');
    } catch (err: any) { setMsg(`Error: ${err?.message ?? 'unknown'}`); }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
      <h4 style={{ margin: 0 }}>Community Settings</h4>
      {loading ? <div>Loading…</div> : (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={allowRaffles} onChange={e=>setAllowRaffles(e.target.checked)} /> Allow Raffles
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={allowPredictions} onChange={e=>setAllowPredictions(e.target.checked)} /> Allow Predictions
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>
              <span style={{ display: 'block', fontSize: 12 }}>Quiet start hour</span>
              <input type="number" min={0} max={23} value={quietStartHour} onChange={e=>setQuietStartHour(parseInt(e.target.value || '22',10))} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
            </label>
            <label>
              <span style={{ display: 'block', fontSize: 12 }}>Quiet end hour</span>
              <input type="number" min={0} max={23} value={quietEndHour} onChange={e=>setQuietEndHour(parseInt(e.target.value || '8',10))} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>
              <span style={{ display: 'block', fontSize: 12 }}>Push daily cap</span>
              <input type="number" min={0} max={50} value={pushDailyCap} onChange={e=>setPushDailyCap(parseInt(e.target.value || '3',10))} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
            </label>
            <label>
              <span style={{ display: 'block', fontSize: 12 }}>Feed daily cap</span>
              <input type="number" min={0} max={50} value={feedDailyCap} onChange={e=>setFeedDailyCap(parseInt(e.target.value || '5',10))} style={{ padding: 8, border: '1px solid #333', borderRadius: 8 }} />
            </label>
          </div>
        </>
      )}
      <button disabled={saving} type="submit" style={{ background: '#7C3AED', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>{saving?'Saving…':'Save Settings'}</button>
      {msg && <div style={{ fontSize: 12 }}>{msg}</div>}
    </form>
  );
}



