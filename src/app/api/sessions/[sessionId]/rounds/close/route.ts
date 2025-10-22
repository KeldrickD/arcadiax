import { createClient } from '@supabase/supabase-js';
import { postToFeed, sendPush } from '@/lib/whop';

// Closes the active round, then settles it in a DB transaction via arcx_settle_trivia_round
export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Move session to 'closed' if live
  await supabase.from('game_sessions').update({ status: 'closed' }).eq('id', sessionId).in('status', ['live']);

  // Attempt atomic settlement (trivia path). For prediction/raffle, custom logic below.
  let settleJson: any = null;
  try {
    const { data, error } = await supabase.rpc('arcx_settle_trivia_round', { p_session_id: sessionId });
    if (error) throw error;
    settleJson = data;
  } catch (e) {
    // Determine round type
    const { data: round } = await supabase
      .from('game_rounds')
      .select('id, answer, payload')
      .eq('session_id', sessionId)
      .eq('state', 'active')
      .maybeSingle();
    if (!round) return new Response(JSON.stringify({ ok: false, error: 'NO_ACTIVE_ROUND' }), { headers: { 'content-type': 'application/json' } });
    const type = (round as any)?.payload?.type ?? 'trivia';
    if (type === 'prediction') {
      // outcome assumed provided in body or payload.answer.outcome
      const body = await request.json().catch(()=>({}));
      const outcome = body.outcome ?? (round as any)?.answer?.outcome;
      if (outcome == null) return new Response(JSON.stringify({ ok:false, error:'MISSING_OUTCOME' }), { headers: { 'content-type':'application/json' } });
      // Simple payout: exact match -> 10x entry_cost; within band -> 2x (band +/-1 if numeric)
      const { data: sess } = await supabase.from('game_sessions').select('entry_cost').eq('id', sessionId).maybeSingle();
      const entryCost = sess?.entry_cost ?? 0;
      const { data: entries } = await supabase.from('entries').select('member_id, paid_credits, payload').eq('session_id', sessionId);
      const winners: string[] = [];
      for (const e of entries ?? []) {
        const guess = e.payload?.guess ?? e.payload?.value;
        let mult = 0;
        if (guess === outcome) mult = 10; else if (typeof guess === 'number' && typeof outcome === 'number' && Math.abs(guess - outcome) <= 1) mult = 2;
        const payout = Math.floor((e.paid_credits ?? entryCost) * mult);
        if (payout > 0) {
          winners.push(e.member_id as string);
          await supabase.from('credit_ledger').insert({ member_id: e.member_id, type: 'award', amount: payout, reference_type: 'session', reference_id: sessionId, notes: 'prediction payout' });
        }
      }
      await supabase.from('game_rounds').update({ state: 'settled', ended_at: new Date().toISOString() }).eq('id', (round as any).id);
      settleJson = { ok: true, winners, outcome };
    } else if (type === 'raffle') {
      // Weighted raffle: each entry is one ticket (extend later)
      const { data: entries } = await supabase.from('entries').select('member_id').eq('session_id', sessionId);
      const tickets = (entries ?? []).map(e => e.member_id as string);
      const winners: string[] = [];
      const numWinners = Number((round as any)?.payload?.winners ?? 1);
      for (let i = 0; i < numWinners && tickets.length > 0; i++) {
        const idx = Math.floor(Math.random() * tickets.length);
        winners.push(tickets[idx]);
        tickets.splice(idx, 1);
      }
      for (const w of winners) {
        await supabase.from('credit_ledger').insert({ member_id: w, type: 'award', amount: 50, reference_type: 'session', reference_id: sessionId, notes: 'raffle prize' });
      }
      await supabase.from('game_rounds').update({ state: 'settled', ended_at: new Date().toISOString() }).eq('id', (round as any).id);
      settleJson = { ok: true, winners };
    } else {
      const answerId = (round as any)?.answer?.answerId;
      await supabase.from('game_rounds').update({ state: 'settled', ended_at: new Date().toISOString() }).eq('id', (round as any).id);
      settleJson = { ok: true, winners: [], answerId };
    }
  }

  // Broadcast settle info via synthetic action row (client listens via realtime)
  try {
    const { data: activeRound } = await supabase
      .from('game_rounds')
      .select('id')
      .eq('session_id', sessionId)
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (activeRound?.id) {
      await supabase
        .from('actions')
        .insert({ round_id: activeRound.id, member_id: null as any, payload: { system: 'settled', winners: settleJson?.winners ?? [], answerId: settleJson?.answerId ?? null }, score: null, result: 'system' });
    }
  } catch {}

  // Optional: refresh wallets MV if present
  try { await supabase.rpc('refresh_wallets'); } catch {}

  // Feed/Push settle announcement
  try {
    const { data: sess } = await supabase
      .from('game_sessions')
      .select('game_id')
      .eq('id', sessionId)
      .maybeSingle();
    const { data: game } = await supabase
      .from('games')
      .select('account_id, name')
      .eq('id', sess?.game_id)
      .maybeSingle();
    if (game?.account_id) {
      await postToFeed({ companyId: game.account_id, title: 'Round settled', body: `Winners: ${(settleJson?.winners ?? []).length}` });
      await sendPush({ companyId: game.account_id, title: 'Round settled', body: `Check the winners!` });
    }
  } catch {}

  return new Response(JSON.stringify(settleJson ?? { ok: true }), { headers: { 'content-type': 'application/json' } });
}


