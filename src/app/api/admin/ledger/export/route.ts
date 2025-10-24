import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const memberId = searchParams.get('memberId');
  if (!accountId) return new Response('accountId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: members } = await supabase.from('members').select('id').eq('account_id', accountId);
  const memberIds = (members ?? []).map(m => m.id);
  if (!memberIds.length) return new Response('', { headers: { 'content-type': 'text/csv' } });

  let q = supabase
    .from('credit_ledger')
    .select('member_id, type, amount, reference_type, reference_id, created_at')
    .in('member_id', memberIds)
    .order('created_at', { ascending: false });
  if (from) q = q.gte('created_at', from);
  if (to) q = q.lte('created_at', to);
  if (memberId) q = q.eq('member_id', memberId);
  const { data, error } = await q;
  if (error) return new Response(error.message, { status: 500 });

  const rows = [['timestamp','account_id','member_id','change','reason','ref_type','ref_id']];
  for (const r of data ?? []) rows.push([
    r.created_at ?? '',
    accountId,
    r.member_id,
    String(r.amount ?? 0),
    r.type,
    r.reference_type ?? '',
    r.reference_id ?? ''
  ]);

  const csv = rows.map(r => r.map(v => String(v).includes(',') ? `"${String(v).replace(/"/g,'""')}"` : String(v)).join(',')).join('\n');
  return new Response(csv, { headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename="ledger.csv"' } });
}


