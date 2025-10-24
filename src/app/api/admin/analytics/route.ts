import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  if (!accountId) return new Response('accountId required', { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Entries
  const { data: gameRows } = await supabase.from('games').select('id').eq('account_id', accountId);
  const gameIds = (gameRows ?? []).map(g => g.id);
  const { data: sessRows } = await supabase.from('game_sessions').select('id').in('game_id', gameIds);
  const sessionIds = (sessRows ?? []).map(s => s.id);

  let entriesTotal = 0;
  let dau = 0;
  let wau = 0;
  if (sessionIds.length > 0) {
    const [{ data: cnt }] = await Promise.all([
      supabase.from('entries').select('id', { count: 'exact', head: true }).in('session_id', sessionIds),
    ]);
    entriesTotal = (cnt as any)?.length ?? (cnt as any)?.count ?? (cnt as any) ?? 0;

    const now = new Date();
    const d1 = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: dauRows } = await supabase.from('entries').select('member_id').in('session_id', sessionIds).gte('created_at', d1);
    const { data: wauRows } = await supabase.from('entries').select('member_id').in('session_id', sessionIds).gte('created_at', d7);
    dau = new Set((dauRows ?? []).map(r => r.member_id as string)).size;
    wau = new Set((wauRows ?? []).map(r => r.member_id as string)).size;
  }

  // Purchases/GMV/ARPPU
  const { data: members } = await supabase.from('members').select('id').eq('account_id', accountId);
  const memberIds = (members ?? []).map(m => m.id);
  let creditsSold = 0; let gmvUsd = 0; let payers = 0;
  if (memberIds.length > 0) {
    const { data: iaps } = await supabase
      .from('iap_purchases')
      .select('member_id, credits_awarded, amount_usd, status')
      .in('member_id', memberIds)
      .eq('status', 'succeeded');
    creditsSold = (iaps ?? []).reduce((a, b) => a + (b.credits_awarded ?? 0), 0);
    gmvUsd = (iaps ?? []).reduce((a, b) => a + Number(b.amount_usd ?? 0), 0);
    payers = new Set((iaps ?? []).map(i => i.member_id as string)).size;
  }
  const arppu = payers > 0 ? gmvUsd / payers : 0;

  // Rake (absolute)
  let rakeCredits = 0;
  if (memberIds.length > 0) {
    const { data: ledger } = await supabase
      .from('credit_ledger')
      .select('member_id, type, amount')
      .in('member_id', memberIds)
      .eq('type', 'rake');
    rakeCredits = Math.abs((ledger ?? []).reduce((a, b) => a + Number(b.amount ?? 0), 0));
  }

  return new Response(JSON.stringify({
    entriesTotal,
    creditsSold,
    gmvUsd,
    rakeCredits,
    dau,
    wau,
    arppu,
  }), { headers: { 'content-type': 'application/json' } });
}


