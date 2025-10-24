import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  if (!accountId) return new Response('accountId required', { status: 400 });

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('games')
    .select('id, name, type, status')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ items: data ?? [] }), {
    headers: { 'content-type': 'application/json' },
  });
}

