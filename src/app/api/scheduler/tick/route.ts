import { createClient } from '@supabase/supabase-js';
import { withSentry, logRequest } from '../../../../sentry.server.config';

// Call this via cron every minute. It starts queued rounds whose start time has arrived,
// and auto-closes rounds whose duration elapsed (best-effort, idempotent)
export const GET = withSentry(async (request: Request) => {
  const t0 = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const now = new Date();

  // Start due rounds
  const { data: due } = await supabase
    .from('rounds_queue')
    .select('id, session_id, type, payload, answer, duration_sec')
    .lte('starts_at', now.toISOString())
    .eq('status', 'pending')
    .limit(10);

  for (const q of due ?? []) {
    try {
      const body: any = { type: q.type, durationSec: q.duration_sec };
      if (q.type === 'trivia') {
        body.question = q.payload?.question; body.options = q.payload?.options; body.answerId = q.answer?.answerId;
      } else if (q.type === 'prediction') {
        body.prompt = q.payload?.prompt; body.answerTemplate = q.answer ?? {};
      } else if (q.type === 'raffle') {
        body.prompt = q.payload?.prompt; body.winners = q.payload?.winners ?? 1;
      }
      await fetch(`${new URL(request.url).origin}/api/sessions/${q.session_id}/rounds/start`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      await supabase.from('rounds_queue').update({ status: 'running' }).eq('id', q.id);
    } catch {}
  }

  // Auto-close expired active rounds
  const { data: active } = await supabase
    .from('game_rounds')
    .select('id, session_id, started_at, payload')
    .eq('state', 'active')
    .limit(50);
  for (const r of active ?? []) {
    const dur = Number((r as any)?.payload?.durationSec ?? 0);
    if (!dur) continue;
    const endMs = (r.started_at ? new Date(r.started_at as any).getTime() : now.getTime()) + dur * 1000;
    if (Date.now() >= endMs) {
      try { await fetch(`${new URL(request.url).origin}/api/sessions/${r.session_id}/rounds/close`, { method: 'POST' }); } catch {}
    }
  }

  console.log(JSON.stringify({ kind: 'scheduler_tick', started: (due ?? []).length, checked: (active ?? []).length, ts: Date.now() }));
  const res = new Response(JSON.stringify({ ok: true, started: (due ?? []).length, checked: (active ?? []).length }), { headers: { 'content-type': 'application/json' } });
  logRequest('/api/scheduler/tick', { duration_ms: Date.now() - t0, started: (due ?? []).length, checked: (active ?? []).length });
  return res;
}, '/api/scheduler/tick');


