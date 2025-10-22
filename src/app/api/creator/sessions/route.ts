import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { gameId, scheduleAt, entryCost, prizeType } = body;
  if (!gameId) return new Response('gameId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase service role', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      game_id: gameId,
      schedule_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
      status: 'lobby',
      entry_cost: entryCost ?? 0,
      prize_type: prizeType ?? 'credits',
      prize_config: {},
    })
    .select('id')
    .maybeSingle();
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ ok: true, id: data?.id }), { headers: { 'content-type': 'application/json' } });
}



