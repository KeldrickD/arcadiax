import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return new Response('sessionId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const [active, completed, queue] = await Promise.all([
    supabase.from('game_rounds').select('id, state, index, payload, started_at, ended_at').eq('session_id', sessionId).eq('state','active').maybeSingle(),
    supabase.from('game_rounds').select('id, state, index, payload, started_at, ended_at').eq('session_id', sessionId).in('state',['closed','settled']).order('ended_at',{ascending:false}).limit(10),
    supabase.from('rounds_queue').select('id, type, payload, starts_at, duration_sec, status').eq('session_id', sessionId).order('starts_at',{ascending:true}).limit(25),
  ]);

  return new Response(JSON.stringify({
    active: active.data ?? null,
    completed: completed.data ?? [],
    queue: queue.data ?? [],
  }), { headers: { 'content-type': 'application/json' } });
}


