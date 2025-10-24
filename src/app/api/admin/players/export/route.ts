import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (!accountId) return new Response('accountId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: members } = await supabase.from('members').select('id, display_name').eq('account_id', accountId);
  const memberIds = (members ?? []).map(m => m.id);
  const nameById: Record<string,string> = {}; for (const m of members ?? []) nameById[m.id as string] = m.display_name as string || (m.id as string).slice(0,8);

  if (!memberIds.length) return new Response('', { headers: { 'content-type': 'text/csv' } });

  let q = supabase
    .from('credit_ledger')
    .select('member_id, type, amount, created_at')
    .in('member_id', memberIds);
  if (from) q = q.gte('created_at', from);
  if (to) q = q.lte('created_at', to);
  const { data: ledger } = await q;

  const stats: Record<string, { entries: number; spent: number; won: number; last: string | null }> = {};
  for (const id of memberIds) stats[id as string] = { entries: 0, spent: 0, won: 0, last: null };
  for (const r of ledger ?? []) {
    const s = stats[r.member_id as string] || (stats[r.member_id as string] = { entries: 0, spent: 0, won: 0, last: null });
    if (r.type === 'spend') { s.spent += Math.abs(Number(r.amount ?? 0)); s.entries += 1; }
    if (r.type === 'award') { s.won += Number(r.amount ?? 0); }
    s.last = r.created_at as string;
  }

  const rows = [['member_id','display_name','entries','credits_spent','credits_won','net','last_seen_at']];
  for (const id of memberIds) {
    const s = stats[id as string]; const net = (s?.won ?? 0) - (s?.spent ?? 0);
    rows.push([id, nameById[id] ?? id.slice(0,8), String(s?.entries ?? 0), String(s?.spent ?? 0), String(s?.won ?? 0), String(net), s?.last ?? '']);
  }

  const csv = rows.map(r => r.map(v => String(v).includes(',') ? `"${String(v).replace(/"/g,'""')}"` : String(v)).join(',')).join('\n');
  return new Response(csv, { headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename="players.csv"' } });
}


