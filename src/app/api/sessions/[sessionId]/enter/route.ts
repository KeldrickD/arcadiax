import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = await request.json().catch(() => ({}));
  let memberId: string | undefined = body.memberId;
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
  if (session.status !== 'lobby' && session.status !== 'live') return new Response('Session closed', { status: 400 });

  // Resolve accountId for potential dev member creation
  const accountId = (session as any)?.game?.account_id as string | undefined;

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

  return new Response(JSON.stringify({ ok: true, entryId: entry?.id ?? null }), { headers: { 'content-type': 'application/json' } });
}


