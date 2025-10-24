import { createClient } from '@supabase/supabase-js';
import { withSentry, logRequest } from '../../../../../sentry.server.config';
import { rateLimitKey } from '../../../../../lib/rateLimit';

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  // In dev bypass, allow GET to act like POST for convenience
  if (process.env.WHOP_BYPASS_AUTH === 'true') {
    return await POST(new Request(request.url, { method: 'POST', body: JSON.stringify({}) }), { params });
  }
  return new Response(
    JSON.stringify({
      ok: false,
      message: 'Use POST with JSON body to enter a session',
      example: {
        url: `/api/sessions/${sessionId}/enter`,
        body: { memberId: 'uuid-optional-under-bypass' },
      },
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}

export const POST = withSentry(async (request: Request, { params }: { params: Promise<{ sessionId: string }> }) => {
  const t0 = Date.now();
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || request.headers.get('x-real-ip') || null;
  if (!rateLimitKey(String(ip), '/api/sessions/enter', 60, 60)) return new Response(JSON.stringify({ ok:false, error:'RATE_LIMIT_IP' }), { status: 429, headers: { 'content-type': 'application/json' } });
  const { sessionId } = await params;
  const body = await request.json().catch(() => ({}));
  let memberId: string | undefined = body.memberId;
  // Simple in-memory rate limiter (best-effort per instance)
  (globalThis as any).__arcx_join_rl = (globalThis as any).__arcx_join_rl || new Map<string, number[]>();
  const key = `${memberId || 'unknown'}:${sessionId}`;
  const now = Date.now();
  const winMs = 10_000; const max = 5;
  const arr: number[] = (globalThis as any).__arcx_join_rl.get(key) || [];
  const keep = arr.filter(t => now - t < winMs);
  if (keep.length >= max) return new Response(JSON.stringify({ ok:false, error:'RATE_LIMIT' }), { headers:{'content-type':'application/json'}, status: 429 });
  keep.push(now); (globalThis as any).__arcx_join_rl.set(key, keep);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Load session and entry cost
  const { data: session, error: sErr } = await supabase
    .from('game_sessions')
    .select('id, entry_cost, status, game:games(account_id)')
    .eq('id', sessionId)
    .maybeSingle();
  if (sErr) return new Response(sErr.message, { status: 500 });
  if (!session) return new Response('Session not found', { status: 404 });
  // Only allow entry during lobby
  if (session.status !== 'lobby') return new Response(JSON.stringify({ ok: false, error: 'ENTRY_CLOSED' }), { status: 200, headers: { 'content-type': 'application/json' } });

  // Resolve accountId for potential dev member creation
  const accountId = (session as any)?.game?.account_id as string | undefined;
  if (!accountId) return new Response('accountId not found', { status: 500 });

  // DB-level rate limit (defense in depth)
  const rl = await supabase.rpc('arcx_rate_limit_join', { _account: accountId, _member: memberId, _max: 5, _seconds: 10 });
  if ((rl as any)?.error) {
    return new Response(JSON.stringify({ ok: false, error: 'RATE_LIMIT' }), { status: 429, headers: { 'content-type': 'application/json' } });
  }

  // Dev bypass: resolve or create a member if missing/invalid
  const isUuid = (v?: string) => !!v && /^[0-9a-fA-F-]{36}$/.test(v);
  if ((!memberId || !isUuid(memberId)) && process.env.WHOP_BYPASS_AUTH === 'true') {
    if (!accountId) return new Response('accountId not found', { status: 500 });
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('account_id', accountId)
      .limit(1);
    if (existing && existing.length > 0) {
      memberId = existing[0].id as string;
    } else {
      const { data: created, error: mErr } = await supabase
        .from('members')
        .insert({ account_id: accountId, whop_user_id: 'dev-user', role: 'member', balance_credits: 100 })
        .select('id')
        .maybeSingle();
      if (mErr) return new Response(mErr.message, { status: 500 });
      memberId = created?.id as string;
    }
  }

  if (!memberId || !isUuid(memberId)) return new Response('memberId required', { status: 400 });

  const cost = session.entry_cost ?? 0;
  if (cost > 0) {
    // Verify balance
    const { data: member, error: mErr } = await supabase
      .from('members')
      .select('id, balance_credits')
      .eq('id', memberId)
      .maybeSingle();
    if (mErr) return new Response(mErr.message, { status: 500 });
    if (!member) return new Response('Member not found', { status: 404 });
    if ((member.balance_credits ?? 0) < cost) {
      return new Response(JSON.stringify({ ok: false, error: 'INSUFFICIENT_CREDITS' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    // Deduct + ledger + rake (10%)
    const rake = Math.floor(cost * 0.10);
    const net = cost - rake;
    const { error: spendErr } = await supabase.rpc('arcx_spend_and_ledger', {
      p_member_id: memberId,
      p_spend_amount: cost,
      p_session_id: sessionId,
      p_rake_amount: rake,
    });
    if (spendErr) {
      // Fallback (dev): do best-effort atomic update + ledger writes
      const { data: after, error: updErr } = await supabase
        .from('members')
        .update({ balance_credits: (member.balance_credits as number) - cost })
        .eq('id', memberId)
        .gte('balance_credits', cost)
        .select('id, balance_credits')
        .maybeSingle();
      if (updErr || !after) {
        return new Response(JSON.stringify({ ok: false, error: spendErr.message || updErr?.message || 'SPEND_FAILED' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        });
      }
      await supabase
        .from('credit_ledger')
        .insert({ member_id: memberId, type: 'spend', amount: -cost, reference_type: 'session', reference_id: sessionId, notes: 'entry spend (fallback)' });
      if (rake > 0) {
        await supabase
          .from('credit_ledger')
          .insert({ member_id: memberId, type: 'rake', amount: -rake, reference_type: 'session', reference_id: sessionId, notes: 'platform rake (fallback)' });
      }
    }
  }

  // Create entry if not exists
  const { data: entry, error: eErr } = await supabase
    .from('entries')
    .upsert({ session_id: sessionId, member_id: memberId, paid_credits: cost }, { onConflict: 'session_id,member_id', ignoreDuplicates: true })
    .select('id')
    .maybeSingle();
  if (eErr) return new Response(eErr.message, { status: 500 });

  const res = new Response(JSON.stringify({ ok: true, entryId: entry?.id ?? null }), { headers: { 'content-type': 'application/json' } });
  logRequest('/api/sessions/[id]/enter', { session_id: sessionId, duration_ms: Date.now() - t0 });
  return res;
}, '/api/sessions/[id]/enter');


