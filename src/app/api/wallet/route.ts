import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!url || !anon) return new Response('Missing Supabase env', { status: 500 });
  if (!memberId) return new Response('memberId required', { status: 400 });

  const supabase = createClient(url, anon);
  const { data: member, error: mErr } = await supabase
    .from('members')
    .select('id, balance_credits')
    .eq('id', memberId)
    .single();

  if (mErr) return new Response(mErr.message, { status: 500 });

  const { data: ledger, error: lErr } = await supabase
    .from('credit_ledger')
    .select('id, type, amount, created_at, reference_type, reference_id')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (lErr) return new Response(lErr.message, { status: 500 });

  return new Response(JSON.stringify({ balance: member?.balance_credits ?? 0, ledger: ledger ?? [] }), {
    headers: { 'content-type': 'application/json' },
  });
}

