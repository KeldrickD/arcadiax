import { createClient } from '@supabase/supabase-js';
import { withSentry, logRequest } from '../../../../../sentry.server.config';

export const POST = withSentry(async (request: Request, { params }: { params: Promise<{ sessionId: string }> }) => {
  const t0 = Date.now();
  const { sessionId } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: session, error: sErr } = await supabase
    .from('game_sessions')
    .select('id, status, entry_cost, game:games(account_id)')
    .eq('id', sessionId)
    .maybeSingle();
  if (sErr) return new Response(sErr.message, { status: 500 });
  if (!session) return new Response('Not found', { status: 404 });
  if (!['lobby','live'].includes(session.status as string)) {
    return new Response(JSON.stringify({ ok: false, error: 'NOT_CANCELABLE' }), { headers: { 'content-type': 'application/json' } });
  }

  const accountId = (session as any)?.game?.account_id as string | undefined;
  if (!accountId) return new Response('Missing account', { status: 500 });

  if (session.status === 'live') {
    // Refund all entrants
    const { data: entrants } = await supabase
      .from('entries')
      .select('member_id')
      .eq('session_id', sessionId);
    const entryCost = (session.entry_cost ?? 0) as number;
    if (entryCost > 0) {
      const rows = (entrants ?? []).map(e => ({ member_id: e.member_id, type: 'refund', amount: entryCost, reference_type: 'session_cancel', reference_id: sessionId, idempotency_key: `refund:${sessionId}:${e.member_id}` }));
      if (rows.length) {
        await supabase.from('credit_ledger').upsert(rows, { onConflict: 'idempotency_key' });
      }
    }
  }

  await supabase.from('game_sessions').update({ status: 'cancelled' }).eq('id', sessionId);
  const res = new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  logRequest('/api/sessions/[id]/cancel', { session_id: sessionId, duration_ms: Date.now() - t0 });
  return res;
}, '/api/sessions/[id]/cancel');


