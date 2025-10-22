import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  if (!accountId) return new Response('accountId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, anon);
  const { data, error } = await supabase
    .from('members')
    .select('id, whop_user_id, balance_credits, created_at')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(25);
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ items: data ?? [] }), { headers: { 'content-type': 'application/json' } });
}



