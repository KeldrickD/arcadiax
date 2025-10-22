import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const memberId = searchParams.get('memberId');
  if (!sessionId || !memberId) return new Response('sessionId and memberId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data } = await supabase
    .from('entries')
    .select('id')
    .eq('session_id', sessionId)
    .eq('member_id', memberId)
    .maybeSingle();
  return new Response(JSON.stringify({ joined: !!data }), { headers: { 'content-type': 'application/json' } });
}


