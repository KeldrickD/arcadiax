import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !anon || !serviceKey) return new Response('Missing Supabase env', { status: 500 });

  const anonClient = createClient(url, anon, { auth: { persistSession: false } });
  const serviceClient = createClient(url, serviceKey, { auth: { persistSession: false } });

  const anonRes = await anonClient.from('games').select('id').limit(1);
  const serviceRes = await serviceClient.from('games').select('id').limit(1);

  const anonDenied = !!anonRes.error; // expected true after strict RLS
  const serviceOk = !serviceRes.error;

  return new Response(JSON.stringify({ ok: anonDenied && serviceOk, anonDenied, serviceOk, anonError: anonRes.error?.message ?? null }), {
    headers: { 'content-type': 'application/json' },
  });
}


