import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  if (!accountId) return new Response('accountId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: members } = await supabase.from('members').select('id').eq('account_id', accountId);
  const memberIds = (members ?? []).map(m => m.id);
  if (!memberIds.length) return new Response(JSON.stringify({ items: [] }), { headers: { 'content-type': 'application/json' } });

  // recent awards from credit_ledger
  const { data: ledger } = await supabase
    .from('credit_ledger')
    .select('member_id, amount, created_at, reference_type, reference_id')
    .in('member_id', memberIds)
    .eq('type', 'award')
    .order('created_at', { ascending: false })
    .limit(20);

  const winnerIds = Array.from(new Set((ledger ?? []).map(l => l.member_id as string)));
  const { data: mrows } = await supabase
    .from('members')
    .select('id, display_name, avatar_url')
    .in('id', winnerIds);
  const byId: Record<string, any> = {}; for (const m of mrows ?? []) byId[m.id as string] = m;

  const items = (ledger ?? []).map(l => ({
    memberId: l.member_id,
    name: byId[l.member_id as string]?.display_name ?? (l.member_id as string).slice(0,8),
    avatar: byId[l.member_id as string]?.avatar_url ?? null,
    amount: l.amount,
    at: l.created_at,
  }));

  return new Response(JSON.stringify({ items }), { headers: { 'content-type': 'application/json' } });
}


