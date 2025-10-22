import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing Supabase service role key' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const body = await request.json().catch(() => ({}));
  let memberId: string | undefined = body.memberId;
  const payload = body.payload ?? {};

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Validate session state
  const { data: session, error: sErr } = await supabase
    .from('game_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .maybeSingle();

  if (sErr) return new Response(JSON.stringify({ ok: false, error: sErr.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  if (!session) return new Response(JSON.stringify({ ok: false, error: 'Session not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
  if (session.status !== 'lobby' && session.status !== 'live') {
    return new Response(JSON.stringify({ ok: false, error: 'Actions closed' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  // Resolve account_id via session -> game
  const { data: sessRow } = await supabase.from('game_sessions').select('game_id').eq('id', sessionId).maybeSingle();
  const gameId = (sessRow as any)?.game_id as string | undefined;
  const { data: gameRows, error: gErr } = await supabase
    .from('games')
    .select('account_id')
    .eq('id', gameId)
    .limit(1);
  if (gErr) return new Response(JSON.stringify({ ok: false, error: gErr.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  const accountId = gameRows?.[0]?.account_id as string | undefined;

  // If memberId missing or invalid and bypass dev is on, auto-provision a demo member
  const isUuid = (v?: string) => !!v && /^[0-9a-fA-F-]{36}$/.test(v);
  if ((!memberId || !isUuid(memberId)) && process.env.WHOP_BYPASS_AUTH === 'true') {
    if (!accountId) return new Response(JSON.stringify({ ok: false, error: 'accountId not found' }), { status: 500, headers: { 'content-type': 'application/json' } });
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
      if (mErr) return new Response(JSON.stringify({ ok: false, error: mErr.message }), { status: 500, headers: { 'content-type': 'application/json' } });
      memberId = created?.id as string;
    }
  }

  if (!isUuid(memberId)) {
    return new Response(JSON.stringify({ ok: false, error: 'memberId must be a UUID' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  // Enforce entry: must exist before actions
  const { data: entry, error: entErr } = await supabase
    .from('entries')
    .select('id')
    .eq('session_id', sessionId)
    .eq('member_id', memberId)
    .maybeSingle();
  if (entErr) return new Response(JSON.stringify({ ok: false, error: entErr.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  if (!entry) return new Response(JSON.stringify({ ok: false, error: 'NOT_ENTERED' }), { status: 200, headers: { 'content-type': 'application/json' } });

  // Insert action
  const { data: rounds } = await supabase
    .from('game_rounds')
    .select('id, state')
    .eq('session_id', sessionId)
    .order('index', { ascending: false })
    .limit(1);
  let round = rounds?.[0];
  if (!round || round.state !== 'active') {
    if (process.env.DEV_AUTO_ROUND === 'true') {
      const { data: created, error: createErr } = await supabase
        .from('game_rounds')
        .insert({ session_id: sessionId, index: 1, state: 'active', payload: {} })
        .select('id, state')
        .maybeSingle();
      if (createErr) return new Response(JSON.stringify({ ok: false, error: createErr.message }), { status: 500, headers: { 'content-type': 'application/json' } });
      round = created as any;
    } else {
      return new Response(JSON.stringify({ ok: false, error: 'No active round' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
  }

  const { data: action, error: aErr } = await supabase
    .from('actions')
    .insert({ round_id: round.id, member_id: memberId, payload })
    .select('id')
    .maybeSingle();
  if (aErr) return new Response(JSON.stringify({ ok: false, error: aErr.message }), { status: 500, headers: { 'content-type': 'application/json' } });

  // Naive scoring placeholder: +1 per action
  const { data: updated, error: uErr } = await supabase
    .from('actions')
    .update({ score: 1, result: 'pending' })
    .eq('id', action?.id)
    .select('id, score')
    .maybeSingle();
  if (uErr) return new Response(JSON.stringify({ ok: false, error: uErr.message }), { status: 500, headers: { 'content-type': 'application/json' } });

  return new Response(JSON.stringify({ ok: true, actionId: action?.id, score: updated?.score ?? 0 }), {
    headers: { 'content-type': 'application/json' },
  });
}
