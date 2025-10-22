import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { accountId, type, name } = body;
  if (!accountId || !type || !name) return new Response('Missing fields', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('games')
    .insert({ account_id: accountId, type, name, status: 'draft', config: {}, branding: {} })
    .select('id')
    .maybeSingle();
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ ok: true, id: data?.id }), { headers: { 'content-type': 'application/json' } });
}



