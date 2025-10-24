import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  const status = searchParams.get('status') || undefined; // lobby|live|closed|settled
  const type = searchParams.get('type') || undefined;     // trivia|prediction|raffle|spin
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = (page - 1) * limit;
  if (!accountId) return new Response('accountId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: games } = await supabase.from('games').select('id, name, type').eq('account_id', accountId);
  const gameIdToGame: Record<string, { name: string; type: string }> = {};
  for (const g of games ?? []) gameIdToGame[g.id as string] = { name: g.name as string, type: g.type as string };
  const gameIds = (games ?? []).map(g => g.id);
  let q = supabase
    .from('game_sessions')
    .select('id, game_id, status, schedule_at, entry_cost, created_at')
    .in('game_id', gameIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) q = q.eq('status', status);
  if (from) q = q.gte('created_at', from);
  if (to) q = q.lte('created_at', to);
  const { data: sessions, error } = await q;
  if (error) return new Response(error.message, { status: 500 });

  const sessionIds = (sessions ?? []).map(s => s.id);
  const counts: Record<string, number> = {};
  if (sessionIds.length) {
    const { data: rows } = await supabase
      .from('entries')
      .select('session_id')
      .in('session_id', sessionIds);
    for (const r of rows ?? []) {
      const sid = (r as any).session_id as string;
      counts[sid] = (counts[sid] ?? 0) + 1;
    }
  }

  const items = (sessions ?? []).map(s => ({
    id: s.id,
    status: s.status,
    gameId: s.game_id,
    gameName: gameIdToGame[s.game_id]?.name ?? '',
    gameType: gameIdToGame[s.game_id]?.type ?? '',
    scheduleAt: s.schedule_at,
    createdAt: s.created_at,
    entryCost: s.entry_cost,
    joined: counts[s.id] ?? 0,
  }));

  return new Response(JSON.stringify({ items, page, limit }), { headers: { 'content-type': 'application/json' } });
}


