import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');
  if (!accountId) return new Response('accountId required', { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return new Response('Missing Supabase env', { status: 500 });
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: games } = await supabase.from('games').select('id, name, type').eq('account_id', accountId);
  const gameIdToGame: Record<string, { name: string; type: string }> = {};
  for (const g of games ?? []) gameIdToGame[g.id as string] = { name: g.name as string, type: g.type as string };
  const gameIds = (games ?? []).map(g => g.id);
  const { data: sessions, error } = await supabase
    .from('game_sessions')
    .select('id, game_id, status, schedule_at, entry_cost, created_at')
    .in('game_id', gameIds)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) return new Response(error.message, { status: 500 });

  const sessionIds = (sessions ?? []).map(s => s.id);
  const counts: Record<string, number> = {};
  if (sessionIds.length) {
    const { data: agg } = await supabase
      .from('entries')
      .select('session_id, count:id')
      .in('session_id', sessionIds)
      .group('session_id');
    for (const a of agg ?? []) counts[(a as any).session_id] = Number((a as any).count ?? 0);
  }

  const rows = [['session_id','game_name','game_type','status','scheduled_at','created_at','entry_cost','joined']];
  for (const s of sessions ?? []) rows.push([
    s.id,
    gameIdToGame[s.game_id]?.name ?? '',
    gameIdToGame[s.game_id]?.type ?? '',
    s.status,
    s.schedule_at ?? '',
    s.created_at ?? '',
    String(s.entry_cost ?? 0),
    String(counts[s.id] ?? 0)
  ]);

  const csv = rows.map(r => r.map(v => String(v).includes(',') ? `"${String(v).replace(/"/g,'""')}"` : String(v)).join(',')).join('\n');
  return new Response(csv, { headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename="sessions.csv"' } });
}


